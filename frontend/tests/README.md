# E2E Test Suite

Comprehensive end-to-end tests for Eventlane using Playwright.

## Test Structure

- **tests/fixtures/** - Test fixtures (auth, data)
- **tests/helpers/** - Helper utilities (data factory)
- **tests/specs/** - Test specifications organized by feature

## Test Coverage

### 01-auth.spec.ts (5 tests)

- Unauthenticated user access to public routes
- Admin route protection
- Admin access validation
- User access denial to admin routes
- Sign-in button visibility

### 02-user-events.spec.ts (8 tests)

- Event list display
- Event search/filtering
- Event detail navigation
- Event detail information display
- RSVP functionality
- Real-time attendee count
- Series event grouping
- Upcoming events filtering

### 03-admin-events.spec.ts (12 tests)

- Series list display
- Create new series
- View series detail
- Create event in series
- Edit event capacity
- Edit event date/time
- Delete event
- Delete series
- Update recurrence rule
- Capacity validation
- Date validation

### 04-admin-attendees.spec.ts (6 tests)

- View attendee list
- Add attendee manually
- Remove attendee
- Update attendee count
- Capacity enforcement
- Export attendee list

### 05-realtime.spec.ts (8 tests)

- Real-time capacity updates
- Real-time attendee count updates
- Real-time event deletion
- Real-time event creation
- Real-time date updates
- Admin view real-time updates
- Multi-view synchronization
- Rapid update handling

### 06-series.spec.ts (8 tests)

- Series information display
- Update series metadata
- Event grouping by date
- Recurrence pattern display
- Event generation from recurrence
- Property inheritance
- Property override
- Event count display

### 07-edge-cases.spec.ts (9 tests)

- Non-existent event handling
- Non-existent series handling
- WebSocket reconnection
- Double RSVP prevention
- Capacity overflow
- Timezone validation
- Empty state display
- XSS prevention
- Network error handling

**Total: 56 tests**

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/specs/01-auth.spec.ts

# Run in headed mode
npx playwright test --headed

# Run with UI
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

## Prerequisites

1. Backend server running on expected port
2. Frontend development server running on http://localhost:4200
3. Firebase authentication configured
4. MongoDB with test data

## Test Data

Tests use `@faker-js/faker` for generating realistic test data:

- Event series with recurrence patterns
- Individual events
- Attendee information

## Authentication

Tests use custom fixtures for authentication:

- `authenticatedUser` - Regular user with Firebase token
- `adminUser` - Admin user with elevated permissions

## Notes

- Tests require backend API to be running
- Some tests use multiple browser contexts to test real-time updates
- WebSocket connections are tested for real-time synchronization
- All tests clean up after themselves
