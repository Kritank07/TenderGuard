// This file will add a beautiful toast notification when the user is near a tender.

(function () {
    // Only run if geolocation is supported
    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        return;
    }

    // A simple, modern glassmorphism toast UI function
    function showGeoToast(tender) {
        // Check if we already notified for this tender in this session
        const notifiedKey = `tg_notified_${tender._id}`;
        if (sessionStorage.getItem(notifiedKey)) {
            return;
        }

        // Create the toast container
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.maxWidth = '350px';
        toast.style.padding = '1.5rem';
        toast.style.borderRadius = '16px';
        toast.style.background = 'rgba(15, 23, 42, 0.85)';
        toast.style.backdropFilter = 'blur(12px)';
        toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        toast.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
        toast.style.color = '#f8fafc';
        toast.style.zIndex = '9999';
        toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        toast.style.fontFamily = '"Inter", sans-serif';

        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; box-shadow: 0 0 10px #3b82f6;"></div>
                    <span style="font-weight: 600; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Nearby Project</span>
                </div>
                <button id="close-toast-${tender._id}" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.25rem;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; line-height: 1.3;">${tender.title}</h4>
            <p style="margin: 0 0 1rem 0; font-size: 0.875rem; color: #cbd5e1; line-height: 1.5;">You are currently within ${tender.distance} meters of this infrastructure project. Notice any issues?</p>
            <div style="display: flex; gap: 0.5rem;">
                <a href="/public/complaints.html?tenderId=${tender._id}" style="flex: 1; text-align: center; background: #2563eb; color: white; padding: 0.625rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: background 0.2s;">
                    Report Issue
                </a>
                <a href="/public/portal.html" style="flex: 1; text-align: center; background: rgba(255, 255, 255, 0.1); color: white; padding: 0.625rem; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; transition: background 0.2s;">
                    View Details
                </a>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 100);

        // Handle close button
        document.getElementById(`close-toast-${tender._id}`).addEventListener('click', () => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 400);
            sessionStorage.setItem(notifiedKey, 'true'); // mark as dismissed for this session
        });

        // Mark as notified so it doesn't pop up continuously while walking
        sessionStorage.setItem(notifiedKey, 'true');
    }

    // A simple toast for when no infrastructure is nearby
    function showNoGeoToast() {
        const notifiedKey = 'tg_notified_none';
        if (sessionStorage.getItem(notifiedKey)) {
            return;
        }

        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.maxWidth = '350px';
        toast.style.padding = '1.5rem';
        toast.style.borderRadius = '16px';
        toast.style.background = 'rgba(15, 23, 42, 0.85)';
        toast.style.backdropFilter = 'blur(12px)';
        toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        toast.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
        toast.style.color = '#f8fafc';
        toast.style.zIndex = '9999';
        toast.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
        toast.style.fontFamily = '"Inter", sans-serif';

        toast.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #64748b; box-shadow: 0 0 10px #64748b;"></div>
                    <span style="font-weight: 600; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">Location Checked</span>
                </div>
                <button id="close-toast-none" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 0.25rem;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <h4 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; line-height: 1.3;">No Projects Nearby</h4>
            <p style="margin: 0; font-size: 0.875rem; color: #cbd5e1; line-height: 1.5;">We couldn't find any active infrastructure projects within 500 meters of your current location down on the map.</p>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 100);

        // Handle close button
        document.getElementById(`close-toast-none`).addEventListener('click', () => {
            toast.style.transform = 'translateY(100px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
            }, 400);
            sessionStorage.setItem(notifiedKey, 'true'); // mark as dismissed for this session
        });

        // Auto close after 5 seconds to be less intrusive
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.transform = 'translateY(100px)';
                toast.style.opacity = '0';
                setTimeout(() => {
                    toast.remove();
                }, 400);
                sessionStorage.setItem(notifiedKey, 'true');
            }
        }, 5000);

        sessionStorage.setItem(notifiedKey, 'true');
    }

    async function checkNearbyProjects(position) {
        const { latitude, longitude } = position.coords;

        try {
            // Using a default of 500 meters for our radius logic on backend
            // Note: The route is mounted at /api/tenders, not /api/v1/tenders in server.js
            const response = await fetch(`/api/tenders/nearby?lat=${latitude}&lng=${longitude}&radius=500`);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                // Show toast for the closest one
                showGeoToast(data.data[0]);
            } else {
                // Show notification that no projects are nearby
                showNoGeoToast();
            }
        } catch (error) {
            console.error('Error fetching nearby tenders:', error);
        }
    }

    function handleGeoError(error) {
        console.warn('Geolocation error:', error.message);
    }

    // Call once on load after a slight delay
    setTimeout(() => {
        navigator.geolocation.getCurrentPosition(checkNearbyProjects, handleGeoError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    }, 2000);

    // Optional: watch position if you want continuous updates
    // const watchId = navigator.geolocation.watchPosition(checkNearbyProjects, handleGeoError, {
    //     enableHighAccuracy: true,
    //     timeout: 10000,
    //     maximumAge: 30000
    // });

})();
