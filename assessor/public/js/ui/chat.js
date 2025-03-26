/**
 * Chat controller for managing chat interface and interactions
 */

import MessageRenderer from './messageRenderer.js';

class ChatController {
  /**
   * Initialize chat controller
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.sessionManager = options.sessionManager;
    this.eventBus = options.eventBus;
    this.notificationManager = options.notificationManager;
    this.chatContainer = options.chatContainer || document.getElementById('chat-section');
    
    this.messageRenderer = new MessageRenderer({
      container: this.chatContainer
    });
    
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.userResponses = [];
    this.initialLoad = true;
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Register session event handlers
    this.registerSessionEvents();
  }
  
  /**
   * Register session-related event handlers
   */
  registerSessionEvents() {
    if (!this.eventBus) {
      console.error('EventBus not available');
      return;
    }
    
    console.log('Registering session events');
    
    // Handle session created
    this.eventBus.on('session:created', (data) => {
      console.log('Session created event received:', data);
      
      if (!data || !data.sessionData || !data.sessionData.questions) {
        console.error('Invalid session data received:', data);
        return;
      }
      
      this.questions = data.sessionData.questions;
      this.currentQuestionIndex = 0;
      this.userResponses = [];
      
      // Clear any existing content
      if (this.chatContainer) {
        this.chatContainer.innerHTML = '';
      }
      
      console.log('Loading first question');
      // Load first question
      this.loadCurrentQuestion();
    });
    
    // Handle session recovered
    this.eventBus.on('session:recovered', async (data) => {
      console.log('Session recovered event received:', data);
      
      try {
        // Get full session state including questions and responses
        console.log('Getting session state for', data.sessionId);
        const sessionData = await this.sessionManager.api.getSessionState(data.sessionId);
        console.log('Retrieved session state:', sessionData);
        
        // Update local state
        this.questions = sessionData.questions;
        this.currentQuestionIndex = sessionData.currentQuestionIndex;
        this.userResponses = sessionData.responses;
        
        // Rebuild chat history
        this.rebuildChatHistory();
        
        // If assessment not complete, load current question
        if (!sessionData.isComplete) {
          this.loadCurrentQuestion();
        }
      } catch (error) {
        console.error('Failed to recover chat state:', error);
        
        // Fallback: Start from beginning
        if (data && data.sessionData && data.sessionData.questions) {
          this.questions = data.sessionData.questions;
          this.currentQuestionIndex = 0;
          this.userResponses = [];
          
          this.loadCurrentQuestion();
        } else {
          console.error('No fallback data available');
        }
      }
    });
    
    // Removing force initialization to prevent duplicate welcome message
    /*
    if (this.sessionManager && this.sessionManager.isActive()) {
      console.log('Session is already active, manually triggering first question');
      setTimeout(() => {
        if (this.questions && this.questions.length > 0) {
          console.log('Loading first question from init');
          this.loadCurrentQuestion();
        } else {
          console.error('No questions available for initialization');
        }
      }, 1000);
    }
    */
  }
  
