const API_URL = '/api/products';
const CAT_URL = '/api/categories';
const userInfo = JSON.parse(localStorage.getItem('userInfo'));
const token = localStorage.getItem('userToken');

let allProducts = [];
let allCategories = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!token) { window.location.href = 'admin-login.html'; return; }
    loadCategoriesForDropdown();
    loadProducts();
});
async function loadCategoriesForDropdown() {
    try {
        const res = await fetch(CAT_URL);
        allCategories = await res.json();
        
        const parentSelect = document.getElementById('pParentCategory');
        parentSelect.innerHTML = '<option value="">Select Parent Category</option>';
        
        const parents = allCategories.filter(c => !c.parentId);
        parents.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat._id; // ID matches Parent Logic
            option.innerText = cat.name;
            parentSelect.appendChild(option);
        });
    } catch (error) { console.error("Error loading categories", error); }
}

async function loadProducts() {
    try {
        const res = await fetch(API_URL);
        allProducts = await res.json();
        const countSpan = document.getElementById('totalProductCount');
        if (countSpan) {
            countSpan.innerText = allProducts.length;
        }

        renderTable(allProducts);
    } catch (error) { console.error("Error loading products:", error); }
}

function renderTable(products) {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No Products Found</td></tr>';
        return;
    }
    const rows = products.map(p => {
        let catDisplay = p.category;
        if (allCategories.length > 0 && p.category && p.category.length > 10) {
            const matchedCat = allCategories.find(c => c._id === p.category);
            if (matchedCat) catDisplay = matchedCat.name;
        }

        const imgUrl = p.image ? (p.image.startsWith('http') ? p.image : `/uploads/${p.image}`) : 'https://via.placeholder.com/50';

        return `
            <tr>
                <td><img src="${imgUrl}" class="product-img-thumb" alt="${p.name}"></td>
                <td>${p.name}</td>
                <td>Rs. ${p.price.toLocaleString()}</td>
                <td>${p.brand}</td>
                <td>${p.countInStock}</td>
                <td>
                    <button class="btn-small" style="background:#46a4ff; color:white; border:none; padding:5px 10px; border-radius:4px;" onclick="openEditModal('${p._id}')">Edit</button>
                    <button class="btn-small" style="background:#ff4646; color:white; border:none; padding:5px 10px; border-radius:4px;" onclick="deleteProduct('${p._id}')">Delete</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}
window.handleParentChange = () => {
    const parentId = document.getElementById('pParentCategory').value;
    const subSelect = document.getElementById('pSubCategory');
    
    subSelect.innerHTML = '<option value="">Select Subcategory</option>';
    if (!parentId) return;

    const children = allCategories.filter(c => c.parentId === parentId);
    
    children.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat._id; 
        option.innerText = cat.name;
        subSelect.appendChild(option);
    });
};

window.openAddModal = () => {
    document.getElementById('productForm').reset();
    document.getElementById('editId').value = ''; 
    document.getElementById('modalTitle').innerText = 'Add New Product';
    document.getElementById('pParentCategory').value = "";
    document.getElementById('pSubCategory').innerHTML = '<option value="">Select Subcategory</option>';
    document.querySelectorAll('input[name="pSizes"]').forEach(cb => cb.checked = false);

    document.getElementById('productModal').style.display = 'block';
};

window.openEditModal = (id) => {
    const product = allProducts.find(p => p._id === id);
    if (!product) return alert("Product not found");

    document.getElementById('editId').value = product._id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pBrand').value = product.brand;
    document.getElementById('pImage').value = product.image;
    document.getElementById('pDesc').value = product.description;
    document.getElementById('pQty').value = product.countInStock;
    document.getElementById('modalTitle').innerText = 'Edit Product';
    document.querySelectorAll('input[name="pSizes"]').forEach(cb => {
        cb.checked = product.sizes && product.sizes.includes(cb.value);
    });
    const catID = product.category;
    const categoryObj = allCategories.find(c => c._id === catID);
    
    const parentSelect = document.getElementById('pParentCategory');
    const subSelect = document.getElementById('pSubCategory');

    if (categoryObj) {
        if (categoryObj.parentId) {
            parentSelect.value = categoryObj.parentId;
            window.handleParentChange(); 
            subSelect.value = categoryObj._id; // Select by ID
        } else {
            parentSelect.value = categoryObj._id;
            window.handleParentChange();
            subSelect.value = "";
        }
    } else {
        parentSelect.value = "";
        window.handleParentChange();
    }

    document.getElementById('productModal').style.display = 'block';
};

window.closeModal = () => { document.getElementById('productModal').style.display = 'none'; };

document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const selectedSizes = Array.from(document.querySelectorAll('input[name="pSizes"]:checked'))
                               .map(cb => cb.value);

    const productData = {
        name: document.getElementById('pName').value,
        price: Number(document.getElementById('pPrice').value),
        brand: document.getElementById('pBrand').value,
        countInStock: Number(document.getElementById('pQty').value),
        sizes: selectedSizes // This must match the field name in your Product Model
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/products/${id}` : '/api/products';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(productData)
        });

        if (res.ok) {
            alert(id ? "Product Updated Successfully" : "Product Added Successfully");
            closeModal();
            loadProducts(); // Refresh the table
        } else {
            const error = await res.json();
            alert("Error: " + error.message);
        }
    } catch (error) {
        console.error("Save failed:", error);
    }
});
window.deleteProduct = async (id) => {
    if(!confirm("Delete?")) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) loadProducts();
    } catch (e) { console.error(e); }
};
