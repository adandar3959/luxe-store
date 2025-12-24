const LOW_STOCK_URL = '/api/products/lowstock';
const token = localStorage.getItem('userToken');

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }
    loadLowStockProducts();
});

async function loadLowStockProducts() {
    const tbody = document.getElementById('restockTableBody');
    
    try {
        const res = await fetch(LOW_STOCK_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("Failed to fetch data");

        const products = await res.json();
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding: 40px; color: #00E396;">
                        <i class='bx bx-check-circle' style="font-size: 40px; display:block; margin-bottom:10px;"></i>
                        All stock levels are healthy!
                    </td>
                </tr>`;
            return;
        }

        products.forEach(p => {
            const imgUrl = p.image ? (p.image.startsWith('http') ? p.image : `/uploads/${p.image}`) : 'https://via.placeholder.com/50';
            
            // Determine status text
            let statusText = "Low Stock";
            if (p.countInStock === 0) statusText = "Out of Stock";

            const row = `
                <tr>
                    <td><img src="${imgUrl}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #333;"></td>
                    <td>${p.name}</td>
                    <td>$${p.price}</td>
                    <td><span class="stock-alert">${p.countInStock}</span></td>
                    <td>
                        <span style="color: ${p.countInStock === 0 ? '#FF4560' : 'orange'}; font-size: 13px; font-weight:600;">
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red">Error loading data. Ensure you are logged in as Staff.</td></tr>';
    }
}