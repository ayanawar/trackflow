# Feature Specification: Google OAuth Sign-In & Registration

**Feature Branch**: `004-google-oauth-signin`  
**Created**: 2026-05-13  
**Status**: Draft  
**Input**: User description: "Implement a Google Sign-In / Register feature in the current application."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New User Registers via Google (Priority: P1)

A new user who does not have a TrackFlow account visits the registration page and clicks "Continue with Google." After granting consent in the Google popup, a new TrackFlow account is automatically created using their Google profile information, and they are logged in immediately without needing to fill in any form fields.

**Why this priority**: This is the core value of the feature — frictionless account creation via Google removes the email/password form barrier entirely. It is the primary reason users adopt social login.

**Independent Test**: Navigate to `/auth/register`. Click "Continue with Google." Complete Google consent flow. Verify a new user account is created and the user is redirected to the application dashboard, authenticated.

**Acceptance Scenarios**:

1. **Given** a visitor with no existing TrackFlow account, **When** they click "Continue with Google" on the registration page and complete Google consent, **Then** a new account is created using their Google name, email, and profile picture, and they are signed in.
2. **Given** a new Google user completing registration, **When** the flow succeeds, **Then** they are redirected to the main application (same destination as email/password registration).
3. **Given** a visitor who denies Google consent or closes the popup, **When** the flow is cancelled, **Then** they remain on the registration page with a clear, non-alarming message indicating the sign-in was cancelled.
4. **Given** a visitor whose Google account returns an unverified email, **When** they attempt to register via Google, **Then** registration is refused with an appropriate error message explaining the requirement for a verified email.

---

### User Story 2 - Existing Google User Signs In (Priority: P1)

A returning user who previously registered via Google visits the application and clicks "Continue with Google." The system recognises their Google account, verifies their identity, and logs them in — without creating a duplicate account.

**Why this priority**: Equal priority to registration — sign-in is the recurring action. Without this, returning users cannot access their data.

**Independent Test**: Complete User Story 1 first. Sign out. Return to login page, click "Continue with Google," complete consent. Verify the user is signed in to the same account (same ID, same data) without a new account being created.

**Acceptance Scenarios**:

1. **Given** a user who previously registered via Google, **When** they click "Continue with Google" on the login page and complete consent, **Then** they are signed in to their existing account.
2. **Given** a returning Google user signing in, **When** the flow succeeds, **Then** they are redirected to the main application dashboard.
3. **Given** a user who has already signed in via Google, **When** they sign in via Google again, **Then** no duplicate account is created — account count for that email/Google ID remains at one.

---

### User Story 3 - Existing Email/Password User Uses Same Email via Google (Priority: P2)

A user who registered with email and password attempts to sign in using "Continue with Google" using the same email address. The system recognises the email match and either links the Google identity to their existing account or blocks the attempt with a clear message guiding them to use their original sign-in method.

**Why this priority**: This is a duplicate-account prevention scenario. Without handling it, users who forget they registered with email/password create orphan accounts.

**Independent Test**: Register a user with email `user@example.com` via the email/password form. Then attempt "Continue with Google" using a Google account associated with `user@example.com`. Verify no duplicate account is created and the user receives appropriate guidance.

**Acceptance Scenarios**:

1. **Given** a user registered via email/password, **When** they attempt Google sign-in with the same email, **Then** they are informed that the email is already registered via another method and are guided to use email/password login instead.
2. **Given** this conflict scenario, **When** the error is shown, **Then** the system does not create a second account for that email address.

---

### User Story 4 - Google Sign-In on Login Page (Priority: P2)

A user who registered via Google navigates directly to the login page (not the registration page) and clicks "Continue with Google." The login flow works identically to the registration flow for returning users.

**Why this priority**: Users often navigate to the login page regardless of how they originally registered. The Google button must appear on both pages.

**Independent Test**: Navigate to `/auth/login`. Click "Continue with Google." Complete consent for an existing Google-registered account. Verify successful login.

**Acceptance Scenarios**:

1. **Given** a user on the login page, **When** they click "Continue with Google" and complete consent for an already-registered account, **Then** they are signed in normally.
2. **Given** a user on the login page who has never registered, **When** they click "Continue with Google" and complete consent, **Then** a new account is created (same behaviour as registration page).

---

### Edge Cases

