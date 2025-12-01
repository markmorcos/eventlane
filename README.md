# RSVP + Waiting List System

A real-time event RSVP and waiting list management system built with Spring Boot, MongoDB, Angular, and Firebase Authentication.

## Tech Stack

### Backend

- **Kotlin + Spring Boot** - REST API and WebSocket server
- **MongoDB with Spring Data MongoDB** - Document storage
- **Optimistic Locking** - Concurrency control with `@Version` on Event documents
- **Spring WebSocket + STOMP** - Real-time updates
- **Firebase Admin SDK** - Token verification

### Frontend

- **Angular** - Single-page application
- **Firebase JS SDK** - Passwordless email authentication
- **SockJS + STOMP** - WebSocket client for live updates

## Features

- **User Features:**

  - Passwordless authentication via Firebase email links
  - RSVP to events
  - Automatic confirmed/waitlist assignment based on capacity
  - Real-time status updates via WebSockets
  - Cancel RSVPs with automatic promotion from waitlist

- **Admin Features (per event):**

  - Create events with custom capacity
  - Manage event capacity (promotes/demotes as needed)
  - Remove attendees manually
  - Manage admin email list
  - Delete events
  - View full attendee lists and waitlist

- **System Features:**
  - Optimistic locking with automatic retry for concurrent requests
  - Stable waitlist positions
  - Real-time updates pushed to all connected clients
  - No explicit queues or Redis needed

## Project Structure

```
rsvp/
├── backend/                 # Spring Boot application
│   ├── src/main/kotlin/com/rsvp/
│   │   ├── config/         # Security, WebSocket, Firebase config
│   │   ├── auth/           # Firebase authentication filter
│   │   ├── domain/         # Business logic services
│   │   ├── persistence/    # MongoDB documents and repositories
│   │   ├── web/            # REST controllers and DTOs
│   │   └── websocket/      # WebSocket publisher
│   └── build.gradle.kts
└── frontend/               # Angular application
    ├── src/app/
    │   ├── components/     # UI components
    │   ├── services/       # Auth, API, WebSocket services
    │   ├── models/         # TypeScript interfaces
    │   └── interceptors/   # HTTP interceptor for auth
    └── package.json
```

## Setup Instructions

### Prerequisites

- Java 17 or higher
- Node.js 18+ and npm
- MongoDB 4.4+
- Firebase project with Authentication enabled

### Backend Setup

1. **Configure MongoDB:**

   ```bash
   # Start MongoDB locally or use MongoDB Atlas
   mongod --dbpath /path/to/data
   ```

2. **Configure Firebase:**

   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication → Sign-in method → Email link (passwordless)
   - Download service account credentials JSON
   - Set environment variables:
     ```bash
     export FIREBASE_PROJECT_ID=your-project-id
     export FIREBASE_CREDENTIALS_PATH=/path/to/service-account.json
     export MONGODB_URI=mongodb://localhost:27017/rsvp
     ```

3. **Build and run:**

   ```bash
   cd backend
   ./gradlew bootRun
   ```

   The API will be available at `http://localhost:8080`

### Frontend Setup

1. **Configure Firebase:**
   Update `frontend/src/environments/environment.ts` with your Firebase config:

   ```typescript
   firebase: {
     apiKey: 'your-api-key',
     authDomain: 'your-project.firebaseapp.com',
     projectId: 'your-project-id',
     storageBucket: 'your-project.appspot.com',
     messagingSenderId: 'your-sender-id',
     appId: 'your-app-id'
   }
   ```

2. **Install dependencies and run:**

   ```bash
   cd frontend
   npm install
   npm start
   ```

   The app will be available at `http://localhost:4200`

## API Endpoints

### Public Endpoints

- `GET /api/events` - List all events
- `GET /api/events/{slug}` - Get event details
- `GET /api/events/{slug}/attendees` - Get attendees (admin only)

### Authenticated Endpoints

- `POST /api/events/{slug}/rsvp` - RSVP to an event
- `POST /api/events/{slug}/cancel` - Cancel RSVP

### Admin Endpoints

- `POST /api/events` - Create new event
- `PATCH /api/events/{slug}/capacity` - Update capacity
- `GET /api/events/{slug}/admins` - List admins
- `POST /api/events/{slug}/admins` - Add admin
- `DELETE /api/events/{slug}/admins` - Remove admin
- `DELETE /api/events/{slug}/attendees/{id}` - Remove attendee
- `DELETE /api/events/{slug}` - Delete event

## WebSocket Topics

- `/topic/events/{eventId}/summary` - Event summary updates
- `/topic/events/{eventId}/attendees` - Attendee list updates

## Concurrency Model

The system uses MongoDB's optimistic locking with the `@Version` field on Event documents:

1. Load event by slug
2. Modify in memory
3. Save with version check
4. On conflict, retry up to 5 times with exponential backoff

This ensures:

- No duplicate RSVPs
- Consistent waitlist positions
- Proper promotion/demotion logic
- No need for Redis or external queues

## Development Notes

- Backend runs on port 8080
- Frontend dev server runs on port 4200
- CORS is configured for localhost development
- WebSocket fallback to SockJS for compatibility
- All timestamps use ISO 8601 format
- Emails are stored lowercased for case-insensitive matching

## License

MIT
