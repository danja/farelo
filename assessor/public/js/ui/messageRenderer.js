/**
 * Message renderer for chat UI
 */

class MessageRenderer {
  /**
   * Initialize the message renderer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.chatContainer = options.container || document.getElementById('chat-section');
    this.avatarUrl = options.avatarUrl || 'img/avatar.png';
    // Fix: Split animation classes to avoid spaces in classList.add()
    this.animationClasses = (options.animationClass || 'animate__animated animate__fadeInUp').split(' ');
  }
  
  /**
   * Create a container for a message/question
   * @param {Object} question - Question data
   * @returns {HTMLElement} Message container element
   */
  createMessageContainer(question) {
    console.log('Creating container for question:', question);
    const questionId = question.id;
    
    const container = document.createElement('div');
    container.classList.add('test');
    container.id = `question-container-${questionId}`;
    
    // Fix: Use animationClasses joined with space for innerHTML template
    const animationClassStr = this.animationClasses.join(' ');
    
    container.innerHTML = `
      <div class="msg-gird-container">
        <div class="avatar-grid">
          <figure>
            <img src="${this.avatarUrl}" alt="Avatar">
          </figure>
          <div class="avatar-load-wrap position-relative ${animationClassStr} avatar-loading">
            <div class="avatar-loader dot-pulse"></div>
          </div>
        </div>
        <div class="msg-bubble-container message-container-${questionId}">
        </div>
      </div>
      <div class="msg-gird-container ${animationClassStr} option-div option-div-${questionId}">
        <div class="input-buttons w-100 option-choose-${questionId} mob-option-choose">
          <div class="input-button-holder option-container-${questionId} ${question.tagClass || ''}">
          </div>
        </div>
      </div>
    `;
    
    console.log('Appending container to chat container');
    this.chatContainer.appendChild(container);
    console.log('Container created and appended');
    return container;
  }
  
  /**
   * Render a question message
   * @param {Object} question - Question data
   */
  renderQuestion(question) {
    console.log('Rendering question:', question);
    const questionId = question.id;
    const container = this.createMessageContainer(question);
    const messageContainer = container.querySelector(`.message-container-${questionId}`);
    
    if (!messageContainer) {
      console.error(`Message container for question ${questionId} not found`);
      return container;
    }
    
    // Remove any existing loading indicator
    const loadingIndicator = container.querySelector('.avatar-loading');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    // Create the message bubble
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('msg-bubble-row');
    // Fix: Add animation classes individually
    this.animationClasses.forEach(cls => messageBubble.classList.add(cls));
    
    messageBubble.innerHTML = `
      <div class="msg-bubble-content msg-bubble-content-msg">
        <p style="color: #fff; font-weight: bold;">${question.text}</p>
        ${this.createCustomInputElement(question)}
      </div>
    `;
    
    messageContainer.appendChild(messageBubble);
    
    // Add loading indicator for next content
    const loadingDots = document.createElement('div');
    loadingDots.classList.add('avatar-load-wrap', 'position-relative', 'msg-loading');
    // Fix: Add animation classes individually
    this.animationClasses.forEach(cls => loadingDots.classList.add(cls));
    
    loadingDots.innerHTML = '<div class="dot-pulse"></div>';
    messageContainer.appendChild(loadingDots);
    
    console.log('Question render complete');
    return container;
  }
  
  /**
   * Create custom input element if needed
   * @param {Object} question - The question data
   * @returns {String} HTML string for the custom input element
   */
  createCustomInputElement(question) {
    if (!question.isCustomInput) {
      return '';
    }
    
    const inputType = question.inputType || 'text';
    const placeholder = question.placeholder || 'Type here...';
    const fieldName = question.fieldName || 'input';
    
    // Simple text input
    if (inputType === 'text') {
      return `
        <div class="input-block invalid ${question.tagClass || ''}">
          <input 
            autocomplete="off" 
            type="text" 
            name="${fieldName}" 
            class="${this.animationClass} form-control input-option validateFields ${fieldName}"
            option-type="custom-field" 
            value="" 
            placeholder="${placeholder}" >
          <span class="icon-send">
            <i class="fa fa-paper-plane send-button option-buttons-icon" 
              questionid="${question.id}" 
              optionid="" 
              btn-type="custom-btn"></i>
          </span>
        </div>
      `;
    }
    
    // Text area for longer text
    if (inputType === 'textarea') {
      const buttonText = question.buttonText || 'Send';
      return `
        <div class="input-block invalid text-paragraph ${question.tagClass || ''}">
          <textarea 
            name="${fieldName}" 
            class="${this.animationClass} form-control input-option validateFields ${fieldName}"
            option-type="paragraph" 
            placeholder="${placeholder}" 
            rows="3"></textarea>
          <button 
            class="btn button-send option-buttons-icon mt-3" 
            questionid="${question.id}" 
            optionid="" 
            btn-type="custom-btn">${buttonText}</button>
        </div>
      `;
    }
    
    return '';
  }
  
