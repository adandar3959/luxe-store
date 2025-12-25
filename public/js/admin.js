document.addEventListener('DOMContentLoaded', loadDashboard);

async function loadDashboard() {
    const ordersTable = document.getElementById('ordersTable');
    const totalSalesElem = document.getElementById('totalSales');
    const orderCountElem = document.getElementById('orderCount');
    const productCountElem = document.getElementById('productCount');

    try {
        const resOrders = await fetch('/api/orders');
        if (!resOrders.ok) throw new Error('Failed to fetch orders');
        const orders = await resOrders.json();
        const resProducts = await fetch('/api/products');
        const products = await resProducts.json();
        orderCountElem.innerText = orders.length;
        productCountElem.innerText = products.length;

        const totalRevenue = orders.reduce((acc, order) => acc + (order.totalPrice || 0), 0);
        totalSalesElem.innerText = `$${totalRevenue.toFixed(2)}`;
        ordersTable.innerHTML = '';

        if (orders.length === 0) {
            ordersTable.innerHTML = '<tr><td colspan="6" style="text-align:center">No orders found.</td></tr>';
            return;
        }
        const recentOrders = orders.reverse().slice(0, 10); // Show last 10 only

        recentOrders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            let customerName = "Guest";
            if (order.shippingAddress && order.shippingAddress.fullName) {
                customerName = order.shippingAddress.fullName;
            } else if (order.user && order.user.name) {
                customerName = order.user.name;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family:monospace; color:#695CFE">#${order._id.substring(20, 24)}</td>
                <td>${date}</td>
                <td>${customerName}</td>
                <td>$${order.totalPrice.toFixed(2)}</td>
                <td>${order.paymentInfo ? order.paymentInfo.type : 'COD'}</td>
                <td><span class="badge badge-warning">Processing</span></td>
            `;
            ordersTable.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        ordersTable.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red">Error loading dashboard. Ensure Backend is running.</td></tr>';
    }
}   
