The backend API for [Scribbly](https://github.com/nuvairea/scribbly), a quick, clean note-taking app.

**Live API:** [scribbly-server.onrender.com](https://scribbly-server.onrender.com)

Node.js, Express and TypeScript (ES modules), with Google sign-in, session-based authentication and MongoDB for storage.

## Features

- Google sign-in only. The client sends a Google ID token, the server verifies it and starts a session. No passwords are stored
- Session-based authentication using `express-session`, backed by MongoDB via `connect-mongo` so sessions survive server restarts
- Rolling 30-day sessions, refreshed on activity rather than expiring on a fixed date
- Rate limiting on the sign-in endpoint
- Full note CRUD, scoped per user, with soft-delete support
- Account deletion that removes the user and all of their notes

## Tech stack

- Node.js, Express 5 and TypeScript
- MongoDB with Mongoose
- `express-session` and `connect-mongo` for persistent sessions
- `google-auth-library` for verifying Google ID tokens
- `express-rate-limit` for auth rate limiting
- `cors` for cross-origin requests from the client

## Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/auth/google` | No | Sign in with a Google ID token (`{ credential }`). Creates the account on first sign-in |
| POST | `/logout` | Yes | Destroy the current session |
| GET | `/me` | Yes | Get the current user (`userId`, `email`, `firstName`, `picture`) |
| GET | `/notes` | Yes | Get all notes for the current user |
| POST | `/notes` | Yes | Create a note |
| PUT | `/notes/:id` | Yes | Update a note |
| PATCH | `/notes/:id` | Yes | Update a note's deleted state |
| DELETE | `/notes/:id` | Yes | Permanently delete a soft-deleted note |
| DELETE | `/me` | Yes | Permanently delete the current user's account and all their notes |

## Getting started

```bash
git clone https://github.com/nuvairea/scribbly-server.git
cd scribbly-server
npm install
```

Create a `.env` file in the project root:

```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_oauth_client_id
SESSION_SECRET=some_long_random_string
NODE_ENV=development
PORT=3000
```

Then run it:

```bash
npm run dev      # watch mode
npm run build && npm start   # production
```

The API starts on the port set above (`3000` by default).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | Connection string for your MongoDB database |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID from Google Cloud Console. The server only accepts tokens issued for this ID |
| `SESSION_SECRET` | Recommended | Secret used to sign the session cookie. Falls back to a dev default if unset, don't rely on that in production |
| `NODE_ENV` | Yes in production | Set to `production` to enable secure, cross-site cookies |
| `PORT` | No | Defaults to `3000` |

## CORS

The allowed origins are set directly in `src/index.ts`. If you're running the client locally on a different port, add it to the `origin` array there.

## Client

The frontend that talks to this API lives at [nuvairea/scribbly](https://github.com/nuvairea/scribbly).