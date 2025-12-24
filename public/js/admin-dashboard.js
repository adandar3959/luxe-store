document.addEventListener('DOMContentLoaded', async () => {
    // 1. Security Check
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || (userInfo.role !== 'admin' && userInfo.role !== 'employee')) {
        alert("Access Denied.");
        window.location.href = 'admin-login.html';
        return;
    }

    // Set Admin Avatar
    if(document.getElementById('adminAvatar')) {
        document.getElementById('adminAvatar').innerText = userInfo.name.charAt(0).toUpperCase();
    }

    try {
        // 2. Fetch DATA in Parallel (Stats + Orders)
        // We need 'Authorization' header for the secure routes
        const headers = { 'Authorization': `Bearer ${userInfo.token}` };

        const [resStats, resOrders] = await Promise.all([
            fetch('/api/admin/stats', { headers }),
            fetch('/api/orders', { headers })
        ]);

        if (!resStats.ok || !resOrders.ok) throw new Error('Failed to fetch data');
        
        const statsData = await resStats.json();
        const ordersData = await resOrders.json();

        // 3. Render Everything
        renderStats(statsData);
        renderOrdersTable(ordersData);
        renderTopProducts(statsData.topProducts);

    } catch (err) {
        console.error(err);
        // alert('Error loading dashboard data. Ensure backend is running.');
    }
});

// --- RENDER FUNCTIONS ---

function renderStats(data) {
    // Update Number Cards
    if(document.getElementById('statSales')) document.getElementById('statSales').innerText = `${data.totalSales.toFixed(2)}RS`;
    if(document.getElementById('statOrders')) document.getElementById('statOrders').innerText = data.totalOrders;
    if(document.getElementById('statProducts')) document.getElementById('statProducts').innerText = data.productSold;
    if(document.getElementById('statCustomers')) document.getElementById('statCustomers').innerText = data.customerCount;
    
    // Update Earnings Widget
    const earningElement = document.querySelector('.earning-amount');
    if(earningElement) earningElement.innerText = `$${data.totalSales.toFixed(2)}`;
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('ordersTable'); // Make sure your HTML <tbody> has id="ordersTable"
    
    if (!tableBody) return; // Exit if table doesn't exist in HTML

    tableBody.innerHTML = ''; 

    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center">No orders found.</td></tr>';
        return;
    }

    // Show last 5 orders (Newest First)
    const recentOrders = orders.slice(0, 5); 

    recentOrders.forEach(order => {
        // 1. Fix Date
        const date = new Date(order.createdAt).toLocaleDateString();

        // 2. Fix Customer Name & City (Handle nested objects safely)
        let customerName = "Guest";
        let customerCity = "Unknown";

        if (order.user && order.user.name) {
            customerName = order.user.name;
        } else if (order.shippingAddress && order.shippingAddress.fullName) {
            customerName = order.shippingAddress.fullName;
        }

        if (order.shippingAddress && order.shippingAddress.city) {
            customerCity = order.shippingAddress.city;
        }

        // 3. Fix ID (MongoDB uses _id)
        const orderId = order._id ? order._id.substring(20, 24) : '???';
        
        // 4. Fix Status
        const status = order.orderStatus || "Processing";
        
        // 5. Payment Method
        const payment = order.paymentInfo ? order.paymentInfo.type : 'COD';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-family:monospace; color:#695CFE">#${orderId}</td>
            <td>${date}</td>
            <td>
                <div style="font-weight:bold; font-size:14px;">${customerName}</div>
                <div style="font-size:12px; color:#888;">${customerCity}</div>
            </td>
            <td><span class="badge badge-warning" style="background:#fff3cd; color:#856404; padding:5px 10px; border-radius:15px; font-size:12px;">${status}</span></td>
            <td style="font-weight:600">$${order.totalPrice.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function renderTopProducts(products) {
    const prodTable = document.getElementById('topProductsTable');
    if (!prodTable) return;

    prodTable.innerHTML = '';

    products.forEach((prod, index) => {
        const randomPercent = Math.floor(Math.random() * (90 - 30 + 1)) + 30; 
        
        prodTable.innerHTML += `
            <tr>
                <td style="width: 30px; color: gray;">0${index+1}</td>
                <td style="font-size:14px;">${prod.name}</td>
                <td>
                    <div style="width: 100px; height: 6px; background: #2b2b40; border-radius: 3px;">
                        <div style="width: ${randomPercent}%; height: 100%; background: #FFA500; border-radius: 3px;"></div>
                    </div>
                </td>
            </tr>
        `;
    });
}