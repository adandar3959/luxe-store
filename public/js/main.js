let currentHomePage = 1;
const homeItemsPerPage = 8; // Limit to 8 products per page
let globalHomeProducts = []; // Store products for pagination

document.addEventListener('DOMContentLoaded', () => {
    // Note: Navbar is handled by nav.js now
    loadProducts();         
    loadUserCart(); 
    loadHomeCategories();
});

async function loadProducts() {
    const productContainer = document.getElementById('productContainer');
    if(!productContainer) return; 

    // Optional: Check if index.html still receives filters (usually handled by category.html now)
    const urlParams = new URLSearchParams(window.location.search);
    const catIdFilter = urlParams.get('catId'); 
    const searchFilter = urlParams.get('search');

    productContainer.innerHTML = '<h2>Loading...</h2>';

    try {
        const [prodRes, catRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/categories')
        ]);

        let products = await prodRes.json();
        const categories = await catRes.json();

        // Update Title if filter exists (Legacy support for index.html)
        const sectionTitle = document.querySelector('.section-header h2');
        if (sectionTitle) {
            if (catIdFilter) {
                const catObj = categories.find(c => c._id === catIdFilter);
                sectionTitle.innerText = catObj ? `${catObj.name} Collection` : 'Collection';
            } else if (searchFilter) {
                sectionTitle.innerText = `Results for "${searchFilter}"`;
            } else {
                sectionTitle.innerText = 'Trending Now';
            }
        }

        // --- FILTERING LOGIC ---
        if (catIdFilter) {
            products = products.filter(p => {
                if (p.category === catIdFilter) return true;
                const pCatObj = categories.find(c => c._id === p.category);
                if (pCatObj && pCatObj.parentId === catIdFilter) return true;
                return false;
            });
        }

        if (searchFilter) {
            const term = searchFilter.toLowerCase();
            products = products.filter(p => p.name.toLowerCase().includes(term));
        }

        // --- SAVE & RENDER ---
        globalHomeProducts = products; // Save filtered list
        currentHomePage = 1;           // Reset to page 1
        renderHomePagination();        // Render first 8

    } catch (error) {
        console.error(error);
        productContainer.innerHTML = '<h3 style="color:red">Error connecting to server.</h3>';
    }
}

// --- RENDER FUNCTION (Handles Slicing 8 items) ---
function renderHomePagination() {
    const productContainer = document.getElementById('productContainer');
    const paginationContainer = document.getElementById('homePagination');

    productContainer.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (globalHomeProducts.length === 0) {
        productContainer.innerHTML = `<h3>No products found.</h3>`;
        return;
    }

    // A. Calculate Slice
    const start = (currentHomePage - 1) * homeItemsPerPage;
    const end = start + homeItemsPerPage;
    const paginatedItems = globalHomeProducts.slice(start, end);

    // B. Render Cards
    paginatedItems.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.onclick = () => window.location.href = `product.html?id=${product._id}`;

        const imgUrl = product.image ? (product.image.startsWith('http') ? product.image : `/uploads/${product.image}`) : 'https://via.placeholder.com/300';

        card.innerHTML = `
            <div class="img-box">
                <img src="${imgUrl}" alt="${product.name}" class="product-img">
            </div>
            <div class="product-details">
                <span class="product-brand">${product.brand}</span>
                <h4 class="product-title">${product.name}</h4>
                <div class="product-price">Rs. ${product.price.toLocaleString()}</div>
            </div>
        `;
        productContainer.appendChild(card);
    });

    // C. Create Buttons
    const pageCount = Math.ceil(globalHomeProducts.length / homeItemsPerPage);
    if (pageCount > 1) {
        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('div');
            btn.innerText = i;
            btn.classList.add('page-btn');
            if (i === currentHomePage) btn.classList.add('active');

            btn.addEventListener('click', () => {
                currentHomePage = i;
                renderHomePagination();
                // Scroll to top of products section
                document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
            });

            paginationContainer.appendChild(btn);
        }
    }
}

// ... Keep your updateNavbar/loadUserCart logic here if strictly needed, 
// but typically nav.js handles the navbar now. ...

async function loadUserCart() {
    const token = localStorage.getItem('userToken');
    if (!token) return; 

    try {
        const response = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const serverCartItems = await response.json();
            if (Array.isArray(serverCartItems)) {
                const formattedCart = serverCartItems.map(item => ({
                    id: item.product, 
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.qty || 1, 
                    size: item.size,
                    color: item.color || "Default"
                }));
                localStorage.setItem('cart', JSON.stringify(formattedCart));
            }
            // If you have a cart count function in main.js, call it:
            // updateCartCount();
        }
    } catch (error) { console.error("Cart Load Error", error); }
}

async function loadHomeCategories() {
    const container = document.getElementById('homeCategoryContainer');
    if (!container) return;

    try {
        // Fetch Categories & Products (Parallel for speed)
        const [catRes, prodRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/products')
        ]);

        const categories = await catRes.json();
        const products = await prodRes.json();

        container.innerHTML = '';

        // Filter only Parent Categories (e.g. Men, Women) to keep it clean
        // (Or remove .filter if you want to show subcategories too)
        const displayCategories = categories.filter(c => !c.parentId);

        displayCategories.forEach(cat => {
            // 1. Calculate Product Count
            // Matches if product category ID matches OR if product is in a subcategory of this parent
            const count = products.filter(p => {
                if (p.category === cat._id) return true;
                const pCatObj = categories.find(c => c._id === p.category);
                return pCatObj && pCatObj.parentId === cat._id;
            }).length;

            // 2. Determine Background Image
            // Priority: Category Image -> First Product's Image -> Default Placeholder
            let bgImage = 'https://via.placeholder.com/400x600?text=No+Image';
            
            if (cat.image) {
                bgImage = cat.image.startsWith('http') ? cat.image : `/uploads/${cat.image}`;
            } else {
                // Find a product in this category to steal its image
                const representativeProduct = products.find(p => {
                    if (p.category === cat._id) return true;
                    const pCatObj = categories.find(c => c._id === p.category);
                    return pCatObj && pCatObj.parentId === cat._id;
                });
                
                if (representativeProduct && representativeProduct.image) {
                    bgImage = representativeProduct.image.startsWith('http') 
                        ? representativeProduct.image 
                        : `/uploads/${representativeProduct.image}`;
                }
            }

            // 3. Create Card HTML
            const card = document.createElement('div');
            card.className = 'cat-card';
            card.onclick = () => window.location.href = `category.html?catId=${cat._id}`;

            card.innerHTML = `
                <img src="${bgImage}" alt="${cat.name}">
                <div class="cat-overlay">
                    <div class="cat-info">
                        <h3>${cat.name}</h3>
                        <p>${count} Products <i class='bx bx-right-arrow-alt'></i></p>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading home categories:", error);
        container.innerHTML = '<p>Failed to load categories.</p>';
    }
}   