  /**
   * Set up chat interaction event handlers
   */
  setupEventHandlers() {
    console.log('Setting up chat event handlers');
    
    // Use event delegation for dynamic elements
    document.addEventListener('click', (event) => {
      console.log('Click event:', event.target);
      
      // Option button clicks
      if (event.target.classList.contains('option-buttons')) {
        console.log('Option button clicked:', event.target);
        this.handleOptionSelection(event.target);
      }
      
      // Checkbox handling
      if (event.target.classList.contains('check-option')) {
        console.log('Checkbox clicked:', event.target);
        this.handleCheckboxChange(event.target);
      }
      
      // Send button for text inputs
      if (event.target.classList.contains('option-buttons-icon')) {
        console.log('Send button clicked:', event.target);
        this.handleCustomInput(event.target);
      }
      
      // Arrow down indicator click (scroll to bottom)
      if (event.target.closest('.arrow-downs')) {
        console.log('Arrow down clicked');
        this.scrollToBottom();
      }
    });
    
    // Form validation for text inputs
    document.addEventListener('keyup', (event) => {
      if (event.target.classList.contains('validateFields')) {
        console.log('Validating input:', event.target);
        this.validateInput(event.target);
        
        // Handle enter key for text inputs
        if (event.key === 'Enter' && !event.target.classList.contains('invalid-value')) {
          console.log('Enter key pressed in valid input');
          const sendButton = event.target.closest('.input-block')?.querySelector('.option-buttons-icon');
          if (sendButton) {
            console.log('Triggering send button click');
            sendButton.click();
          }
        }
      }
    });
    
    // Scroll detection for UI indicators
    document.addEventListener('scroll', () => this.checkVisibility());
    
    // Debug the chat container
    console.log('Chat container:', this.chatContainer);
  }
  
  /**
   * Load and display the current question
   */
  loadCurrentQuestion() {
    console.log('Loading current question. Index:', this.currentQuestionIndex, 'Total questions:', this.questions?.length);
    
    if (!this.questions || this.questions.length === 0) {
      console.error('No questions available to load');
      return;
    }
    
    if (this.currentQuestionIndex >= this.questions.length) {
      console.log('Assessment complete');
      return;
    }
    
    const question = this.questions[this.currentQuestionIndex];
    console.log('Displaying question:', question);
    
    if (!question) {
      console.error('Question not found at index:', this.currentQuestionIndex);
      return;
    }
    
    // Create the message container and render question
    this.messageRenderer.renderQuestion(question);
    
    // Add the question options with a slight delay
    if (!question.isCustomInput) {
      console.log('Setting timeout to render options for question:', question.id);
      setTimeout(() => {
        console.log('Rendering options for question:', question.id);
        this.messageRenderer.renderOptions(question);
      }, 1000);
    }
    
    this.checkVisibility();
    this.scrollToVisible();
  }
  
  /**
   * Rebuild chat history from saved responses
   */
  rebuildChatHistory() {
    // Clear chat container
    this.messageRenderer.clearChat();
    
    // Rebuild all previous interactions
    this.userResponses.forEach((response) => {
      const question = this.questions.find(q => q.id === response.questionId);
      if (!question) return;
      
      // Render question
      this.messageRenderer.renderQuestion(question);
      
      // Render user response
      this.messageRenderer.renderUserResponse(
        response.questionId,
        response.responseValue,
        response.responseType,
        question
      );
    });
  }
  
  /**
   * Handle option button selection
   * @param {HTMLElement} button - The clicked button element
   */
  handleOptionSelection(button) {
    // Disable the button to prevent multiple clicks
    button.disabled = true;
    
    const questionId = button.getAttribute('questionid');
    const optionId = button.getAttribute('optionid');
    const btnType = button.getAttribute('btn-type') || 'option';
    
    // Get the current question
    const question = this.questions.find(q => q.id === questionId);
    
    // Handle different button types
    if (btnType === 'skip-check') {
      // Skip button for checkboxes
      this.saveResponse(questionId, '', 'skip', question);
    } else if (btnType === 'next-check') {
      // Next button for selected checkboxes
      const selectedOptions = button.getAttribute('optionid').split(',');
      this.saveResponse(questionId, selectedOptions.join(','), 'checkbox', question);
    } else {
      // Standard option selection
      this.saveResponse(questionId, optionId, 'option', question);
    }
  }
  
