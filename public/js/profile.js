document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken'); // Use token to fetch fresh data

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const res = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch profile");

        const user = await res.json(); 
        document.getElementById('profileName').innerText = user.name;
        document.getElementById('profileEmail').innerText = user.email;
        const roleElement = document.getElementById('profileRole');
        if (roleElement) {
            roleElement.innerText = (user.role || "CUSTOMER").toUpperCase();
            if (user.role === 'admin') roleElement.style.background = '#FF4560'; // Red
            else if (user.role === 'employee') roleElement.style.background = '#00E396'; // Green
        }
        const avatarElement = document.getElementById('profileAvatar');
        if (avatarElement) avatarElement.innerText = user.name.charAt(0).toUpperCase();
        if (document.getElementById('inputName')) document.getElementById('inputName').value = user.name;
        if (document.getElementById('inputEmail')) document.getElementById('inputEmail').value = user.email;
        if (document.getElementById('inputPhone')) document.getElementById('inputPhone').value = user.phone || "";
        if (document.getElementById('inputAddress')) document.getElementById('inputAddress').value = user.address || "";

    } catch (error) {
        console.error(error);
        const localUser = JSON.parse(localStorage.getItem('userInfo'));
        if(localUser) {
             document.getElementById('profileName').innerText = localUser.name;
             document.getElementById('profileRole').innerText = (localUser.role || "CUSTOMER").toUpperCase();
        }
    }
});

function enableEdit() {
    document.getElementById('inputName').disabled = false;
    document.getElementById('inputPhone').disabled = false;
    document.getElementById('inputAddress').disabled = false;
    document.getElementById('inputPassword').disabled = false;
    document.getElementById('saveActions').classList.remove('hidden');
    document.getElementById('editBtn').classList.add('hidden');
}

function cancelEdit() {
    location.reload(); // Simple reload to discard changes
}

function logout() {
    if(confirm("Are you sure you want to logout?")) {
        localStorage.clear(); // Wipes everything
        window.location.href = 'index.html';
    }
}
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('userToken');
    
    const updatedData = {
        name: document.getElementById('inputName').value,
        email: document.getElementById('inputEmail').value,
        phone: document.getElementById('inputPhone').value,
        address: document.getElementById('inputAddress').value,
        password: document.getElementById('inputPassword').value
    };
    if (!updatedData.password) delete updatedData.password;

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userInfo', JSON.stringify(data));
            alert("Profile Updated Successfully!");
            location.reload();
        } else {
            alert(data.message || "Update Failed");
        }
    } catch (error) {
        console.error(error);
        alert("Server Error");
    }
});
