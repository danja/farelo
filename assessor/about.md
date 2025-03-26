# About Assessor

fs tree:
```sh
assessment-chat-app/
├── server/
│   ├── api/
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
│   │   └── animate.min.css      # Animation library (third-party)
│   ├── js/
│   │   ├── core/
│   │   │   ├── sessionManager.js # Session management
│   │   │   ├── api.js            # API client
│   │   │   └── eventBus.js       # Event communication
│   │   ├── ui/
│   │   │   ├── chat.js           # Chat UI controller
│   │   │   ├── messageRenderer.js # Message rendering
│   │   │   └── notifications.js   # Alert components
│   │   └── app.js                # Main client entry point
│   ├── img/
│   │   ├── avatar.png            # Chat avatar image
│   │   ├── logo.png              # App logo
│   │   └── title.png             # Title image
│   └── index.html                # Main HTML page
├── package.json                  # Project dependencies
└── README.md                     # Project documentation
```