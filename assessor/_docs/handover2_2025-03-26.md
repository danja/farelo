# Assessment Chat Application - Technical Handover

## Project Overview

The Assessment Chat Application implements an interactive questionnaire system using a chat-like interface. The system guides users through a series of questions with conditional branching logic based on previous answers. A primary requirement was robust session management to handle timeouts gracefully while preserving user progress.

## Original Requirements

1. Implement chat interface similar to the provided reference implementation
2. Create a clean separation between frontend and backend components
3. Use vanilla JavaScript for the client side
4. Build a Node.js Express server for the backend
5. Implement robust session management with timeout handling
6. Develop a modular code structure with proper separation of concerns
7. Support various question types (buttons, checkboxes, text inputs)
8. Enable conditional question flow based on previous answers

## System Architecture

The application follows a client-server architecture with RESTful API communication:

```
assessment-chat-app/
├── server/                      # Backend Node.js Express application
│   ├── api/                     # API endpoint handlers
│   │   ├── sessions.js          # Session API endpoints
│   │   └── responses.js         # Response API endpoints
│   ├── models/
│   │   └── session.js           # Session model
│   ├── services/
│   │   └── sessionService.js    # Session business logic
│   ├── utils/
│   │   └── logger.js            # Logging utility
│   ├── app.js                   # Main Express server
│   └── server.js                # Server entry point
├── public/
│   ├── css/
│   │   ├── styles.css           # Main styles
│   │   ├── session.css          # Session-specific styles
│   │   └── animate.min.css      # Animation library
│   ├── js/
│   │   ├── core/
│   │   │   ├── sessionManager.js # Session management
│   │   │   ├── api.js           # API client
│   │   │   └── eventBus.js      # Event communication
│   │   ├── ui/
│   │   │   ├── chat.js          # Chat UI controller
│   │   │   ├── messageRenderer.js # Message rendering
│   │   │   └── notifications.js # Alert components
│   │   └── app.js              # Main client entry point
│   ├── img/
│   │   ├── avatar.png          # Chat avatar image
│   │   ├── logo.png            # App logo
│   │   └── title.png           # Title image
│   └── index.html              # Main HTML page
└── package.json                # Project dependencies
```

## Key Components

### Frontend Components

#### Session Manager (`sessionManager.js`)

Handles all session-related functionality including:
- Session creation, recovery, and persistence
- Timeout detection with configurable warning period
- Local storage integration for session persistence
- Session ping mechanism for keeping sessions alive

```javascript
const sessionManager = new SessionManager({
    baseUrl: 'http://localhost:3000',
    timeoutMinutes: 30,
    timeoutWarningMinutes: 1
});

// Initialize session
const session = await sessionManager.initialize();

// Save response
const result = await sessionManager.saveResponse({
    questionId: 'q1',
    responseValue: 'optionA',
    responseType: 'button'
});
```

#### Event Bus (`eventBus.js`)

Implements a pub/sub pattern for decoupled component communication:

```javascript
const eventBus = new EventBus();

// Register event handler
eventBus.on('session:timeout', (data) => {
    console.log(`Session ${data.sessionId} timed out`);
});

// Emit event
eventBus.emit('session:warning', { 
    timeRemaining: 60,
    sessionId: 'abc123' 
});
```

#### API Client (`api.js`)

Centralizes all server communication:

```javascript
const api = new ApiClient('http://localhost:3000');

// Create session
const sessionData = await api.createSession();

// Save response
const result = await api.saveResponse({
    sessionId: 'abc123',
    questionId: 'q1',
    responseValue: 'optionA',
    responseType: 'button'
});
```

#### Chat Controller (`chat.js`)

Manages chat interface and user interactions:

```javascript
const chatController = new ChatController({
    sessionManager,
    eventBus,
    chatContainer: document.getElementById('chat-section')
});

// Load current question
chatController.loadCurrentQuestion();

// Handle response
chatController.handleOptionSelection(buttonElement);
```

#### Message Renderer (`messageRenderer.js`)

Responsible for DOM creation and manipulation:

```javascript
const renderer = new MessageRenderer({
    container: document.getElementById('chat-section')
});

// Display question
renderer.renderQuestion(question);

// Display options
renderer.renderOptions(question);

// Display user response
renderer.renderUserResponse(questionId, responseValue, responseType, question);
```

