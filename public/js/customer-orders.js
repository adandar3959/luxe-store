document.addEventListener('DOMContentLoaded', () => {
    loadMyOrders();
});

async function loadMyOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const noOrdersMsg = document.getElementById('noOrdersMsg');
    const token = localStorage.getItem('userToken');

    if (!token) {
        window.location.href = 'index.html'; 
        return;
    }

    try {
        const response = await fetch('/api/orders/myorders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch orders");
        }

        const orders = await response.json();

        if (orders.length === 0) {
            noOrdersMsg.style.display = 'block';
            tableBody.innerHTML = '';
        } else {
            noOrdersMsg.style.display = 'none';
            tableBody.innerHTML = ''; 

            // Sort by newest first
            orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            orders.forEach(order => {
                const row = document.createElement('tr');
                
                let statusText = order.orderStatus || 'Pending';
                let statusClass = statusText.toLowerCase(); 

                // Format Date
                const dateObj = new Date(order.createdAt);
                const dateStr = dateObj.toLocaleDateString();

                // --- 1. GENERATE ITEM LIST WITH SIZES ---
                // This creates a small list of items to show under the Order ID
                const itemDetails = order.orderItems.map(item => 
                    `<div style="font-size: 11px; color: #888; margin-top: 2px;">
                        ${item.name} <strong style="color: #695CFE;">(${item.size || 'N/A'})</strong> x${item.qty}
                    </div>`
                ).join('');

                // --- 2. CANCELLATION LOGIC ---
                let actionBtn = '-';
                // Only allow cancellation if status is strictly 'Pending'
                if (statusText === 'Pending') { 
                    actionBtn = `<button class="btn-cancel-order" onclick="cancelOrder('${order._id}')">Cancel Order</button>`;
                }

                // --- 3. RENDER TABLE ROW ---
                row.innerHTML = `
                    <td>
                        <div style="font-weight: 600; color: #fff;">#${order._id.slice(-6).toUpperCase()}</div>
                        ${itemDetails} 
                    </td> 
                    <td>${dateStr}</td>
                    <td>Rs. ${order.totalPrice.toLocaleString()}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>${actionBtn}</td>
                `;
                tableBody.appendChild(row);
            });
        }

    } catch (error) {
        console.error("Error loading orders:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Server Error. Ensure Backend is running.</td></tr>`;
    }
}

// Function to Cancel Order via API
window.cancelOrder = async (orderId) => {
    if(!confirm("Are you sure you want to cancel this order?")) return;

    const token = localStorage.getItem('userToken');

    try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert("Order cancelled successfully.");
            loadMyOrders(); 
        } else {
            alert(data.message || "Failed to cancel order.");
        }
    } catch (error) {
        console.error("Error canceling order:", error);
        alert("Server error.");
    }
};