const token = localStorage.getItem('userToken');

document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    fetchSubscribers();

    const broadcastForm = document.getElementById('broadcastForm');
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', sendBroadcast);
    }
});
async function fetchSubscribers() {
    const listBody = document.getElementById('subscriberList');
    if (!listBody) return;

    try {
        const response = await fetch('/api/newsletter/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const subscribers = await response.json();
        
        if (subscribers.length === 0) {
            listBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No subscribers found.</td></tr>';
            return;
        }

        listBody.innerHTML = subscribers.map(s => `
            <tr>
                <td>${s.email}</td>
                <td>${new Date(s.subscribedAt).toLocaleDateString()}</td>
                <td>
                    <button onclick="deleteSubscriber('${s._id}')" class="btn-delete">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Error fetching subscribers:", err);
    }
}
async function sendBroadcast(e) {
    e.preventDefault();
    const subject = document.getElementById('emailSubject').value;
    const message = document.getElementById('emailMessage').value;

    if(!confirm("Send this broadcast to ALL subscribers?")) return;
    const submitBtn = e.target.querySelector('button');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    try {
        const response = await fetch('https://luxe-store-nmvs.onrender.com/api/newsletter/send-bulk', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ subject, message })
        });

        if (response.ok) {
            alert("Broadcast successfully sent to your customers!");
            document.getElementById('broadcastForm').reset();
        } else {
            const error = await response.json();
            alert("Error: " + error.message);
        }
    } catch (err) {
        alert("Server error. Please check your Render logs.");
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}
async function deleteSubscriber(id) {
    if (!confirm("Remove this email from the newsletter list?")) return;

    try {
        const response = await fetch(`/api/newsletter/delete/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            fetchSubscribers(); // Refresh the list
        }
    } catch (err) {
        alert("Failed to delete subscriber.");
    }
}
