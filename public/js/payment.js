let selectedMethod = 'Cash on Delivery';

function selectPayment(method) {
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    
    if (method === 'COD') {
        document.getElementById('codOption').classList.add('selected');
        document.getElementById('cardForm').style.display = 'none';
        selectedMethod = 'Cash on Delivery';
    } else {
        document.getElementById('cardOption').classList.add('selected');
        document.getElementById('cardForm').style.display = 'block';
        selectedMethod = 'Credit Card';
    }
}

async function confirmOrder() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    const shippingInfo = JSON.parse(localStorage.getItem('shippingAddress'));
    const token = localStorage.getItem('userToken'); // ✅ Get Token for Auth

    if (!cart || !shippingInfo) {
        alert("Session expired or Cart empty. Please go back.");
        window.location.href = 'cart.html';
        return;
    }

    if (!token) {
        alert("You must be logged in to place an order.");
        window.location.href = 'login.html';
        return;
    }
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
    const orderData = {
        orderItems: cart.map(item => ({
            product: item.id, // Maps Frontend 'id' to Backend 'product' ObjectId
            name: item.name,
            image: item.image,
            price: item.price,
            qty: item.quantity || 1,
            size: item.size,
            color: item.color || "Default"
        })),
        shippingAddress: {
            street: shippingInfo.address,
            city: shippingInfo.city,
            zipCode: shippingInfo.postalCode,
            country: shippingInfo.country,
            phone: "000-000-0000" 
        },
        paymentMethod: selectedMethod,
        itemsPrice: totalPrice,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: totalPrice
    };
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ✅ REQUIRED: Send Token so backend knows WHO you are
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('lastOrder', JSON.stringify(data)); 
            localStorage.removeItem('cart');
            window.location.href = 'order-success.html'; 
        }else {
            alert("Order Failed: " + (data.message || "Unknown Error"));
        }

    } catch (error) {
        console.error("Order Error:", error);
        alert("Server error. Ensure Backend is running!");
    }
}   