- What happens if Google's authentication service is temporarily unavailable? User sees a clear error message; email/password login remains fully functional.
- What happens if the Google token verification fails on the backend? User sees a generic "Sign-in failed, please try again" message; no account is created or compromised.
- What happens on a slow network connection? A loading indicator is shown during the Google popup and backend verification phases.
- What happens if the user's Google profile has no name? Account is created with email as the display name fallback.
- What happens if a user tries to use Google sign-in when already signed in? Redirect to application dashboard immediately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The registration page MUST display a "Continue with Google" button that initiates the Google OAuth consent flow.
- **FR-002**: The login page MUST also display a "Continue with Google" button with identical behavior.
- **FR-003**: The system MUST send the Google-issued identity token to the backend for server-side verification — the frontend MUST NOT be trusted as the source of truth for identity.
- **FR-004**: The backend MUST verify the Google ID token (JWT) by validating its signature against Google's public keys and confirming the token audience matches the configured `GOOGLE_CLIENT_ID`. No Client Secret is required for this verification.
- **FR-005**: If the verified Google identity does not match any existing account (by Google provider ID or email), the system MUST create a new user account storing: Google account ID, email, name, and profile image URL (if provided).
- **FR-006**: If the verified Google identity matches an existing account (by Google provider ID), the system MUST log the user in without creating a new account.
- **FR-007**: If the verified Google email matches an existing email/password account, the system MUST refuse the Google sign-in, display the message "An account with this email already exists. Please sign in with your email and password.", and leave both accounts untouched. Auto-linking is explicitly out of scope.
- **FR-008**: The system MUST NOT store Google access tokens or refresh tokens.
- **FR-009**: The existing email/password registration and login flows MUST continue to function without modification.
- **FR-015**: After the backend successfully verifies a Google ID token and resolves the user account (new or existing), it MUST issue the same session token or cookie it currently issues for email/password login — no separate session mechanism is introduced.
- **FR-010**: The system MUST handle and display user-facing error messages for: cancelled consent, Google verification failure, duplicate email conflict, and network errors.
- **FR-011**: A loading state MUST be shown during the Google OAuth flow and during backend token verification.
- **FR-012**: The "Continue with Google" button MUST be functional on both desktop and mobile browsers.
- **FR-013**: The Google Client ID MUST be stored as an environment variable and MUST NOT be hardcoded in source files committed to version control.
- **FR-014**: The Google Client Secret (if used) MUST be stored as a server-side-only environment variable and MUST NOT be accessible from the frontend.

### Key Entities

- **User** (extended): Existing entity gains two optional fields — `googleId` (unique Google account identifier) and `avatarUrl` (profile image URL). The `password` field remains nullable/optional to support Google-only accounts.
- **AuthProvider**: Logical concept representing how a user's identity was established — either `email` (email/password) or `google` (Google OAuth). Used for duplicate-account detection logic.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete Google registration (from clicking the button to being logged in) in under 30 seconds on a standard internet connection.
- **SC-002**: Zero duplicate accounts are created when the same Google identity or email signs in more than once.
- **SC-003**: 100% of Google identity token verifications occur server-side — no client-side token trust is implemented.
- **SC-004**: Existing email/password login and registration success rates are unchanged after the feature is deployed (zero regressions).
- **SC-005**: All error scenarios (cancelled flow, verification failure, duplicate email) produce a visible, specific, user-readable error message within 3 seconds.
- **SC-006**: The feature passes functional verification on Chrome/Safari mobile at 390px viewport width.

## Clarifications

### Session 2026-05-13

- Q: Which Google OAuth flow should the backend use to verify the user's Google identity? → A: ID token flow — frontend obtains a Google ID token (JWT) and sends it to backend; backend verifies using Google's public keys and the Client ID only. No Client Secret required.
- Q: When a Google sign-in email matches an existing email/password account, should the system block or auto-link? → A: Block and inform — refuse sign-in, show specific error message, no account modification. Auto-linking is out of scope.
- Q: After Google identity is verified on the backend, how should the session be established? → A: Reuse existing session mechanism — backend issues the same JWT/session cookie it already issues for email/password login; no separate session type introduced.

## Assumptions

- The application currently uses a session-based or JWT-based authentication system that issues its own session/token after successful login. Google OAuth supplements this system: after verifying a Google ID token, the backend issues the exact same session token/cookie it issues for email/password login — no new session type is introduced.
- The existing `User` database schema can be extended with nullable `googleId` and `avatarUrl` fields without a destructive migration.
- The Google Client ID (`GOOGLE_CLIENT_ID`) is provided as an environment variable; the value itself is considered public-facing (it appears in browser requests) but must not be hardcoded in source code.
- The Google OAuth flow uses the **ID token approach**: the frontend obtains a Google ID token (a signed JWT) and sends it to the backend. The backend verifies the JWT signature using Google's public keys, validating the audience against `GOOGLE_CLIENT_ID`. No Google Client Secret is required.
- The application is deployed (or will be deployed) over HTTPS in production; Google OAuth requires HTTPS for redirect URIs in production.
- Profile images served from Google's CDN are treated as external URLs stored as strings — no image download or re-hosting is performed.
- The "Continue with Google" button appears on both the login and registration pages, as both flows converge to the same backend endpoint.
- Google's One Tap / automatic sign-in UX is out of scope; only the explicit button-click flow is required.
