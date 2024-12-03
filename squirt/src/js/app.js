// Main application logic
import { setupForms } from './forms.js';
import { initializeRouter } from './router.js';

// View IDs
const VIEWS = {
  POST: 'post-view',
  DEVELOPER: 'developer-view',
  PROFILE: 'profile-view',
  SETTINGS: 'settings-view'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  setupViews();
  setupNavigation();
  setupForms();
  initializeRouter();
});

function setupViews() {
  // Ensure all view containers exist
  Object.values(VIEWS).forEach(viewId => {
    if (!document.getElementById(viewId)) {
      const view = document.createElement('div');
      view.id = viewId;
      view.classList.add('view', 'hidden');
      document.querySelector('main').appendChild(view);
    }
  });
}

function setupNavigation() {
  // Handle navigation clicks
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = e.target.getAttribute('data-view');
      if (viewId) {
        showView(viewId);
      }
    });
  });
}

function showView(viewId) {
  // Hide all views
  Object.values(VIEWS).forEach(id => {
    const view = document.getElementById(id);
    if (view) {
      view.classList.add('hidden');
    }
  });

  // Show selected view
  const selectedView = document.getElementById(viewId);
  if (selectedView) {
    selectedView.classList.remove('hidden');
  }
}