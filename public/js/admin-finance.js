document.addEventListener('DOMContentLoaded', () => {
    fetchFinanceData();
});

async function fetchFinanceData() {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    try {
        const res = await fetch('/api/admin/finance', {
            headers: { 'Authorization': `Bearer ${userInfo.token}` }
        });
        const data = await res.json();

        // 1. Update KPIs
        document.getElementById('totalRevenue').innerText = `${data.totalRevenue.toLocaleString()}RS`;
        document.getElementById('totalExpenses').innerText = `${data.totalExpenses.toLocaleString()}RS`;
        document.getElementById('netProfit').innerText = `${data.netProfit.toLocaleString()}RS`;

        // 2. Render Payroll Table
        const payrollTable = document.getElementById('payrollTable');
        payrollTable.innerHTML = '';
        
        data.employeeStatus.forEach(emp => {
            const isPaid = emp.status === 'Paid';
            payrollTable.innerHTML += `
                <tr>
                    <td>${emp.name}</td>
                    <td>${emp.position}</td>
                    <td>$${emp.salary}</td>
                    <td class="${isPaid ? 'status-paid' : 'status-unpaid'}">${emp.status}</td>
                    <td>
                        <button class="btn-pay" ${isPaid ? 'disabled' : ''} onclick="paySalary('${emp._id}', ${emp.salary})">
                            ${isPaid ? 'Paid' : 'Pay Now'}
                        </button>
                    </td>
                </tr>
            `;
        });

        // 3. Render Transactions
        const txTable = document.getElementById('transactionTable');
        txTable.innerHTML = '';

        data.transactions.forEach(tx => {
            const date = new Date(tx.createdAt).toLocaleDateString(); // Note: Check if backend sends 'createdAt' or 'date'
            const color = tx.type === 'Income' ? '#00E396' : '#FF4560';
            
            txTable.innerHTML += `
                <tr>
                    <td>${date}</td>
                    <td>${tx.category}</td>
                    <td>${tx.description || '-'}</td>
                    <td><span style="color:${color}">${tx.type}</span></td>
                    <td style="font-weight:bold; color:${color}">${tx.amount.toLocaleString()}RS</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error(error);
    }
}

window.paySalary = async (id, amount) => {
    if(!confirm(`Confirm payment of ${amount}RS ?`)) return;

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    try {
        const res = await fetch('/api/admin/finance/pay-salary', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userInfo.token}`
            },
            body: JSON.stringify({ employeeId: id, amount: amount })
        });

        const data = await res.json();

        if(res.ok) {
            alert("Salary Paid Successfully!");
            
            // 👇 RELOAD DATA IMMEDIATELY
            await fetchFinanceData(); 
            
        } else {
            alert("Payment Failed: " + data.message);
        }
    } catch(e) { 
        console.error(e); 
        alert("Network Error");
    }
}