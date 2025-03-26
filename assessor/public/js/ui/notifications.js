/**
 * Notifications module for displaying UI alerts and notifications
 */

class NotificationManager {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.animationClass = options.animationClass || 'animate__animated';
    this.fadeInClass = options.fadeInClass || 'animate__fadeIn';
    this.fadeOutClass = options.fadeOutClass || 'animate__fadeOut';
    this.defaultDuration = options.defaultDuration || 5000; // 5 seconds
    
    // Track active notifications
    this.activeNotifications = new Map();
    this.notificationCounter = 0;
  }
  
  /**
   * Show session warning notification
   * @param {Number} timeRemaining - Time remaining in seconds
   * @returns {String} Notification ID
   */
  showSessionWarning(timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    return this.showNotification({
      type: 'warning',
      title: 'Session Expiring Soon',
      message: `Your session will expire in ${formattedTime}. Please continue interacting to stay connected.`,
      duration: 0, // Stays until explicitly closed
      actions: [
        {
          text: 'Continue Session',
          callback: () => {
            document.dispatchEvent(new Event('click')); // Trigger activity
            return true; // Close notification after action
          }
        }
      ],
      id: 'session-warning' // Use specific ID to prevent duplicates
    });
  }
  
  /**
   * Show session timeout notification
   * @param {String} message - Custom message
   * @returns {String} Notification ID
   */
  showTimeoutMessage(message = 'Your session is about to expire. We are trying to keep you connected...') {
    return this.showNotification({
      type: 'timeout',
      title: 'Session Timeout',
      message,
      duration: 0, // Stays until explicitly closed
      spinner: true,
      position: 'center',
      id: 'timeout-message' // Use specific ID to prevent duplicates
    });
  }
  
  /**
   * Show connection status notification
   * @param {String} status - Connection status: 'connected', 'disconnected', 'connecting'
   * @param {String} message - Custom message
   */
  updateConnectionStatus(status, message) {
    const statusElement = document.querySelector('.connection-status');
    if (!statusElement) return;
    
    // Remove all status classes
    statusElement.classList.remove('status-connected', 'status-disconnected', 'status-connecting');
    
    // Add new status class
    statusElement.classList.add(`status-${status}`);
    
    // Update message if provided
    if (message) {
      const messageElement = statusElement.querySelector('span');
      if (messageElement) {
        messageElement.textContent = message;
      }
    }
  }
  
  /**
   * Hide timeout message
   * @param {String} id - Notification ID (defaults to timeout-message)
   */
  hideTimeoutMessage(id = 'timeout-message') {
    this.hideNotification(id);
  }
  
  /**
   * Show session expired overlay
   */
  showSessionExpired() {
    const expiredOverlay = document.querySelector('.session-expired');
    if (expiredOverlay) {
      // Hide main content
      document.querySelector('.msg-outer-container').style.display = 'none';
      
      // Show expired message
      expiredOverlay.classList.remove('d-none');
      
      // Add refresh button functionality
      const refreshButton = expiredOverlay.querySelector('.btn-ok');
      if (refreshButton) {
        refreshButton.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.reload();
        });
      }
    }
  }
  
  /**
   * Show a generic notification
   * @param {Object} options - Notification options
   * @returns {String} Notification ID
   */
  showNotification(options = {}) {
    // If notification with this ID already exists, remove it first
    if (options.id && this.activeNotifications.has(options.id)) {
      this.hideNotification(options.id);
    }
    
    // Generate ID if not provided
    const id = options.id || `notification-${++this.notificationCounter}`;
    
    // Set notification type and position
    const type = options.type || 'info';
    const position = options.position || 'bottom-right';
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${type} notification-${position} ${this.animationClass} ${this.fadeInClass}`;
    
    // Build notification content
    let contentHtml = '';
    
    if (options.title) {
      contentHtml += `<div class="notification-title">${options.title}</div>`;
    }
    
    if (options.message) {
      contentHtml += `<div class="notification-message">${options.message}</div>`;
    }
    
    if (options.spinner) {
      contentHtml = `
        <div class="notification-spinner"></div>
        ${contentHtml}
      `;
    }
    
    // Add actions if provided
    if (options.actions && options.actions.length > 0) {
      contentHtml += '<div class="notification-actions">';
      options.actions.forEach(action => {
        contentHtml += `<button class="notification-action">${action.text}</button>`;
      });
      contentHtml += '</div>';
    }
    
    notification.innerHTML = contentHtml;
    
    // Add to DOM
    this.container.appendChild(notification);
    
    // Store notification
    this.activeNotifications.set(id, {
      element: notification,
      options,
      timer: null
    });
    
    // Add action event listeners
    if (options.actions && options.actions.length > 0) {
      const actionButtons = notification.querySelectorAll('.notification-action');
      options.actions.forEach((action, index) => {
        if (actionButtons[index] && typeof action.callback === 'function') {
          actionButtons[index].addEventListener('click', () => {
            const shouldClose = action.callback();
            if (shouldClose !== false) {
              this.hideNotification(id);
            }
          });
        }
      });
    }
    
    // Auto-hide after duration if specified
    if (options.duration !== 0) {
      const duration = options.duration || this.defaultDuration;
      const timer = setTimeout(() => {
        this.hideNotification(id);
      }, duration);
      
      // Store timer reference
      if (this.activeNotifications.has(id)) {
        this.activeNotifications.get(id).timer = timer;
      }
    }
    
    return id;
  }
  
  /**
   * Hide a notification by ID
   * @param {String} id - Notification ID
   */
  hideNotification(id) {
    if (!this.activeNotifications.has(id)) return;
    
    const { element, timer } = this.activeNotifications.get(id);
    
    // Clear any pending timer
    if (timer) clearTimeout(timer);
    
    // Add fade out animation
    element.classList.remove(this.fadeInClass);
    element.classList.add(this.fadeOutClass);
    
    // Remove after animation completes
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeNotifications.delete(id);
    }, 500);
  }
  
  /**
   * Hide all active notifications
   */
  hideAllNotifications() {
    for (const id of this.activeNotifications.keys()) {
      this.hideNotification(id);
    }
  }
  
  /**
   * Show error message
   * @param {String} message - Error message
   * @param {String} title - Error title
   * @returns {String} Notification ID
   */
  showError(message, title = 'Error') {
    return this.showNotification({
      type: 'error',
      title,
      message,
      duration: 10000 // 10 seconds
    });
  }
  
  /**
   * Show success message
   * @param {String} message - Success message
   * @param {String} title - Success title
   * @returns {String} Notification ID
   */
  showSuccess(message, title = 'Success') {
    return this.showNotification({
      type: 'success',
      title,
      message,
      duration: 5000 // 5 seconds
    });
  }
  
  /**
   * Show info message
   * @param {String} message - Info message
   * @param {String} title - Info title
   * @returns {String} Notification ID
   */
  showInfo(message, title = 'Information') {
    return this.showNotification({
      type: 'info',
      title,
      message,
      duration: 5000 // 5 seconds
    });
  }
}

export default NotificationManager;