document.addEventListener('DOMContentLoaded', () => {
    // 1. Get User Info
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // 2. Security Check
    if (!userInfo) {
        window.location.href = 'admin-login.html';
        return;
    }

    // 3. Get Role
    const role = (userInfo.role || "").toLowerCase(); 
    const sidebar = document.querySelector('.sidebar');
    const menuItems = document.querySelectorAll('.sidebar .menu-item');

    // 4. Define Allowed Lists
    // Added 'restock' to employee list
    const employeeAllowed = ['profile', 'products', 'view store', 'orders', 'categories', 'logout', 'restock'];
    const customerAllowed = ['profile', 'view store', 'my orders', 'logout'];

    // 5. INJECT RESTOCK LINK FOR EMPLOYEES
    if (role === 'employee') {
        // Check if it already exists to avoid duplicates
        if (!document.querySelector('.restock-link')) {
            const restockLink = document.createElement('a');
            restockLink.href = 'restock.html'; // You will create this page next
            restockLink.className = 'menu-item restock-link';
            restockLink.innerHTML = `<i class='bx bx-low-vision'></i> Restock`;
            
            // Insert it before the "View Store" or at a specific position
            // This inserts it before the 5th item (usually View Store)
            if(menuItems.length > 4) {
                sidebar.insertBefore(restockLink, menuItems[4]);
            } else {
                sidebar.appendChild(restockLink);
            }
        }
    }

    // 6. Loop through links and hide forbidden ones
    // (Re-select menu items to include the new one if added)
    const allLinks = document.querySelectorAll('.sidebar .menu-item');

    allLinks.forEach(link => {
        if (role === 'admin') return;

        const linkText = link.innerText.trim().toLowerCase();

        // A. Employee Logic
        if (role === 'employee') {
            const isAllowed = employeeAllowed.some(keyword => linkText.includes(keyword));
            if (!isAllowed) link.style.display = 'none';
        }

        // B. Customer Logic
        else if (role === 'user' || role === 'customer') {
            const isAllowed = customerAllowed.some(keyword => linkText.includes(keyword));
            if (!isAllowed) link.style.display = 'none';
        }
    });

    // 7. Handle Logout Button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        // Clone node to remove old event listeners (Clean slate)
        const newBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);

        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if(confirm("Are you sure you want to logout?")) {
                localStorage.clear(); // Wipe everything
                window.location.href = 'index.html';
            }
        });
    }
});