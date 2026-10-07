<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

The backend API for [Scribbly](https://github.com/nuvairea/scribbly)

**Live API:** [scribbly-server.onrender.com](https://scribbly-server.onrender.com)

- Google OAuth sign-in only. The client sends a Google ID token, the server verifies it and starts a session. No passwords are stored
- Session-based authentication using `express-session`, backed by MongoDB via `connect-mongo` so sessions survive server restarts
- Rolling 30-day sessions, refreshed on activity rather than expiring on a fixed date
- Rate limiting on the sign-in endpoint
- Full note CRUD, scoped per user, with soft-delete support
- Account deletion that removes the user and all of their notes

## Stack

- Node.js, Express and TypeScript
- MongoDB with Mongoose
- `express-session` and `connect-mongo` for persistent sessions
- `google-auth-library` for verifying Google ID tokens
- `express-rate-limit` for auth rate limiting
- `cors` for cross-origin requests from the client

## Endpoints

| Method | Route          | Auth required | Description                                                                        |
| ------ | -------------- | ------------- | ---------------------------------------------------------------------------------- |
| POST   | `/auth/google` | No            | Sign in with a Google auth code (`{ code }`). Creates the account on first sign-in |
| POST   | `/logout`      | Yes           | Destroy the current session                                                        |
| GET    | `/me`          | Yes           | Get the current user (`userId`, `email`, `firstName`, `picture`)                   |
| GET    | `/notes`       | Yes           | Get all notes for the current user                                                 |
| POST   | `/notes`       | Yes           | Create a note                                                                      |
| PUT    | `/notes/:id`   | Yes           | Update a note                                                                      |
| PATCH  | `/notes/:id`   | Yes           | Update a note's deleted state                                                      |
| DELETE | `/notes/:id`   | Yes           | Permanently delete a soft-deleted note                                             |
| DELETE | `/me`          | Yes           | Permanently delete the current user's account and all their notes                  |

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
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
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

| Variable               | Required          | Description                                                                                                    |
| ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`          | Yes               | Connection string for your MongoDB database                                                                    |
| `GOOGLE_CLIENT_SECRET` | Yes               | Client secret for the same OAuth client. Server only, never put it in the frontend                             |
| `GOOGLE_CLIENT_ID`     | Yes               | OAuth client ID from Google Cloud Console. The server only accepts tokens issued for this ID                   |
| `SESSION_SECRET`       | Recommended       | Secret used to sign the session cookie. Falls back to a dev default if unset, don't rely on that in production |
| `NODE_ENV`             | Yes in production | Set to `production` to enable secure, cross-site cookies                                                       |
| `PORT`                 | No                | Defaults to `3000`                                                                                             |

## CORS

The allowed origins are set directly in `src/index.ts`. If you're running the client locally on a different port, add it to the `origin` array there.

## Client

The frontend that talks to this API lives at [nuvairea/scribbly](https://github.com/nuvairea/scribbly).
