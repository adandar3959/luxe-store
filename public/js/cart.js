
document.addEventListener('DOMContentLoaded', () => {
    loadCartItems();
    updateTotals();
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }
            const shippingAddress = {
                fullName: document.getElementById('fullName').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                postalCode: document.getElementById('postalCode').value,
                country: document.getElementById('country').value
            };

            localStorage.setItem('shippingAddress', JSON.stringify(shippingAddress));
            window.location.href = 'payment.html';
        });
    }
});

function getUniversalImg(imageSource) {
    const BACKEND_URL = '/uploads/';
    const DEFAULT_IMG = 'https://via.placeholder.com/150';

    if (!imageSource) return DEFAULT_IMG;

    let cleanName = (typeof imageSource === 'object') ? (imageSource.fileName || imageSource.url) : imageSource;
    if (!cleanName) return DEFAULT_IMG;
    if (cleanName.startsWith('http')) return cleanName;
    if (cleanName.startsWith('/')) cleanName = cleanName.substring(1);

    return `${BACKEND_URL}${cleanName}`;
}

function loadCartItems() {
    const container = document.getElementById('cartItemsContainer');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (!container) return; // Guard clause if not on cart page

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty. <a href="category.html">Go Shop</a></p>';
        return;
    }

    container.innerHTML = '';
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <div style="display: flex; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <img src="${getUniversalImg(item.image)}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px;">   
                <div class="item-details" style="flex-grow: 1;">
                    <h4 style="margin: 0;">${item.name}</h4>
                    <p style="margin: 5px 0; color: #666; font-size: 0.9em;">Size: ${item.size}</p>
                    <div class="item-price" style="font-weight: bold;">Rs. ${item.price.toLocaleString()}</div>
                </div>
                <div class="item-actions" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
                    <i class='bx bx-trash' style="color: red; cursor: pointer; font-size: 1.2rem;" onclick="removeFromCart(${index})"></i>
                    <span>Qty: ${item.quantity || 1}</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}
window.removeFromCart = async (index) => {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateTotals();
    const badge = document.querySelector('.cart-count');
    if(badge) {
        const total = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
        badge.innerText = total;
    }
    const token = localStorage.getItem('userToken');
    if (token) {
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
                        qty: item.quantity || 1,
                        size: item.size,
                        color: item.color || "Default"
                    })) 
                })
            });
        } catch (error) {
            console.error("Failed to sync deletion:", error);
        }
    }
}

function updateTotals() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const total = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    
    const subTotalEl = document.getElementById('subTotal');
    const finalTotalEl = document.getElementById('finalTotal');
    
    if(subTotalEl) subTotalEl.innerText = `Rs. ${total.toLocaleString()}`;
    if(finalTotalEl) finalTotalEl.innerText = `Rs. ${total.toLocaleString()}`;
}
