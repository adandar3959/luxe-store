document.addEventListener('DOMContentLoaded', () => {
    checkAdmin();
    fetchEmployees();
});

function checkAdmin() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'admin') {
        alert("Access Denied.");
        window.location.href = 'admin-login.html';
    }
}

async function fetchEmployees() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const tbody = document.getElementById('employeeTable');

    try {
        const res = await fetch('http://localhost:5000/api/admin/employees', {
            headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        const employees = await res.json();

        tbody.innerHTML = '';
        employees.forEach(emp => {
            tbody.innerHTML += `
                <tr>
                    <td>${emp.name}</td>
                    <td>${emp.email}</td>
                    <td>${emp.position}</td>
                    <td>$${emp.salary}</td>
                    <td>
                        <i class='bx bx-edit' style="color:#00E396; cursor:pointer; margin-right:10px;" onclick="editEmployee('${emp._id}', '${emp.name}', '${emp.email}', '${emp.position}', '${emp.salary}')"></i>
                        <i class='bx bx-trash' style="color:#FF4560; cursor:pointer;" onclick="deleteEmployee('${emp._id}')"></i>
                    </td>
                </tr>
            `;
        });
    } catch (e) { console.error(e); }
}

// Open Modal
window.openModal = () => {
    document.getElementById('modalTitle').innerText = "Add Employee";
    document.getElementById('employeeForm').reset();
    document.getElementById('editId').value = "";
    document.getElementById('employeeModal').style.display = "block";
}

window.closeModal = () => {
    document.getElementById('employeeModal').style.display = "none";
}

// Edit Prep
window.editEmployee = (id, name, email, pos, salary) => {
    document.getElementById('modalTitle').innerText = "Edit Employee";
    document.getElementById('editId').value = id;
    document.getElementById('eName').value = name;
    document.getElementById('eEmail').value = email;
    document.getElementById('ePos').value = pos;
    document.getElementById('eSalary').value = salary;
    document.getElementById('ePass').placeholder = "Leave blank to keep current";
    document.getElementById('employeeModal').style.display = "block";
}

// Submit Form
document.getElementById('employeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const id = document.getElementById('editId').value;
    
    const data = {
        name: document.getElementById('eName').value,
        email: document.getElementById('eEmail').value,
        position: document.getElementById('ePos').value,
        salary: document.getElementById('eSalary').value
    };
    
    const pass = document.getElementById('ePass').value;
    if(pass) data.password = pass;

    const method = id ? 'PUT' : 'POST';
    const url = id 
        ? `http://localhost:5000/api/admin/employees/${id}`
        : `http://localhost:5000/api/admin/employees`;

    await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify(data)
    });

    closeModal();
    fetchEmployees();
});

// Delete
window.deleteEmployee = async (id) => {
    if(!confirm("Fire this employee?")) return;
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    await fetch(`http://localhost:5000/api/admin/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${userInfo.token}` }
    });
    fetchEmployees();
}