// --- HELPER: Handles all image logic ---
function resolveImg(imgInput) {
    const BACKEND_URL = '/uploads/';
    const FALLBACK_IMG = 'https://via.placeholder.com/600?text=No+Image';

    if (!imgInput) return FALLBACK_IMG;

    let cleanName = '';
    if (typeof imgInput === 'object') {
        cleanName = imgInput.fileName || imgInput.url || '';
    } else {
        cleanName = imgInput;
    }

    if (!cleanName) return FALLBACK_IMG;
    if (cleanName.startsWith('http')) return cleanName;

    const formattedName = cleanName.startsWith('/') ? cleanName.substring(1) : cleanName;
    return `${BACKEND_URL}${formattedName}`;
}

// --- NEW HELPER: Sync Cart to MongoDB ---
async function syncCartToDB(cart) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = localStorage.getItem('userToken'); // Get Token

    // Only sync if user is logged in
    if (!userInfo || !token) return; 

    try {
        await fetch('/api/cart', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send the "Pass"
            },
            body: JSON.stringify({ 
                cartItems: cart.map(item => ({
                    product: item.id, // Map Frontend 'id' to Backend 'product'
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    qty: item.quantity,
                    size: item.size,
                    color: item.color || "Default"
                })) 
            })
        });
        console.log("Cart Synced to DB");
    } catch (error) {
        console.error("Sync Error", error);
    }
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

        renderVariations(product.variations);
        loadRelatedProducts(product._id);
        setupButtons(product);

    } catch (error) {
        console.error("Error loading product:", error);
    }
});

function renderVariations(product) {
    const sizeContainer = document.querySelector('.sizes');
    sizeContainer.innerHTML = ''; 

    // Use product.sizes which you just added in the Admin panel
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
async function loadRelatedProducts(currentId) {
    const container = document.getElementById('relatedContainer');
    if (!container) return;

    try {
        // Use full URL to avoid 404s on Render
        const res = await fetch('https://luxe-store-nmvs.onrender.com/api/products');
        const allProducts = await res.json();
        
        // Filter out the product currently being viewed
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
                <img src="${displayImg}" class="product-img">
                <div class="product-details">
                    <h4>${p.name}</h4>
                    <div class="price">Rs. ${p.price.toLocaleString()}</div>
                </div>
            `;
            card.onclick = () => window.location.href = `product.html?id=${p._id}`;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Error loading related products", err);
    }
}

function setupButtons(product) {
    const cartBtn = document.querySelector('.btn-primary'); 
    const quantityInput = document.getElementById('quantity');

    // 1. CHECK STOCK STATUS
    if (product.countInStock <= 0) {
        cartBtn.innerText = "Out of Stock";
        cartBtn.disabled = true;
        cartBtn.style.backgroundColor = "#ccc"; 
        cartBtn.style.cursor = "not-allowed";
        if (quantityInput) quantityInput.disabled = true;
        return; 
    }

    const firstImgData = (product.images && product.images.length > 0) ? product.images[0] : product.image;
    const saveableImage = resolveImg(firstImgData);

    cartBtn.onclick = () => {
        const selectedSize = document.querySelector('.size-box.active');
        if (!selectedSize && product.variations && product.variations.length > 0) {
            alert("Please select a size!");
            return;
        }

        const sizeValue = selectedSize ? selectedSize.innerText : 'One Size';
        const quantityToAdd = parseInt(quantityInput.value) || 1;

        // 2. PREVENT ADDING MORE THAN STOCK
        if (quantityToAdd > product.countInStock) {
            alert(`Sorry, we only have ${product.countInStock} in stock.`);
            return;
        }

        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => 
            item.id === product._id && item.size === sizeValue
        );

        if (existingItemIndex > -1) {
            if (cart[existingItemIndex].quantity + quantityToAdd > product.countInStock) {
                alert(`You already have ${cart[existingItemIndex].quantity} in cart. Cannot add more.`);
                return;
            }
            cart[existingItemIndex].quantity += quantityToAdd;
        } else {
            const cartItem = {
                id: product._id,
                name: product.name,
                price: product.price,
                image: saveableImage,
                size: sizeValue,
                quantity: quantityToAdd,
                color: "Default" 
            };
            cart.push(cartItem);
        }

        // Save to Browser Storage
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // 🚀 ✅ SYNC TO DATABASE (The new part)
        syncCartToDB(cart); 

        const count = document.querySelector('.cart-count');
        if (count) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            count.innerText = totalItems; 
        }

        alert("Item Added to Cart!");
    };

    const wishBtn = document.querySelector('.btn-outline'); 
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    if (wishlist.some(item => item.id === product._id)) {
        wishBtn.querySelector('i').classList.replace('bx-heart', 'bxs-heart');
    }

    wishBtn.onclick = () => {
        wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const existingIndex = wishlist.findIndex(item => item.id === product._id);

        if (existingIndex > -1) {
            wishlist.splice(existingIndex, 1);
            wishBtn.querySelector('i').classList.replace('bxs-heart', 'bx-heart');
            alert("Removed from Wishlist");
        } else {
            wishlist.push({
                id: product._id,
                name: product.name,
                price: product.price,
                image: saveableImage 
            });
            wishBtn.querySelector('i').classList.replace('bx-heart', 'bxs-heart');
            alert("Added to Wishlist");
        }
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    };
}