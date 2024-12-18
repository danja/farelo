import { setupForms } from './ui/components/forms.js';
import { initializeRouter } from './router.js';
import { EndpointManager } from './services/sparql/endpoints.js';
import { state } from './core/state.js';
import { ErrorHandler } from './core/errors.js';

export const VIEWS = {
  POST: 'post-view',
  DEVELOPER: 'developer-view',
  PROFILE: 'profile-view',
  SETTINGS: 'settings-view'
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeApp();
  } catch (error) {
    ErrorHandler.handle(error);
  }
});

async function initializeApp() {
  setupViews();
  setupNavigation();
  setupForms();
  initializeRouter();

  const endpointManager = new EndpointManager();
  await endpointManager.initialize();
}

function setupViews() {
  const main = document.querySelector('main');
  if (!main) {
    throw new Error('Main element not found');
  }

  Object.values(VIEWS).forEach(viewId => {
    if (typeof viewId !== 'string' || !viewId.endsWith('-view')) {
      throw new Error(`Invalid view ID format: ${viewId}`);
    }

    if (!document.getElementById(viewId)) {
      const view = document.createElement('div');
      view.id = viewId;
      view.classList.add('view', 'hidden');
      main.appendChild(view);
    }
  });
}

function setupNavigation() {
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = e.target.getAttribute('data-view');
      if (viewId) {
        window.location.hash = viewId.replace('-view', '');
      }
    });
  });
}
