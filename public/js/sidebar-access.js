document.addEventListener('DOMContentLoaded', () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo) {
        window.location.href = 'admin-login.html';
        return;
    }
    const role = (userInfo.role || "").toLowerCase(); 
    const sidebar = document.querySelector('.sidebar');
    const menuItems = document.querySelectorAll('.sidebar .menu-item');
    const employeeAllowed = ['profile', 'products', 'view store', 'orders', 'categories', 'logout', 'restock'];
    const customerAllowed = ['profile', 'view store', 'my orders', 'logout'];
    if (role === 'employee') {
        if (!document.querySelector('.restock-link')) {
            const restockLink = document.createElement('a');
            restockLink.href = 'restock.html';
            restockLink.className = 'menu-item restock-link';
            restockLink.innerHTML = `<i class='bx bx-low-vision'></i> Restock`;
            const insertBefore = menuItems[4];
            if (insertBefore) {
                sidebar.insertBefore(restockLink, insertBefore);
            } else {
                sidebar.appendChild(restockLink);
            }
        }
    }
    const allLinks = document.querySelectorAll('.sidebar .menu-item');

    allLinks.forEach(link => {
        if (role === 'admin') return;

        const linkText = link.innerText.trim().toLowerCase();
        if (role === 'employee') {
            const isAllowed = employeeAllowed.some(keyword => linkText.includes(keyword));
            if (!isAllowed) link.style.display = 'none';
        }
        else if (role === 'user' || role === 'customer') {
            const isAllowed = customerAllowed.some(keyword => linkText.includes(keyword));
            if (!isAllowed) link.style.display = 'none';
        }
    });
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
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
