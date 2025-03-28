// Import dependencies with require
const formsModule = require('./ui/components/forms');
const routerModule = require('./router');
const endpointsModule = require('./services/sparql/endpoints');
const stateModule = require('./core/state');
const errorsModule = require('./core/errors');
const rdfModelModule = require('./services/rdf/rdf-model');
const notificationsModule = require('./ui/components/notifications');
const settingsModule = require('./ui/views/settings');

// Destructure imported modules
const { setupForms } = formsModule;
const { initializeRouter } = routerModule;
const { EndpointManager } = endpointsModule;
const { state } = stateModule;
const { ErrorHandler } = errorsModule;
const { rdfModel } = rdfModelModule;
const { initializeNotifications } = notificationsModule;
const { initializeSettingsView } = settingsModule;

// Define application views
export const VIEWS = {
  POST: 'post-view',
  DEVELOPER: 'developer-view',
  WIKI: 'wiki-view',
  PROFILE: 'profile-view',
  SETTINGS: 'settings-view'
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeApp();
  } catch (error) {
    ErrorHandler.handle(error);
  }
});

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('Initializing application...');
  
  try {
    // Set up the application structure
    setupViews();
    setupNavigation();
    setupHamburgerMenu();
    
    // Initialize notifications system
    initializeNotifications();
    
    // Initialize UI components
    setupForms();
    
    // Initialize view-specific components
    initializeSettingsView();
    
    // Initialize routing
    initializeRouter();
    
    // Initialize services
    const endpointManager = new EndpointManager();
    await endpointManager.initialize();
    
    // Register service worker for PWA support
    registerServiceWorker();
    
    // Check for share target (for mobile devices)
    checkForShareTarget();
    
    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing application:', error);
    ErrorHandler.handle(error);
  }
}

/**
 * Set up application views
 */
function setupViews() {
  const main = document.querySelector('main');
  if (!main) {
    throw new Error('Main element not found');
  }

  // Create any missing view containers
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
  
  // Add wiki view content if it doesn't exist
  const wikiView = document.getElementById(VIEWS.WIKI);
  if (wikiView && wikiView.children.length === 0) {
    wikiView.innerHTML = `
      <h2>Wiki</h2>
      <div class="wiki-editor">
        <div class="form-field">
          <label for="wiki-title">Title</label>
          <input type="text" id="wiki-title" name="title" required>
        </div>
        <div class="form-field">
          <label for="wiki-content">Content (Markdown supported)</label>
          <textarea id="wiki-content" name="content" rows="10" required></textarea>
        </div>
        <div class="form-field">
          <label for="wiki-tags">Tags (comma separated)</label>
          <input type="text" id="wiki-tags" name="tags" placeholder="tag1, tag2, tag3">
        </div>
        <button type="button" id="save-wiki">Save</button>
      </div>
      <div class="wiki-entries"></div>
    `;
  }
  
  // Add profile view content if it doesn't exist
  const profileView = document.getElementById(VIEWS.PROFILE);
  if (profileView && profileView.children.length === 0) {
    profileView.innerHTML = `
      <h2>Profile</h2>
      <form id="profile-form" class="form-group">
        <div class="form-field">
          <label for="profile-name">Name</label>
          <input type="text" id="profile-name" name="name">
        </div>
        <div class="form-field">
          <label for="profile-email">Email</label>
          <input type="email" id="profile-email" name="email">
        </div>
        <div class="form-field">
          <label for="profile-bio">Bio</label>
          <textarea id="profile-bio" name="bio"></textarea>
        </div>
        <button type="submit">Save Profile</button>
      </form>
    `;
  }
  
  // Add storage section to settings view if it doesn't exist
  const settingsView = document.getElementById(VIEWS.SETTINGS);
  if (settingsView && !settingsView.querySelector('.storage-section')) {
    const storageSection = document.createElement('div');
    storageSection.className = 'settings-section storage-section';
    storageSection.innerHTML = `
      <h3>Storage</h3>
      <div id="storage-usage">Calculating storage usage...</div>
    `;
    settingsView.appendChild(storageSection);
  }
}

/**
 * Set up navigation links
 */
function setupNavigation() {
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = e.target.getAttribute('data-view');
      if (viewId) {
        window.location.hash = viewId.replace('-view', '');
        
        // If we have a hamburger menu, close it when navigating
        const menu = document.querySelector('.hamburger-menu');
        if (menu && menu.classList.contains('active')) {
          menu.classList.remove('active');
          document.querySelector('nav').classList.remove('visible');
        }
      }
    });
  });
}

/**
 * Set up hamburger menu for mobile devices
 */