#### Notification Manager (`notifications.js`)

Manages UI notifications and alerts:

```javascript
const notificationManager = new NotificationManager();

// Show timeout warning
notificationManager.showSessionWarning(60);

// Show connection status
notificationManager.updateConnectionStatus('connected', 'Connected');

// Show session expired overlay
notificationManager.showSessionExpired();
```

### Backend Components

#### Session Model (`session.js`)

Defines session data structure and methods:

```javascript
class Session {
    constructor(data = {}) {
        this.id = data.id || uuidv4();
        this.startTime = data.startTime || Date.now();
        this.lastActivity = data.lastActivity || Date.now();
        this.responses = data.responses || [];
        this.currentQuestionIndex = data.currentQuestionIndex || 0;
        this.completedAt = data.completedAt || null;
        this.metadata = {
            ipAddress: data.ipAddress || null,
            userAgent: data.userAgent || null
        };
    }
    
    // Check if session is expired
    isExpired(maxIdleTime = 30 * 60 * 1000) {
        const idleTime = Date.now() - this.lastActivity;
        return idleTime > maxIdleTime || this.completedAt !== null;
    }
}
```

#### Session Service (`sessionService.js`)

Implements session business logic including question branching:

```javascript
// Create new session
function createSession(metadata = {}) {
    const session = new Session(metadata);
    sessions.set(session.id, session);
    return session;
}

// Save response and determine next question
function saveResponse(sessionId, responseData) {
    const session = getSession(sessionId);
    if (!session) {
        throw new Error('Session not found');
    }
    
    // Save the response
    session.addResponse(responseData);
    
    // Determine next question based on branching logic
    let nextQuestionIndex = session.currentQuestionIndex + 1;
    
    // Example branching logic
    if (responseData.questionId === '2') {
        if (responseData.responseValue === '2a' || responseData.responseValue === '2b') {
            nextQuestionIndex = questionBank.findIndex(q => q.id === '3a');
        } else {
            nextQuestionIndex = questionBank.findIndex(q => q.id === '3b');
        }
    }
    
    session.setQuestionIndex(nextQuestionIndex);
    return { nextQuestionIndex, success: true };
}
```

#### API Routes (`sessions.js`, `responses.js`)

Define RESTful API endpoints:

```javascript
// Create a new session
router.post('/create', (req, res) => {
    try {
        const metadata = {
            ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
        };
        
        const session = sessionService.createSession(metadata);
        
        res.json({
            sessionId: session.id,
            questions: sessionService.getQuestions()
        });
    } catch (error) {
        logger.error(`Error creating session: ${error.message}`);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Save a response
router.post('/save', (req, res) => {
    try {
        const { sessionId, questionId, responseValue, responseType } = req.body;
        
        const result = sessionService.saveResponse(sessionId, {
            questionId, responseValue, responseType
        });
        
        res.json(result);
    } catch (error) {
        logger.error(`Error saving response: ${error.message}`);
        res.status(500).json({ error: 'Failed to save response' });
    }
});
```

## Session Management Implementation

Session management was a critical requirement, implemented with these features:

1. **Client-side Session Management:**
   - Active monitoring of user interactions to detect inactivity
   - Timer-based warning notifications before timeout
   - Local storage persistence for session recovery
   - Automatic reconnection attempts when connection is lost

2. **Server-side Session Management:**
   - In-memory session storage with unique identifiers
   - Activity timestamp tracking for timeout detection
   - Periodic cleanup of expired sessions
   - Session state retrieval for recovery operations

3. **Session Recovery Flow:**
   - On page load, attempt to restore session from local storage
   - Validate session ID with server to ensure it's still valid
   - Rebuild UI state based on previous responses
   - Continue from last active question if session is valid

4. **Session Timeout Handling:**
   - Warning notification displayed before timeout
   - Visual countdown of remaining time
   - Option to extend session with single click
   - Clear session expired message with restart option

## Data Flow

1. **Session Initialization:**
   ```
   Client                              Server
     |                                   |
     |------ Create Session Request ---->|
     |                                   |
     |<----- Session ID + Questions -----|
     |                                   |
     |-- Initialize UI with Question 1 --|
     |                                   |
   ```

