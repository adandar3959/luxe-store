// --- HELPER: Handles all image logic ---
function resolveImg(imgInput) {
    const BACKEND_URL = '/uploads/';
    const FALLBACK_IMG = 'https://via.placeholder.com/600?text=No+Image';
    if (!imgInput) return FALLBACK_IMG;
    let cleanName = typeof imgInput === 'object' ? (imgInput.fileName || imgInput.url || '') : imgInput;
    if (!cleanName) return FALLBACK_IMG;
    if (cleanName.startsWith('http')) return cleanName;
    const formattedName = cleanName.startsWith('/') ? cleanName.substring(1) : cleanName;
    return `${BACKEND_URL}${formattedName}`;
}

// --- Sync Cart to MongoDB ---
async function syncCartToDB(cart) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = localStorage.getItem('userToken');
    if (!userInfo || !token) return; 
    try {
        await fetch('/api/cart', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                cartItems: cart.map(item => ({
                    product: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    qty: item.quantity,
                    size: item.size,
                    color: item.color || "Default"
                })) 
            })
        });
    } catch (error) { console.error("Sync Error", error); }
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return;

    try {
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();

        document.title = `${product.name} | LUXE`;
        document.getElementById('productName').innerText = product.name;
        document.getElementById('productPrice').innerText = `Rs. ${product.price.toLocaleString()}`;
        document.getElementById('productDesc').innerText = product.description;

        const mainImage = document.getElementById('mainImg');
        const smallImagesContainer = document.querySelector('.small-images');
        const firstImgData = (product.images && product.images.length > 0) ? product.images[0] : product.image;
        mainImage.src = resolveImg(firstImgData);

        smallImagesContainer.innerHTML = ''; 
        if (product.images && product.images.length > 0) {
            product.images.forEach((imgData, index) => {
                const img = document.createElement('img');
                img.src = resolveImg(imgData);
                img.classList.add('sm-img');
                if (index === 0) img.classList.add('active');
                img.onclick = function() {
                    mainImage.src = this.src;
                    document.querySelectorAll('.sm-img').forEach(el => el.classList.remove('active'));
                    this.classList.add('active');
                };
                smallImagesContainer.appendChild(img);
            });
        }

        // FIX 1: Pass the whole product to render sizes correctly
        renderVariations(product);
        
        // FIX 2: Correct function call for related products
        loadRelatedProducts(product._id);
        
        setupButtons(product);

    } catch (error) { console.error("Error loading product:", error); }
});

// FIX: Updated to use the 'sizes' array from your Admin panel
function renderVariations(product) {
    const sizeContainer = document.querySelector('.sizes');
    if (!sizeContainer) return;
    sizeContainer.innerHTML = ''; 

    // Look for the 'sizes' array we added in the Admin panel
    const availableSizes = product.sizes || [];

    if (availableSizes.length === 0) {
        sizeContainer.innerHTML = '<p>One Size Available</p>';
        return;
    }

    availableSizes.forEach((size, index) => {
        const btn = document.createElement('div');
        btn.classList.add('size-box');
        btn.innerText = size;
        
        // Auto-select the first size
        if (index === 0) btn.classList.add('active');

        btn.onclick = () => {
            document.querySelectorAll('.size-box').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        sizeContainer.appendChild(btn);
    });
}

// FIX: Ensure this hits the correct API path
async function loadRelatedProducts(currentId) {
    const container = document.getElementById('relatedContainer');
    if (!container) return;
    try {
        const res = await fetch('/api/products');
        const allProducts = await res.json();
        const related = allProducts.filter(p => p._id !== currentId).slice(0, 4);

        container.innerHTML = '';
        if (related.length === 0) {
            container.innerHTML = '<p style="color:#888;">No related products found.</p>';
            return;
        }

        related.forEach(p => {
            const displayImg = resolveImg(p.image);
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                <div class="img-box">
                    <img src="${displayImg}" class="product-img" style="height:250px; object-fit:cover; width:100%">
                </div>
                <div class="product-details" style="padding:10px">
                    <h4 style="font-size:14px">${p.name}</h4>
                    <div style="color:#695CFE; font-weight:bold">Rs. ${p.price.toLocaleString()}</div>
                </div>
            `;
            card.onclick = () => window.location.href = `product.html?id=${p._id}`;
            container.appendChild(card);
        });
    } catch (err) { console.error("Error loading related products", err); }
}

function setupButtons(product) {
    const cartBtn = document.querySelector('.btn-primary'); 
    const quantityInput = document.getElementById('quantity');

    if (product.countInStock <= 0) {
        cartBtn.innerText = "Out of Stock";
        cartBtn.disabled = true;
        cartBtn.style.backgroundColor = "#ccc"; 
        return; 
    }

    cartBtn.onclick = () => {
        const selectedSize = document.querySelector('.size-box.active');
        const sizeValue = selectedSize ? selectedSize.innerText : 'One Size';
        const quantityToAdd = parseInt(quantityInput.value) || 1;

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.id === product._id && item.size === sizeValue);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantityToAdd;
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: resolveImg(product.image),
                size: sizeValue,
                quantity: quantityToAdd
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        syncCartToDB(cart); 
        alert("Item Added to Cart!");
    };
}