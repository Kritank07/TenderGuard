const API_URL = '/api';
const api = {
    // Auth
    login: async (email, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return res.json();
    },
    register: async (data) => {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // Utilities to get auth headers
    getAuthHeaders: () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    // Tenders
    getTenders: async () => {
        const res = await fetch(`${API_URL}/tenders`);
        return res.json();
    },
    getTender: async (id) => {
        const res = await fetch(`${API_URL}/tenders/${id}`);
        return res.json();
    },
    createTender: async (data) => {
        const res = await fetch(`${API_URL}/tenders`, {
            method: 'POST',
            headers: api.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },
    updateTender: async (id, data) => {
        const res = await fetch(`${API_URL}/tenders/${id}`, {
            method: 'PUT',
            headers: api.getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    },

    // Bids
    getBids: async (tenderId) => {
        const res = await fetch(`${API_URL}/tenders/${tenderId}/bids`, {
            headers: api.getAuthHeaders()
        });
        return res.json();
    },
    submitBid: async (tenderId, formData) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/tenders/${tenderId}/bids`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type for FormData, browser sets it with boundary
            },
            body: formData
        });
        return res.json();
    },

    // Stats
    getStats: async () => {
        const res = await fetch(`${API_URL}/stats`);
        return res.json();
    },

    // Complaints
    getComplaints: async () => {
        const res = await fetch(`${API_URL}/complaints`);
        return res.json();
    },
    submitComplaint: async (formData) => {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_URL}/complaints`, {
            method: 'POST',
            headers,
            body: formData
        });
        return res.json();
    }
};

// Check auth status on protected pages
function checkAuth(requiredRole) {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = '/login.html';
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        alert('Unauthorized access');
        window.location.href = '/';
        return null;
    }

    return user;
}

window.api = api;
window.checkAuth = checkAuth;