  /**
   * Render question options (buttons, checkboxes, etc.)
   * @param {Object} question - Question data
   */
  renderOptions(question) {
    console.log('Rendering options for question:', question);
    
    if (!question.options || question.options.length === 0) {
      console.warn('No options available for this question');
      return;
    }
    
    const questionId = question.id;
    const optionContainer = this.chatContainer.querySelector(`.option-container-${questionId}`);
    
    if (!optionContainer) {
      console.error(`Option container for question ${questionId} not found`);
      // Try to debug by listing all containers
      console.log('Available containers:', Array.from(this.chatContainer.querySelectorAll('[class*=option-container]')).map(el => el.className));
      return;
    }
    
    // Remove loading dots
    const loadingDots = this.chatContainer.querySelector('.msg-loading');
    if (loadingDots) {
      loadingDots.remove();
    }
    
    let optionsHtml = '';
    let optionCountClass = '';
    
    // Fix: Create animation class string for templates
    const animationClassStr = this.animationClasses.join(' ');
    
    // Determine the button class based on option count
    if (question.options.length === 1) {
      optionCountClass = 'single-btn';
    } else if (question.options.length === 2) {
      optionCountClass = 'double-btn';
    } else {
      optionCountClass = 'multiple-btns';
    }
    
    // Generate option HTML based on type
    if (question.optionType === 'checkbox') {
      optionsHtml += '<div class="question-area-container">';
      
      question.options.forEach(option => {
        optionsHtml += `
          <div class="check-area-outer">
            <label class="check-area">${option.text}
              <input type="checkbox" value="${option.id}" class="${optionCountClass} check-option" questionid="${questionId}" optionid="${option.id}">
              <span class="checkmark"></span>
            </label>
          </div>
        `;
      });
      
      // Add skip/next button for checkboxes
      const buttonText = question.buttonText || 'Skip';
      optionsHtml += `
        <button class="btn rply-btns ${animationClassStr} option-buttons skip-check-btn" 
          questionid="${questionId}" 
          optionid="" 
          btn-type="skip-check">${buttonText}</button>
        </div>
      `;
    } else {
      // Standard button options
      question.options.forEach(option => {
        let buttonAttributes = '';
        
        // Add URL attributes for external links
        if (option.url) {
          buttonAttributes = `onclick="window.open('${option.url}', '_blank')"`;
        }
        
        // Fix alignment of option buttons
        optionsHtml += `
          <button class="btn rply-btns ${animationClassStr} option-buttons ${optionCountClass}" 
            questionid="${questionId}" 
            optionid="${option.id}" 
            ${buttonAttributes}
            style="background-color: #4682B4; margin: 5px 0; display: inline-block; min-width: 120px; text-align: center;">
            ${option.text}
          </button>
        `;
      });
    }
    
    console.log('Setting option HTML:', optionsHtml);
    optionContainer.innerHTML = optionsHtml;
    console.log('Options render complete');
  }
  
  /**
   * Render user response message
   * @param {String} questionId - ID of the answered question
   * @param {String|Array} responseValue - User's response value
   * @param {String} responseType - Type of response
   * @param {Object} question - Original question data
   */
  renderUserResponse(questionId, responseValue, responseType, question) {
    let displayText = '';
    
    // Format the response text based on response type
    if (responseType === 'option') {
      if (question && question.options) {
        const option = question.options.find(o => o.id === responseValue);
        displayText = option ? option.text : responseValue;
      } else {
        displayText = responseValue;
      }
    } else if (responseType === 'checkbox') {
      // For checkboxes, we might have multiple selected options
      if (question && question.options) {
        const optionIds = responseValue.split(',');
        const selectedOptions = question.options.filter(o => optionIds.includes(o.id));
        displayText = selectedOptions.map(o => o.text).join(', ');
      } else {
        displayText = responseValue;
      }
    } else if (responseType === 'skip') {
      // Skip button was clicked, show the button text
      displayText = question ? (question.buttonText || 'Skip') : 'Skip';
    } else {
      // Text input or other type of response
      displayText = responseValue;
    }
    
    // Create the user response bubble
    const responseContainer = document.createElement('div');
    responseContainer.classList.add('msg-gird-container', 'msg-gird-container-rply');
    responseContainer.innerHTML = `
      <div class="msg-bubble-container">
        <div class="msg-bubble-row ${this.animationClass}">
          <div class="msg-bubble-content">
            <p class="user-answer answer-${questionId}" questionid="${questionId}" optionid="${responseValue}">${displayText}</p>
          </div>
        </div>
      </div>
    `;
    
    this.chatContainer.appendChild(responseContainer);
    
    // Remove option buttons after selection
    const optionDiv = this.chatContainer.querySelector(`.option-div-${questionId}`);
    if (optionDiv) {
      optionDiv.remove();
    }
    
    return responseContainer;
  }
  
  /**
   * Remove loading indicators
   */
  removeLoadingIndicators() {
    const loadingIndicators = this.chatContainer.querySelectorAll('.avatar-loading, .msg-loading');
    loadingIndicators.forEach(indicator => indicator.remove());
  }
  
  /**
   * Clear the chat container
   */
  clearChat() {
    this.chatContainer.innerHTML = '';
  }
}

export default MessageRenderer;