const API_URL = '/api/categories';
const PROD_URL = '/api/products';
const token = localStorage.getItem('userToken');

let allCategories = [];
let allProducts = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!token) return window.location.href = 'admin-login.html';
    loadData();
});

async function loadData() {
    try {
        const [catRes, prodRes] = await Promise.all([
            fetch(API_URL),
            fetch(PROD_URL)
        ]);
        allCategories = await catRes.json();
        allProducts = await prodRes.json();
        renderDashboard();
    } catch (err) { console.error(err); }
}

function renderDashboard() {
    // 1. Separate Data
    const parents = allCategories.filter(c => !c.parentId); // Main
    const subs = allCategories.filter(c => c.parentId);     // Sub

    // 2. Update Stats
    document.getElementById('totalParents').innerText = parents.length;
    document.getElementById('totalSubs').innerText = subs.length;

    // 3. Render Main Categories Table
    renderMainTable(parents, subs);

    // 4. Render Sub Categories Table
    renderSubTable(subs, parents);
}

// --- TABLE RENDER FUNCTIONS ---

function renderMainTable(parents, allSubs) {
    const tbody = document.getElementById('mainCatBody');
    tbody.innerHTML = '';

    if(parents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No Main Categories.</td></tr>';
        return;
    }

    parents.forEach(cat => {
        // Count: Own products + Subcategory products
        const myChildrenIds = allSubs.filter(s => s.parentId === cat._id).map(s => s._id);
        const count = allProducts.filter(p => p.category === cat._id || myChildrenIds.includes(p.category)).length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span style="font-weight:600; font-size:15px; color:#fff">${cat.name}</span></td>
            <td><span class="badge badge-main">MAIN</span></td>
            <td><span class="count-pill">${count} Items</span></td>
            <td class="action-icons">
                <i class='bx bx-show' style="color:#695CFE;" onclick='viewProducts("${cat._id}")'></i>
                <i class='bx bx-trash' style="color:#FF4560;" onclick='deleteCategory("${cat._id}")'></i>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderSubTable(subs, allParents) {
    const tbody = document.getElementById('subCatBody');
    tbody.innerHTML = '';

    if(subs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">No Sub Categories.</td></tr>';
        return;
    }

    subs.forEach(cat => {
        // Find Parent Name
        const parentObj = allParents.find(p => p._id === cat.parentId);
        const parentName = parentObj ? parentObj.name : '<span style="color:red">Orphan</span>';

        // Count: Only own products
        const count = allProducts.filter(p => p.category === cat._id).length;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span style="font-weight:600; font-size:15px; color:#ddd">${cat.name}</span></td>
            <td><span style="font-size:13px; color:#888"><i class='bx bx-subdirectory-right'></i> ${parentName}</span></td>
            <td><span class="count-pill">${count} Items</span></td>
            <td class="action-icons">
                <i class='bx bx-show' style="color:#695CFE;" onclick='viewProducts("${cat._id}")'></i>
                <i class='bx bx-trash' style="color:#FF4560;" onclick='deleteCategory("${cat._id}")'></i>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- MODAL & ACTIONS (Unchanged) ---
window.openModal = () => {
    document.getElementById('catId').value = '';
    document.getElementById('catName').value = '';
    const pSelect = document.getElementById('catParent');
    pSelect.innerHTML = '<option value="">None (Top Level)</option>';
    allCategories.filter(c => !c.parentId).forEach(c => {
        pSelect.innerHTML += `<option value="${c._id}">${c.name}</option>`;
    });
    document.getElementById('catModal').style.display = 'flex';
};
window.closeModal = () => { document.getElementById('catModal').style.display = 'none'; };
window.saveCategory = async () => {
    const name = document.getElementById('catName').value;
    const parentId = document.getElementById('catParent').value;
    if (!name) return alert("Name required");
    const payload = { name };
    if (parentId) payload.parentId = parentId;
    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
    closeModal(); loadData();
};
window.deleteCategory = async (id) => {
    if(!confirm("Delete this category?")) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadData();
};
window.viewProducts = (catId) => {
    const cat = allCategories.find(c => c._id === catId);
    const modal = document.getElementById('prodModal');
    const list = document.getElementById('modalProductList');
    
    document.getElementById('prodModalTitle').innerText = `${cat.name} Products`;
    
    // 1. UPDATE: Change grid columns from 60px to 140px to fit text
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))'; 
    list.style.gap = '15px';
    list.style.padding = '5px'; // Add some breathing room inside
    
    list.innerHTML = '';

    let items = allProducts.filter(p => p.category === catId);

    // Include subcategory items if this is a parent category
    if (!cat.parentId) {
         const myChildrenIds = allCategories.filter(c => c.parentId === cat._id).map(c => c._id);
         const childItems = allProducts.filter(p => myChildrenIds.includes(p.category));
         items = [...items, ...childItems];
    }

    document.getElementById('prodModalDesc').innerText = `Total items found: ${items.length}`;

    if(items.length === 0) {
        list.innerHTML = "<p style='grid-column: 1/-1; text-align:center; color:#888;'>No products found.</p>";
        modal.style.display = 'flex';
        return;
    }

    // 2. UPDATE: Render a Card instead of just an Image
    items.forEach(p => {
        const img = p.image ? (p.image.startsWith('http') ? p.image : `/uploads/${p.image}`) : 'https://via.placeholder.com/150';
        
        // Check if price exists, otherwise show 0
        const price = p.price ? p.price : 0; 

        const cardHTML = `
            <div style="background: #232334; border-radius: 8px; overflow: hidden; border: 1px solid #3f3f55;">
                <div style="height: 120px; width: 100%;">
                    <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" alt="${p.name}">
                </div>
                
                <div style="padding: 10px; text-align: center;">
                    <div style="font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px;">
                        ${p.name}
                    </div>
                    <div style="font-size: 13px; color: #00E396; font-weight: bold;">
                        $${price}
                    </div>
                </div>
            </div>
        `;
        list.innerHTML += cardHTML;
    });

    modal.style.display = 'flex';
};