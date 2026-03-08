const fs = require('fs');

async function run() {
    try {
        // Try contractor login. The seeder might have a different email, let's use a generic or check db
        // Typically test users are something like contractor@test.com
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'contractor@gmail.com', password: 'password123' })
        });
        
        let loginData = await loginRes.json();
        if (!loginData.success) {
            console.log('Login failed with contractor@gmail.com, trying contractor@test.com...', loginData);
            const loginRes2 = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'contractor@test.com', password: 'password123' })
            });
            loginData = await loginRes2.json();
            if (!loginData.success) {
                 console.log("Both logins failed. Make sure DB is seeded.", loginData);
                 return;
            }
        }
        
        const token = loginData.token;
        console.log("Logged in");

        const tendersRes = await fetch('http://localhost:3000/api/tenders');
        const tendersData = await tendersRes.json();
        if (!tendersData.data.length) {
            console.log('No tenders found to bid on.');
            return;
        }
        
        const tenderId = tendersData.data[0]._id;
        console.log("Bidding on tender", tenderId);

        const formData = new FormData();
        formData.append('quotedPrice', '150000');
        formData.append('timelineDays', '120');
        formData.append('experienceDetails', 'Testing bid submission bug');

        const bidRes = await fetch(`http://localhost:3000/api/tenders/${tenderId}/bids`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        
        const text = await bidRes.text();
        console.log("HTTP STATUS:", bidRes.status);
        console.log("RESPONSE:", text);

    } catch (err) {
        console.error("SCRIPT ERROR:", err);
    }
}
run();
