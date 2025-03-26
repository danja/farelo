/**
 * Main application entry point
 * Initializes and coordinates application components
 */

import SessionManager from './core/sessionManager.js';
import EventBus from './core/eventBus.js';
import ChatController from './ui/chat.js';
import NotificationManager from './ui/notifications.js';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initApplication();
});

/**
 * Initialize the application
 */
async function initApplication() {
  // Configuration from DOM
  const baseUrl = document.getElementById('baseUrl').value || window.location.origin;
  const sessionTimeoutMinutes = parseInt(document.getElementById('sessionTimeout').value, 10) || 30;
  
  // Show loading indicator
  document.getElementById('body-loader').style.display = 'block';
  
  // Initialize core components
  const eventBus = new EventBus();
  const notificationManager = new NotificationManager();
  
  // Initialize session manager
  const sessionManager = new SessionManager({
    baseUrl,
    timeoutMinutes: sessionTimeoutMinutes,
    timeoutWarningMinutes: 1,
    eventBus
  });
  
  // Initialize chat controller
  const chatController = new ChatController({
    sessionManager,
    eventBus,
    notificationManager,
    chatContainer: document.getElementById('chat-section')
  });
  
  // Setup event handlers
  setupEventHandlers(eventBus, sessionManager, notificationManager);
  
  try {
    // Initialize session
    await sessionManager.initialize();
    
    // Hide loader after successful initialization
    document.getElementById('body-loader').style.display = 'none';
    document.getElementById('body-content').style.display = 'block';
    
    // Initialize UI state
    updateConnectionStatus('connected');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    notificationManager.showError('Failed to initialize application. Please refresh the page.');
    
    // Hide loader on error
    document.getElementById('body-loader').style.display = 'none';
  }
}

/**
 * Setup application-wide event handlers
 */
function setupEventHandlers(eventBus, sessionManager, notificationManager) {
  // Session warning event
  eventBus.on('session:warning', (data) => {
    notificationManager.showSessionWarning(data.timeRemaining);
    updateConnectionStatus('warning', 'Session expiring soon');
  });
  
  // Session timeout event
  eventBus.on('session:timeout', () => {
    notificationManager.showTimeoutMessage();
    updateConnectionStatus('connecting', 'Reconnecting...');
  });
  
  // Session reconnect event
  eventBus.on('session:reconnect', () => {
    notificationManager.hideTimeoutMessage();
    updateConnectionStatus('connected', 'Connected');
    notificationManager.showSuccess('Session reconnected successfully');
  });
  
  // Session expired event
  eventBus.on('session:expired', () => {
    updateConnectionStatus('disconnected', 'Disconnected');
    notificationManager.showSessionExpired();
  });
  
  // Session ping events
  eventBus.on('session:ping', (data) => {
    if (!data.success) {
      updateConnectionStatus('warning', 'Connection issue');
    } else {
      updateConnectionStatus('connected', 'Connected');
    }
  });
  
  // Error events
  eventBus.on('session:error', (data) => {
    notificationManager.showError(data.message || 'An error occurred');
  });
}

/**
 * Update the connection status indicator
 */
function updateConnectionStatus(status, message) {
  const statusElement = document.querySelector('.connection-status');
  if (!statusElement) return;
  
  // Remove all status classes
  statusElement.classList.remove('status-connected', 'status-disconnected', 'status-connecting', 'status-warning');
  
  // Add new status class
  statusElement.classList.add(`status-${status}`);
  
  // Update status icon and message
  statusElement.innerHTML = `
    <i class="fas fa-${getStatusIcon(status)}"></i>
    <span>${message || getStatusMessage(status)}</span>
  `;
}

/**
 * Get icon for connection status
 */
function getStatusIcon(status) {
  switch (status) {
    case 'connected': return 'circle';
    case 'disconnected': return 'times-circle';
    case 'connecting': return 'sync';
    case 'warning': return 'exclamation-circle';
    default: return 'circle';
  }
}

/**
 * Get default message for connection status
 */
function getStatusMessage(status) {
  switch (status) {
    case 'connected': return 'Connected';
    case 'disconnected': return 'Disconnected';
    case 'connecting': return 'Connecting...';
    case 'warning': return 'Warning';
    default: return 'Unknown';
  }
}