2. **User Response Processing:**
   ```
   Client                              Server
     |                                   |
     |------- Save Response Request ---->|
     |                                   |
     |<--- Next Question Index Result ---|
     |                                   |
     |-- Display Next Question to User --|
     |                                   |
   ```

3. **Session Maintenance:**
   ```
   Client                              Server
     |                                   |
     |---------- Ping Session ---------->|
     |                                   |
     |<---- Session Status Response -----|
     |                                   |
     |-- Reset Timeout Timers ---------->|
     |                                   |
   ```

4. **Session Recovery:**
   ```
   Client                              Server
     |                                   |
     |------ Get Session State Request ->|
     |                                   |
     |<- Full Session State + Questions -|
     |                                   |
     |-- Rebuild UI from Saved State ----|
     |                                   |
   ```

## Configuration and Customization

### Question Structure

Questions are defined in `sessionService.js` with this structure:

```javascript
{
    id: '3a',                             // Unique identifier
    text: 'Do you exercise regularly?',   // Question text
    options: [                            // Answer options
        { id: '3a1', text: 'Yes, frequently' },
        { id: '3a2', text: 'Sometimes' },
        { id: '3a3', text: 'Rarely' }
    ],
    optionType: 'button',                // Question type (button/checkbox/text)
    tagClass: 'exercise-section'         // CSS class for styling
}
```

For text input questions:

```javascript
{
    id: '4',
    text: 'Would you like to tell us more about your health goals?',
    isCustomInput: true,                  // Text input indicator
    inputType: 'textarea',                // Input type (text/textarea)
    fieldName: 'health_goals',            // Field name for data storage
    placeholder: 'Share your health goals here...',
    buttonText: 'Submit',
    tagClass: 'health-goals-section'
}
```

### Branching Logic

Branching logic is defined in the `saveResponse` function:

```javascript
// Example branching logic
if (responseData.questionId === '2') {
    // Health rating question
    if (responseData.responseValue === '2a' || responseData.responseValue === '2b') {
        // Excellent or Good health -> go to exercise question
        nextQuestionIndex = questionBank.findIndex(q => q.id === '3a');
    } else {
        // Fair or Poor health -> go to health concerns question
        nextQuestionIndex = questionBank.findIndex(q => q.id === '3b');
    }
}
```

### Timeout Configuration

Session timeout parameters can be configured in `app.js`:

```javascript
const sessionManager = new SessionManager({
    baseUrl,
    timeoutMinutes: 30,          // Total session timeout (minutes)
    timeoutWarningMinutes: 1,    // Show warning this many minutes before timeout
    autoReconnect: true          // Attempt automatic reconnection
});
```

## Setup and Deployment

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Access the application at http://localhost:3000

### Production Deployment

1. Set environment variables:
   ```
   PORT=80
   NODE_ENV=production
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## Potential Enhancements

1. **Database Integration**
   - Replace in-memory session storage with database persistence
   - Implement user authentication for saved assessments
   - Add reporting and analytics capabilities

2. **Advanced Question Types**
   - Support for file uploads
   - Multi-select dropdowns
   - Rating scales and sliders

3. **Performance Optimization**
   - Implement question batching for reduced API calls
   - Add client-side caching for question data
   - Optimize rendering for large assessments

## Troubleshooting

### Common Issues

1. **Session Expiration Issues**
   - Check browser console for JavaScript errors
   - Verify session timeout settings in configuration
   - Inspect network requests to confirm ping functionality

2. **Question Flow Problems**
   - Debug branching logic in `saveResponse` function
   - Verify question IDs match the references in branching conditions
   - Check console logs for any errors during response processing

3. **UI Rendering Issues**
   - Inspect browser console for rendering errors
   - Check for CSS conflicts affecting the chat interface
   - Verify DOM element IDs match those referenced in JavaScript

## Monitoring and Maintenance

The system includes these monitoring capabilities:

1. **Server-side Logging**
   - Winston logger captures all API activity
   - Session creation, response processing, and expiration events
   - Error tracking with stack traces

2. **Client-side Tracking**
   - Connection status indicator shows server connectivity
   - Console logging for session lifecycle events
   - Visual indicators for session health