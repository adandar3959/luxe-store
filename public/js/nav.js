document.addEventListener('DOMContentLoaded', () => {
    updateUserInterface();
    setupSearch();
    setupMobileMenu();
    loadCategoriesForNav(); // 👈 Now runs on every page
});

// --- 1. DYNAMIC NAVBAR (Mega Menu) ---
async function loadCategoriesForNav() {
    const navLinksContainer = document.getElementById('navLinks');
    if (!navLinksContainer) return;

    try {
        const response = await fetch('http://localhost:5000/api/categories');
        const allCategories = await response.json(); 

        navLinksContainer.innerHTML = '<li><a href="index.html">Home</a></li>';

        const parents = allCategories.filter(c => !c.parentId || c.parentId === 'null');
        const children = allCategories.filter(c => c.parentId && c.parentId !== 'null');

        parents.forEach(parent => {
            const li = document.createElement('li');
            
            // 👇 KEY CHANGE: Links now point to 'category.html'
            const parentLink = document.createElement('a');
            parentLink.href = `category.html?catId=${parent._id}`; 
            parentLink.innerText = parent.name;
            parentLink.innerHTML += ` <i class='bx bx-chevron-down' style='font-size:12px'></i>`;
            li.appendChild(parentLink);

            const myChildren = children.filter(child => child.parentId === parent._id);
            if (myChildren.length > 0) {
                const megaMenu = document.createElement('div');
                megaMenu.className = 'mega-menu';
                
                megaMenu.innerHTML = `<div class="mega-menu-header"><span class="mega-menu-title">${parent.name} Collection</span></div>`;
                
                const list = document.createElement('div');
                list.className = 'mega-menu-list';
                myChildren.forEach(child => {
                    const itemLink = document.createElement('a');
                    // 👇 KEY CHANGE: Links now point to 'category.html'
                    itemLink.href = `category.html?catId=${child._id}`; 
                    itemLink.className = 'mega-menu-item';
                    itemLink.innerHTML = `<div class="item-text"><span class="item-name">${child.name}</span></div><i class='bx bx-chevron-right item-icon'></i>`;
                    list.appendChild(itemLink);
                });
                megaMenu.appendChild(list);
                li.appendChild(megaMenu);
            }
            navLinksContainer.appendChild(li);
        });

    } catch (error) { console.error("Error loading navbar categories:", error); }
}

// --- 2. USER AUTH UI ---
function updateUserInterface() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    // Find the link that contains the user icon
    const userIcon = document.querySelector('.nav-icons .bx-user');
    if(userIcon) {
        const userLink = userIcon.parentElement;
        if (userInfo) {
            userLink.innerHTML = `<i class='bx bxs-user-check' style="color:#695CFE"></i>`;
            userLink.href = userInfo.role === 'admin' ? 'admin-dashboard.html' : 'profile.html';
        } else {
            userLink.href = 'login.html';
            userLink.innerHTML = `<i class='bx bx-user'></i>`;
        }
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.querySelector('.cart-count');
    if (badge) badge.innerText = cart.length;
}

// --- 3. SEARCH LOGIC ---
function setupSearch() {
    const searchInput = document.querySelector('.search-box input');
    const searchIcon = document.querySelector('.search-box .bx-search');

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(searchInput.value);
        });
    }
    if (searchIcon) {
        searchIcon.addEventListener('click', () => performSearch(searchInput.value));
    }
}

function performSearch(keyword) {
    if (keyword.trim()) {
        window.location.href = `category.html?search=${encodeURIComponent(keyword.trim())}`;
    }
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}