  /**
   * Handle checkbox option changes
   * @param {HTMLElement} checkbox - The changed checkbox element
   */
  handleCheckboxChange(checkbox) {
    const questionId = checkbox.getAttribute('questionid');
    const checkboxes = document.querySelectorAll(`.check-option[questionid="${questionId}"]`);
    const skipCheckBtn = document.querySelector(`.skip-check-btn[questionid="${questionId}"]`);
    
    if (!skipCheckBtn) return;
    
    // Count selected checkboxes
    const selectedCheckboxes = Array.from(checkboxes).filter(cb => cb.checked);
    
    // Get the current question
    const question = this.questions.find(q => q.id === questionId);
    
    if (selectedCheckboxes.length > 0) {
      // Update the button text and attributes for selection
      const buttonText = question?.nextButtonText || 'Next';
      skipCheckBtn.textContent = buttonText;
      skipCheckBtn.setAttribute('btn-type', 'next-check');
      
      // Create a comma-separated list of selected option IDs
      const selectedOptionIds = selectedCheckboxes.map(cb => cb.value).join(',');
      skipCheckBtn.setAttribute('optionid', selectedOptionIds);
      
      // Style selected options
      checkboxes.forEach(cb => {
        const checkboxOuter = cb.closest('.check-area-outer');
        if (checkboxOuter) {
          if (cb.checked) {
            checkboxOuter.classList.add('check-outer-active');
          } else {
            checkboxOuter.classList.remove('check-outer-active');
          }
        }
      });
    } else {
      // Reset button for no selection
      const buttonText = question?.buttonText || 'Skip';
      skipCheckBtn.textContent = buttonText;
      skipCheckBtn.setAttribute('btn-type', 'skip-check');
      skipCheckBtn.setAttribute('optionid', '');
      
      // Remove active styling
      checkboxes.forEach(cb => {
        const checkboxOuter = cb.closest('.check-area-outer');
        if (checkboxOuter) {
          checkboxOuter.classList.remove('check-outer-active');
        }
      });
    }
  }
  
  /**
   * Handle custom text input submission
   * @param {HTMLElement} button - The clicked send button element
   */
  handleCustomInput(button) {
    const questionId = button.getAttribute('questionid');
    const inputBlock = button.closest('.input-block') || button.closest('.text-paragraph');
    if (!inputBlock) return;
    
    const input = inputBlock.querySelector('.input-option');
    if (!input) return;
    
    // Validate input
    if (input.classList.contains('invalid-value') || !input.value.trim()) {
      input.classList.add('invalid-value');
      return;
    }
    
    const inputValue = input.value.trim();
    const fieldName = input.getAttribute('name') || '';
    
    // Get the current question
    const question = this.questions.find(q => q.id === questionId);
    
    // Save the response and proceed
    this.saveResponse(questionId, inputValue, 'text', question, fieldName);
    
    // Hide the input after submission
    inputBlock.style.display = 'none';
  }
  
  /**
   * Validate text inputs
   * @param {HTMLElement} input - The input element to validate
   * @returns {Boolean} Whether input is valid
   */
  validateInput(input) {
    const value = input.value.trim();
    const fieldName = input.getAttribute('name') || '';
    
    // Remove previous validation messages
    input.classList.remove('invalid-value');
    const existingMessage = input.parentNode.querySelector('.text-danger');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    // Basic validation - check if empty
    if (value === '') {
      input.classList.add('invalid-value');
      input.closest('.input-block')?.classList.add('invalid');
      input.closest('.input-block')?.querySelector('.option-buttons-icon')?.classList.remove('option-buttons');
      return false;
    }
    
    // Email validation if field is email_id or email
    if (fieldName === 'email_id' || fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        input.classList.add('invalid-value');
        const errorMessage = document.createElement('p');
        errorMessage.classList.add('text-danger');
        errorMessage.textContent = 'Please enter a valid email address';
        input.after(errorMessage);
        
        // Update icon to warning
        const iconSpan = input.closest('.input-block')?.querySelector('.icon-send');
        if (iconSpan) {
          iconSpan.classList.remove('icon-send');
          iconSpan.classList.add('icon-warning');
          iconSpan.querySelector('i').classList.remove('fa-paper-plane', 'send-button');
          iconSpan.querySelector('i').classList.add('fa-exclamation-triangle');
        }
        
        input.closest('.input-block')?.classList.add('invalid');
        input.closest('.input-block')?.querySelector('.option-buttons-icon')?.classList.remove('option-buttons');
        return false;
      }
    }
    
