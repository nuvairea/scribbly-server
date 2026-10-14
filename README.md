<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

The backend API for [Scribbly](https://github.com/nuvairea/scribbly)

**Live API:** [scribbly-server.onrender.com](https://scribbly-server.onrender.com)

- Google OAuth sign-in only. The client sends a Google authorization code, the server exchanges it with Google and verifies the result, and only accounts with a verified Google email can sign in. No passwords are stored
- Session-based authentication using `express-session`, backed by MongoDB via `connect-mongo` so sessions survive server restarts
- Rolling 30-day sessions, refreshed on activity rather than expiring on a fixed date
- Rate limiting on the sign-in endpoint (10 attempts per 5 minutes)
- Full note CRUD, scoped per user, with soft-delete support
- Account deletion that removes the user and all of their notes, and ends the current session

## Stack

- Node.js, Express and TypeScript
- MongoDB with Mongoose
- `express-session` and `connect-mongo` for persistent sessions
- `google-auth-library` for Google sign-in
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

## Data stored

- **Users:** Google account ID, email, first name, a link to the Google profile picture (the image itself stays with Google), and the account creation date
- **Notes:** title, body, color, timestamps and soft-delete state, tied to the user who owns them
- **Sessions:** stored in MongoDB so logins survive restarts

## Getting started

```bash
git clone https://github.com/nuvairea/scribbly-server.git
cd scribbly-server
npm install
```

Create a `.env` file in the project root with the variables listed in [Environment variables](#environment-variables), then run it:

```bash
npm run dev      # watch mode
npm run build && npm start   # production
```

The API starts on `PORT` (`3000` by default).

## Running with the frontend

The server only accepts requests from allowed origins, which include the live app and local dev servers on `localhost` / `127.0.0.1` at ports `5173` and `5500`. If your frontend runs somewhere else, add its origin to the CORS list in `src/index.ts`.

In production, the frontend's Render static site rewrites `/api/*` to this server, so the session cookie is first-party and works in Safari. For local development, point the frontend at this server with `VITE_API_URL` (see the [frontend README](https://github.com/nuvairea/scribbly)).

## Environment variables

| Variable               | Required          | Description                                                                                                    |
| ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`          | Yes               | Connection string for your MongoDB database                                                                    |
| `GOOGLE_CLIENT_ID`     | Yes               | OAuth client ID from Google Cloud Console. The server only accepts tokens issued for this ID                   |
| `GOOGLE_CLIENT_SECRET` | Yes               | Client secret for the same OAuth client. Server only, never put it in the frontend                             |
| `SESSION_SECRET`       | Yes in production | Secret used to sign the session cookie. The server refuses to start in production without it                   |
| `NODE_ENV`             | Yes in production | Set to `production` to enable secure, cross-site cookies                                                       |
| `PORT`                 | No                | Defaults to `3000`. Render sets this for you                                                                   |

## License

This project is licensed under the [MIT License](./LICENSE).
