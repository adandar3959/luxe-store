let currentPage = 1;
const itemsPerPage = 8; // 👈 Set limit to 8 products
let currentFilteredProducts = []; // Store products globally to handle page switching

document.addEventListener('DOMContentLoaded', () => {
    loadCategoryPage();
});

async function loadCategoryPage() {
    const titleElement = document.getElementById('categoryTitle');
    const descElement = document.getElementById('categoryDesc');
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('catId');
    const searchFilter = urlParams.get('search');

    try {
        const [prodRes, catRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/categories')
        ]);

        let products = await prodRes.json();
        const categories = await catRes.json();
        if (catId) {
            const currentCategory = categories.find(c => c._id === catId);
            if (currentCategory) {
                titleElement.innerText = `${currentCategory.name} Collection`;
                descElement.innerText = `Browse our exclusive ${currentCategory.name} styles.`;

                products = products.filter(p => {
                    if (p.category === catId) return true;
                    const pCatObj = categories.find(c => c._id === p.category);
                    if (pCatObj && pCatObj.parentId === catId) return true;
                    return false;
                });
            }
        } 
        else if (searchFilter) {
            titleElement.innerText = `Results for "${searchFilter}"`;
            products = products.filter(p => p.name.toLowerCase().includes(searchFilter.toLowerCase()));
        }
        currentFilteredProducts = products;
        currentPage = 1; 
        renderPagination();

    } catch (error) {
        console.error("Error loading category page:", error);
        document.getElementById('allProductsContainer').innerHTML = '<h3 style="color:red; text-align:center;">Server Error</h3>';
    }
}

function renderPagination() {
    const productContainer = document.getElementById('allProductsContainer');
    const paginationContainer = document.getElementById('pagination');
    const wishlist = JSON.parse(localStorage.getItem('wishlist')) || []; // Get current wishlist

    productContainer.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (currentFilteredProducts.length === 0) {
        productContainer.innerHTML = `<h3 style="text-align:center; width:100%;">No products found.</h3>`;
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = currentFilteredProducts.slice(start, end);

    paginatedItems.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        const isLiked = wishlist.some(item => item.id === product._id);
        const heartIcon = isLiked ? 'bxs-heart' : 'bx-heart';

        const imgUrl = product.image ? (product.image.startsWith('http') ? product.image : `/uploads/${product.image}`) : 'https://via.placeholder.com/300';

        card.innerHTML = `
            <div class="img-box">
                <img src="${imgUrl}" alt="${product.name}" class="product-img" onclick="window.location.href='product.html?id=${product._id}'">
                <div class="wishlist-icon" onclick="toggleWishlist(event, '${encodeURIComponent(JSON.stringify(product))}')">
                    <i class='bx ${heartIcon}'></i>
                </div>
            </div>
            <div class="product-details" onclick="window.location.href='product.html?id=${product._id}'">
                <span class="product-brand">${product.brand}</span>
                <h4 class="product-title">${product.name}</h4>
                <div class="product-price">Rs. ${product.price.toLocaleString()}</div>
            </div>
        `;
        productContainer.appendChild(card);
    });

    setupPaginationButtons();
}
function toggleWishlist(event, productData) {
    event.stopPropagation(); // Prevent opening product page
    const product = JSON.parse(decodeURIComponent(productData));
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    const existingIndex = wishlist.findIndex(item => item.id === product._id);
    const icon = event.currentTarget.querySelector('i');

    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        icon.classList.replace('bxs-heart', 'bx-heart');
    } else {
        wishlist.push({
            id: product._id,
            name: product.name,
            price: product.price,
            image: product.image 
        });
        icon.classList.replace('bx-heart', 'bxs-heart');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}
function setupPaginationButtons() {
    const paginationContainer = document.getElementById('pagination');
    const pageCount = Math.ceil(currentFilteredProducts.length / itemsPerPage);
    if (pageCount <= 1) return; 

    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('div');
        btn.innerText = i;
        btn.classList.add('page-btn');
        
        if (i === currentPage) {
            btn.classList.add('active');
        }

        btn.addEventListener('click', () => {
            currentPage = i;
            renderPagination(); // Re-render products for new page
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top smoothly
        });

        paginationContainer.appendChild(btn);
    }
}
