# Scribbly Server

The backend API for [Scribbly](https://github.com/nuvairea/scribbly), a quick, clean note-taking app.

**Live API:** [scribbly-server.onrender.com](https://scribbly-server.onrender.com)

Node.js and Express, with session-based authentication and MongoDB for storage.

## Features

- Email and password signup and login, with server-side password length and email format validation
- Session-based authentication using `express-session`, backed by MongoDB via `connect-mongo` so sessions survive server restarts
- Rolling 30-day sessions, refreshed on activity rather than expiring on a fixed date
- Password hashing with bcrypt
- Rate limiting on login and signup to slow down brute-force attempts
- Full note CRUD, scoped per user, with soft-delete support

## Tech stack

- Node.js and Express
- MongoDB with Mongoose
- `express-session` and `connect-mongo` for persistent sessions
- `bcrypt` for password hashing
- `express-rate-limit` for auth rate limiting
- `cors` for cross-origin requests from the client

## Endpoints

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/signup` | No | Create an account |
| POST | `/login` | No | Log in |
| POST | `/logout` | Yes | Destroy the current session |
| GET | `/me` | Yes | Get the current user's info |
| GET | `/notes` | Yes | Get all notes for the current user |
| POST | `/notes` | Yes | Create a note |
| PUT | `/notes/:id` | Yes | Update a note |
| PATCH | `/notes/:id` | Yes | Update a note's deleted state |

## Getting started

```bash
git clone https://github.com/nuvairea/scribbly-server.git
cd scribbly-server
npm install
```

Create a `.env` file in the project root:

```
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=some_long_random_string
NODE_ENV=development
PORT=3000
```

Then run it:

```bash
node index.js
```

The API starts on the port set above (`3000` by default).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | Connection string for your MongoDB database |
| `SESSION_SECRET` | Recommended | Secret used to sign the session cookie. Falls back to a dev default if unset, don't rely on that in production |
| `NODE_ENV` | Yes in production | Set to `production` to enable secure, cross-site cookies |
| `PORT` | No | Defaults to `3000` |

## CORS

The allowed origins are set directly in `index.js`. If you're running the client locally on a different port, add it to the `origin` array there.

## Client

The frontend that talks to this API lives at [nuvairea/scribbly](https://github.com/nuvairea/scribbly).