    // Valid input
    input.closest('.input-block')?.classList.remove('invalid');
    input.closest('.input-block')?.querySelector('.option-buttons-icon')?.classList.add('option-buttons');
    
    // Reset icon if it was changed
    const iconSpan = input.closest('.input-block')?.querySelector('.icon-warning');
    if (iconSpan) {
      iconSpan.classList.remove('icon-warning');
      iconSpan.classList.add('icon-send');
      iconSpan.querySelector('i').classList.remove('fa-exclamation-triangle');
      iconSpan.querySelector('i').classList.add('fa-paper-plane', 'send-button');
    }
    
    return true;
  }
  
  /**
   * Save user response and get next question
   * @param {String} questionId - ID of the current question
   * @param {String|Array} responseValue - User's response value
   * @param {String} responseType - Type of response (option, text, checkbox, skip)
   * @param {Object} question - The question object
   * @param {String} fieldName - Field name for custom inputs
   */
  async saveResponse(questionId, responseValue, responseType, question, fieldName = '') {
    try {
      // Prepare response data
      const responseData = {
        questionId,
        responseValue,
        responseType,
        fieldName
      };
      
      // Send the response to the server via session manager
      const result = await this.sessionManager.saveResponse(responseData);
      
      // Store the response locally
      this.userResponses.push({
        ...responseData,
        timestamp: Date.now()
      });
      
      // Display the user's response in the chat
      this.messageRenderer.renderUserResponse(questionId, responseValue, responseType, question);
      
      // Move to the next question
      if (result.nextQuestionIndex !== undefined) {
        this.currentQuestionIndex = result.nextQuestionIndex;
      } else {
        this.currentQuestionIndex++;
      }
      
      // Load the next question with a small delay
      setTimeout(() => {
        this.loadCurrentQuestion();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving response:', error);
      
      if (this.notificationManager) {
        this.notificationManager.showError('Failed to save your response. Please try again.');
      } else {
        alert('Failed to save your response. Please try again.');
      }
      
      // Re-enable the button to allow retry
      const button = document.querySelector(`[questionid="${questionId}"]`);
      if (button) button.disabled = false;
    }
  }
  
  /**
   * Check if the last message is visible
   * Updates UI indicators accordingly
   */
  checkVisibility() {
    const lastMessage = this.chatContainer.querySelector('.test:last-child');
    if (!lastMessage) return;
    
    const rect = lastMessage.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Check if the last message is fully visible
    const isFullyVisible = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= windowHeight &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
    
    // Show/hide scroll indicator based on visibility
    const existingIndicator = document.querySelector('.arrow-downs');
    
    if (!isFullyVisible) {
      if (!existingIndicator) {
        const arrowDown = document.createElement('div');
        arrowDown.classList.add('arrow-downs');
        arrowDown.innerHTML = '<i class="fa fa-chevron-down"></i>';
        this.chatContainer.appendChild(arrowDown);
      }
    } else if (existingIndicator) {
      existingIndicator.remove();
    }
  }
  
  /**
   * Scroll to make latest content visible
   */
  scrollToVisible() {
    if (this.initialLoad) {
      window.scrollTo({
        top: 150,
        behavior: 'smooth'
      });
      this.initialLoad = false;
    } else {
      const lastMessage = this.chatContainer.querySelector('.test:last-child');
      if (lastMessage) {
        const rect = lastMessage.getBoundingClientRect();
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const scrollTop = window.pageYOffset + rect.top - headerHeight;
        
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  }
  
  /**
   * Scroll to the bottom of the chat
   */
  scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }
}

export default ChatController;