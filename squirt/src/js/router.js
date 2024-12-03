// Simple router implementation
export function initializeRouter() {
    // Handle initial route
    handleRoute(window.location.hash);

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
        handleRoute(window.location.hash);
    });
}

function handleRoute(hash) {
    // Default to post view if no hash
    const route = hash.slice(1) || 'post';
    const viewId = `${route}-view`;

    // Show corresponding view
    const view = document.getElementById(viewId);
    if (view) {
        // Hide all views
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        // Show selected view
        view.classList.remove('hidden');
    }
}