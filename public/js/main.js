let currentHomePage = 1;
const homeItemsPerPage = 8; 
let globalHomeProducts = []; 

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();          
    loadUserCart(); 
    loadHomeCategories();
});
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param); 
}

async function loadProducts() {
    const productContainer = document.getElementById('productContainer');
    if(!productContainer) return; 
    const categoryNameFilter = getQueryParam('category'); // From Footer links
    const catIdFilter = getQueryParam('catId');           // From Category cards
    const searchFilter = getQueryParam('search');

    productContainer.innerHTML = '<h2>Loading Products...</h2>';

    try {
        const [prodRes, catRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/categories')
        ]);

        let products = await prodRes.json();
        const categories = await catRes.json();
        const sectionTitle = document.querySelector('.products-section .section-header h2');
        if (sectionTitle) {
            if (categoryNameFilter) {
                sectionTitle.innerText = `${categoryNameFilter} Collection`;
            } else if (catIdFilter) {
                const catObj = categories.find(c => c._id === catIdFilter);
                sectionTitle.innerText = catObj ? `${catObj.name} Collection` : 'Collection';
            } else if (searchFilter) {
                sectionTitle.innerText = `Results for "${searchFilter}"`;
            } else {
                sectionTitle.innerText = 'Trending Now';
            }
        }
        if (categoryNameFilter) {
            products = products.filter(p => {
                const pCatObj = categories.find(c => c._id === p.category);
                if (pCatObj && pCatObj.name.toLowerCase() === categoryNameFilter.toLowerCase()) return true;
                if (pCatObj && pCatObj.parentId) {
                    const parent = categories.find(c => c._id === pCatObj.parentId);
                    return parent && parent.name.toLowerCase() === categoryNameFilter.toLowerCase();
                }
                return false;
            });
        }
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
        globalHomeProducts = products; 
        currentHomePage = 1;           
        renderHomePagination();        

    } catch (error) {
        console.error("Load Products Error:", error);
        productContainer.innerHTML = '<h3 style="color:red">Error connecting to server.</h3>';
    }
}

function renderHomePagination() {
    const productContainer = document.getElementById('productContainer');
    const paginationContainer = document.getElementById('homePagination');

    if(!productContainer) return;
    productContainer.innerHTML = '';
    if(paginationContainer) paginationContainer.innerHTML = '';

    if (globalHomeProducts.length === 0) {
        productContainer.innerHTML = `<h3 style="grid-column: 1/-1; text-align:center; padding: 50px 0;">No products found in this category.</h3>`;
        return;
    }

    const start = (currentHomePage - 1) * homeItemsPerPage;
    const end = start + homeItemsPerPage;
    const paginatedItems = globalHomeProducts.slice(start, end);

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
                <span class="product-brand">${product.brand || 'LUXE'}</span>
                <h4 class="product-title">${product.name}</h4>
                <div class="product-price">Rs. ${product.price.toLocaleString()}</div>
            </div>
        `;
        productContainer.appendChild(card);
    });

    const pageCount = Math.ceil(globalHomeProducts.length / homeItemsPerPage);
    if (pageCount > 1 && paginationContainer) {
        for (let i = 1; i <= pageCount; i++) {
            const btn = document.createElement('div');
            btn.innerText = i;
            btn.classList.add('page-btn');
            if (i === currentHomePage) btn.classList.add('active');
            btn.addEventListener('click', () => {
                currentHomePage = i;
                renderHomePagination();
                document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
            });
            paginationContainer.appendChild(btn);
        }
    }
}

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
        }
    } catch (error) { console.error("Cart Load Error", error); }
}

async function loadHomeCategories() {
    const container = document.getElementById('homeCategoryContainer');
    if (!container) return;

    try {
        const [catRes, prodRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/products')
        ]);

        const categories = await catRes.json();
        const products = await prodRes.json();

        container.innerHTML = '';
        const displayCategories = categories.filter(c => !c.parentId);

        displayCategories.forEach(cat => {
            const count = products.filter(p => {
                if (p.category === cat._id) return true;
                const pCatObj = categories.find(c => c._id === p.category);
                return pCatObj && pCatObj.parentId === cat._id;
            }).length;
            let bgImage = 'https://via.placeholder.com/400x600?text=No+Image';
            
            if (cat.image) {
                bgImage = cat.image.startsWith('http') ? cat.image : `/uploads/${cat.image}`;
            } else {
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
document.querySelector('.newsletter-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;

    const API_URL = 'https://luxe-store-nmvs.onrender.com/api/newsletter/subscribe';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert("Subscribed successfully!");
            e.target.reset();
        } else {
            alert(data.message || "Subscription failed.");
        }
    } catch (err) {
        console.error("Newsletter Error:", err);
        alert("Subscription failed. Make sure your server is online.");
    }
});
