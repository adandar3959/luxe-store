let isLogin = true;
function switchTab(tab) {
    const nameGroup = document.getElementById('nameGroup');
    const submitBtn = document.getElementById('submitBtn');
    const tabs = document.querySelectorAll('.tab-btn');
    const errorMsg = document.getElementById('errorMsg');

    if(errorMsg) errorMsg.style.display = 'none';

    if (tab === 'signup') {
        isLogin = false;
        nameGroup.classList.remove('hidden');
        submitBtn.innerText = "Create Account";
        if(tabs[0]) tabs[0].classList.remove('active');
        if(tabs[1]) tabs[1].classList.add('active');
    } else {
        isLogin = true;
        nameGroup.classList.add('hidden');
        submitBtn.innerText = "Login";
        if(tabs[0]) tabs[0].classList.add('active');
        if(tabs[1]) tabs[1].classList.remove('active');
    }
}
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const name = document.getElementById('name').value.trim();
    const errorMsg = document.getElementById('errorMsg');
    if(!email || !password) {
        alert("Please fill in all fields");
        return;
    }
    const url = isLogin 
        ? '/api/users/login' 
        : '/api/users';
    const bodyData = { email, password };
    if (!isLogin) bodyData.name = name; // Only add name for signup

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userInfo', JSON.stringify(data));

            if (data.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (data.role === 'employee') {
                window.location.href = 'employee-orders.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            console.error("Server Error:", data.message);
            if(errorMsg) {
                errorMsg.innerText = data.message || "Invalid Email or Password";
                errorMsg.style.display = 'block';
            } else {
                alert(data.message || "Invalid Email or Password");
            }
        }

    } catch (error) {
        console.error("Network Error:", error);
        if(errorMsg) {
            errorMsg.innerText = "Cannot connect to server. Is Backend running?";
            errorMsg.style.display = 'block';
        } else {
            alert("Cannot connect to server.");
        }
    }
});
