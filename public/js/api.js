const API_URL = '/api';

// Auth0 Configuration
const AUTH0_DOMAIN = 'tenderguard.us.auth0.com'; 
const AUTH0_CLIENT_ID = 'dxFL4POncGYKPyhusbt41DLcxRps0n6g'; 
const AUTH0_AUDIENCE = 'https://tenderguard.us.auth0.com/api/v2/'; 

let auth0Client = null;

const initAuth0 = async () => {
    if (window.auth0) {
        auth0Client = await window.auth0.createAuth0Client({
            domain: AUTH0_DOMAIN,
            clientId: AUTH0_CLIENT_ID,
            authorizationParams: {
                audience: AUTH0_AUDIENCE,
                redirect_uri: window.location.origin,
            }
        });

        // Handle redirect callback if URL has code and state
        if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
            try {
                await auth0Client.handleRedirectCallback();
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Sync user with backend
                await api.syncUser();
            } catch (err) {
                console.error("Error parsing redirect:", err);
            }
        }
        
        // Update UI or local state based on authentication
        const isAuthenticated = await auth0Client.isAuthenticated();
        if (isAuthenticated) {
            const token = await auth0Client.getTokenSilently();
            localStorage.setItem('auth0_token', token);
            // Sync/Fetch local user data for roles if needed
            if (!localStorage.getItem('user')) {
                await api.syncUser();
            }
        } else {
            localStorage.removeItem('auth0_token');
            localStorage.removeItem('user');
        }
    }
};

const api = {
    // Auth0 Integration
    loginWithRedirect: async () => {
        if (!auth0Client) await initAuth0();
        if (auth0Client) {
            await auth0Client.loginWithRedirect();
        } else {
            console.error('Auth0 Client not loaded. Make sure auth0-spa-js is included.');
        }
    },
    logout: async () => {
        if (!auth0Client) await initAuth0();
        if (auth0Client) {
            localStorage.removeItem('auth0_token');
            localStorage.removeItem('user');
            await auth0Client.logout({ logoutParams: { returnTo: window.location.origin } });
        }
    },
    syncUser: async () => {
        if (!auth0Client) return;
        const token = await auth0Client.getTokenSilently();
        const auth0User = await auth0Client.getUser();
        try {
            const res = await fetch(`${API_URL}/auth/sync`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: auth0User.email, name: auth0User.name })
            });
            const data = await res.json();
            if (data.success && data.data) {
                localStorage.setItem('user', JSON.stringify(data.data));
            }
            return data;
        } catch(e) { console.error('Sync error:', e); }
    },

    // Legacy Auth methods mapped to Auth0 for compatibility
    login: async () => { await api.loginWithRedirect(); return { success: true }; },
    register: async () => { await api.loginWithRedirect(); return { success: true }; },
    
    // Utilities to get auth headers
    getAuthHeaders: () => {
        const token = localStorage.getItem('auth0_token'); // use auth0 token
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
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

    // Bids
    getBids: async (tenderId) => {
        const res = await fetch(`${API_URL}/tenders/${tenderId}/bids`, {
            headers: api.getAuthHeaders()
        });
        return res.json();
    },
    submitBid: async (tenderId, formData) => {
        const token = localStorage.getItem('auth0_token');
        const res = await fetch(`${API_URL}/tenders/${tenderId}/bids`, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
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
        const token = localStorage.getItem('auth0_token');
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
window.checkAuth = async function(requiredRole) {
    await initAuth0(); // ensure it's initialized and redirected back 
    
    let token = localStorage.getItem('auth0_token');
    let userStr = localStorage.getItem('user');
    
    // Attempt silent token request if not found (e.g., page refresh)
    if (!token && auth0Client) {
         try {
             token = await auth0Client.getTokenSilently();
             localStorage.setItem('auth0_token', token);
         } catch(e) {}
    }

    if (!token) {
        // Redirect to Auth0 login instead of local login
        await api.loginWithRedirect();
        return null;
    }

    if (!userStr && token) {
        await api.syncUser();
        userStr = localStorage.getItem('user');
    }

    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        alert('Authentication failed to sync');
        window.location.href = '/';
        return null;
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
        alert('Unauthorized access');
        window.location.href = '/';
        return null;
    }

    return user;
}

window.api = api;
window.initAuth0 = initAuth0;