function setupHamburgerMenu() {
  // Check if hamburger button already exists
  if (document.querySelector('.hamburger-button')) return;
  
  // Create hamburger button
  const hamburgerButton = document.createElement('button');
  hamburgerButton.className = 'hamburger-button';
  hamburgerButton.setAttribute('aria-label', 'Menu');
  hamburgerButton.innerHTML = `
    <span></span>
    <span></span>
    <span></span>
  `;
  
  // Add button to header
  const header = document.querySelector('header');
  if (header) {
    // Add menu wrapper with class for styling
    const menuWrapper = document.createElement('div');
    menuWrapper.className = 'hamburger-menu';
    menuWrapper.appendChild(hamburgerButton);
    header.appendChild(menuWrapper);
    
    // Add toggle functionality
    hamburgerButton.addEventListener('click', () => {
      menuWrapper.classList.toggle('active');
      document.querySelector('nav').classList.toggle('visible');
    });
    
    // Add CSS if not already present
    if (!document.getElementById('hamburger-style')) {
      const style = document.createElement('style');
      style.id = 'hamburger-style';
      style.textContent = `
        .hamburger-menu {
          display: none;
        }
        
        /* Mobile styles */
        @media (max-width: 768px) {
          .hamburger-menu {
            display: block;
            position: relative;
            z-index: 100;
          }
          
          .hamburger-button {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 24px;
            padding: 0;
            width: 30px;
          }
          
          .hamburger-button span {
            background-color: var(--text-color);
            border-radius: 3px;
            display: block;
            height: 3px;
            transition: all 0.3s ease;
            width: 100%;
          }
          
          .hamburger-menu.active .hamburger-button span:nth-child(1) {
            transform: translateY(10px) rotate(45deg);
          }
          
          .hamburger-menu.active .hamburger-button span:nth-child(2) {
            opacity: 0;
          }
          
          .hamburger-menu.active .hamburger-button span:nth-child(3) {
            transform: translateY(-10px) rotate(-45deg);
          }
          
          nav {
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: none;
            flex-direction: column;
            gap: 0;
            left: 0;
            position: absolute;
            top: 100%;
            width: 100%;
          }
          
          nav.visible {
            display: flex;
          }
          
          nav a {
            border-bottom: 1px solid #eee;
            padding: 1rem;
            text-align: center;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

/**
 * Register service worker for PWA support
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}

/**
 * Check if the app was launched from a share target
 */
function checkForShareTarget() {
  // Check if this is a PWA launch with share data
  if (window.launchQueue) {
    window.launchQueue.setConsumer(async params => {
      if (params.files && params.files.length) {
        // Handle shared files
        const file = params.files[0];
        // Depending on the file type, process accordingly
        if (file.type.includes('text')) {
          const text = await file.text();
          // Pre-fill the post form
          const contentField = document.getElementById('content-field');
          if (contentField) {
            contentField.value = text;
          }
        }
      } else if (params.data && params.data.url) {
        // Handle shared URL
        const form = document.getElementById('post-form');
        const typeSelector = form.querySelector('[name="post-type"]');
        if (typeSelector) {
          typeSelector.value = 'link';
          updateFormFields(form, 'link');
          
          const urlField = form.querySelector('[name="url"]');
          if (urlField) {
            urlField.value = params.data.url;
          }
          
          if (params.data.title) {
            const titleField = form.querySelector('[name="title"]');
            if (titleField) {
              titleField.value = params.data.title;
            }
          }
          
          if (params.data.text) {
            const contentField = form.querySelector('[name="content"]');
            if (contentField) {
              contentField.value = params.data.text;
            }
          }
        }
      }
      
      // Switch to post view
      window.location.hash = 'post';
    });
  }
  
  // Check URL parameters for shared content
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('text') || urlParams.has('url') || urlParams.has('title')) {
    const form = document.getElementById('post-form');
    if (form) {
      // If there's a URL, use the link post type
      if (urlParams.has('url')) {
        const typeSelector = form.querySelector('[name="post-type"]');
        if (typeSelector) {
          typeSelector.value = 'link';
          // Make sure form fields are updated for link type
          if (typeof updateFormFields === 'function') {
            updateFormFields(form, 'link');
          }
          
          // Set the URL field
          setTimeout(() => {
            const urlField = form.querySelector('[name="url"]');
            if (urlField) {
              urlField.value = urlParams.get('url');
            }
          }, 100);
        }
      }
      
      // Set the title if provided
      if (urlParams.has('title')) {
        setTimeout(() => {
          const titleField = form.querySelector('[name="title"]');
          if (titleField) {
            titleField.value = urlParams.get('title');
          }
        }, 100);
      }
      
      // Set the content field if provided
      if (urlParams.has('text')) {
        setTimeout(() => {
          const contentField = form.querySelector('[name="content"]');
          if (contentField) {
            contentField.value = urlParams.get('text');
          }
        }, 100);
      }
      
      // Switch to post view
      window.location.hash = 'post';
    }
  }
}
