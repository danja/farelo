import { setupForms } from './forms.js';
import { initializeRouter } from './router.js';
import { SettingsManager } from './settings.js';

const VIEWS = {
  POST: 'post-view',
  DEVELOPER: 'developer-view',
  PROFILE: 'profile-view',
  SETTINGS: 'settings-view'
};

document.addEventListener('DOMContentLoaded', () => {
  setupViews();
  setupNavigation();
  setupForms();
  initializeRouter();

  const settingsManager = new SettingsManager();
  settingsManager.initialize();
  settingsManager.startStatusChecks();
});

function setupViews() {
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
  Object.values(VIEWS).forEach(id => {
    const view = document.getElementById(id);
    if (view) {
      view.classList.add('hidden');
    }
  });

  const selectedView = document.getElementById(viewId);
  if (selectedView) {
    selectedView.classList.remove('hidden');
  }
}