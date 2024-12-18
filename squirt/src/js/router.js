import { state } from './core/state.js';
import { ErrorHandler } from './core/errors.js';
import { VIEWS } from './app.js';

/**
 * Initialize the router
 */
export function initializeRouter() {
    if (!VIEWS) {
        throw new Error('VIEWS constant not available');
    }

    /**
     * Valid routes derived from view IDs
     * @constant {string[]}
     */
    const VALID_ROUTES = Object.values(VIEWS).map(view => view.replace('-view', ''));

    window.addEventListener('hashchange', () => {
        handleRoute(window.location.hash, VALID_ROUTES);
    });

    handleRoute(window.location.hash, VALID_ROUTES);
}

/**
 * Handle route changes
 * @param {string} hash - URL hash including #
 * @param {string[]} validRoutes - List of valid routes
 */
function handleRoute(hash, validRoutes) {
    try {
        const route = hash.slice(1) || 'post';
        
        if (!validRoutes.includes(route)) {
            throw new Error(`Invalid route: ${route}`);
        }

        const viewId = `${route}-view`;
        const view = document.getElementById(viewId);
        
        if (!view) {
            throw new Error(`View not found: ${viewId}`);
        }

        const currentView = state.get('currentView');
        
        // Fire pre-route change event
        const event = new CustomEvent('routeChange', {
            detail: {
                from: currentView,
                to: viewId
            },
            cancelable: true
        });

        if (!document.dispatchEvent(event)) {
            // Route change was prevented
            if (currentView) {
                window.location.hash = currentView.replace('-view', '');
            }
            return;
        }

        state.update('previousView', currentView);
        state.update('currentView', viewId);

        Object.values(VIEWS).forEach(id => {
            const view = document.getElementById(id);
            if (view) {
                view.classList.add('hidden');
            }
        });
        
        view.classList.remove('hidden');

    } catch (error) {
        ErrorHandler.handle(error);
        if (hash !== '#post') {
            window.location.hash = '#post';
        }
    }
}
