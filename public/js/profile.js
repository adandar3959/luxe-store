document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('userToken'); // Use token to fetch fresh data

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // 1. Fetch Latest Data from Database
        const res = await fetch('/api/users/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch profile");

        const user = await res.json(); 

        // 2. Update UI Elements
        document.getElementById('profileName').innerText = user.name;
        document.getElementById('profileEmail').innerText = user.email;

        // ✅ FIX ROLE DISPLAY
        const roleElement = document.getElementById('profileRole');
        if (roleElement) {
            // Converts "employee" to "EMPLOYEE", "admin" to "ADMIN"
            roleElement.innerText = (user.role || "CUSTOMER").toUpperCase();
            
            // Optional: Change badge color based on role
            if (user.role === 'admin') roleElement.style.background = '#FF4560'; // Red
            else if (user.role === 'employee') roleElement.style.background = '#00E396'; // Green
        }

        // Set Avatar Letter
        const avatarElement = document.getElementById('profileAvatar');
        if (avatarElement) avatarElement.innerText = user.name.charAt(0).toUpperCase();

        // 3. Populate Form Inputs (Now that backend sends phone/address)
        if (document.getElementById('inputName')) document.getElementById('inputName').value = user.name;
        if (document.getElementById('inputEmail')) document.getElementById('inputEmail').value = user.email;
        
        // Use empty string "" if data is missing so it doesn't show "undefined"
        if (document.getElementById('inputPhone')) document.getElementById('inputPhone').value = user.phone || "";
        if (document.getElementById('inputAddress')) document.getElementById('inputAddress').value = user.address || "";

    } catch (error) {
        console.error(error);
        // If fetch fails, fallback to localStorage (Old data)
        const localUser = JSON.parse(localStorage.getItem('userInfo'));
        if(localUser) {
             document.getElementById('profileName').innerText = localUser.name;
             document.getElementById('profileRole').innerText = (localUser.role || "CUSTOMER").toUpperCase();
        }
    }
});

// --- EDIT & SAVE FUNCTIONS ---

function enableEdit() {
    // Enable all inputs except Email (usually email shouldn't change easily)
    document.getElementById('inputName').disabled = false;
    document.getElementById('inputPhone').disabled = false;
    document.getElementById('inputAddress').disabled = false;
    document.getElementById('inputPassword').disabled = false;

    // Show Save/Cancel, Hide Edit
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

// Handle Form Submit
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

    // Remove password if empty (so we don't save a blank password)
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
            // Update LocalStorage
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