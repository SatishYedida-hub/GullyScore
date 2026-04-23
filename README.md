# GullyScore

A full-stack cricket scoring app.

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React
- **Database:** MongoDB

## Project Structure

```
GullyScore/
├── backend/
│   ├── config/          MongoDB connection setup
│   ├── controllers/     Route handler stubs
│   ├── models/          Mongoose schemas
│   ├── routes/          Express routers
│   ├── server.js        Express entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/  Reusable UI pieces
    │   ├── pages/       Route-level screens
    │   ├── services/    API clients (axios)
    │   ├── App.js       Root component with routing
    │   └── index.js     React entry point
    ├── .env.example
    └── package.json
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (or a connection string to a remote instance)

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API will start on `http://localhost:5000`.

### Available routes

- `GET  /api/health`
- `GET/POST /api/matches` and `/api/matches/:id` (PUT, DELETE)
- `GET/POST /api/players` and `/api/players/:id` (PUT, DELETE)

All controller handlers are stubs and return placeholder responses.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

The React app will start on `http://localhost:3000` and proxy API calls to the backend.

## Deploying to Render

The repo ships with a `render.yaml` Blueprint that provisions **two services**
(backend web service + frontend static site) in one go. MongoDB itself is NOT
hosted on Render — use MongoDB Atlas (free tier).

### 1. Provision a MongoDB Atlas cluster

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com) and create a free
   **M0** cluster.
2. Create a database user (Database Access) and allow access from anywhere
   (`0.0.0.0/0`) under Network Access.
3. Click **Connect → Drivers** and copy the `mongodb+srv://…` URI.
   Append `/gullyscore` as the database name, e.g.:
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/gullyscore`

### 2. Push the repo to GitHub

Render deploys from Git, so your `main` branch must be pushed to GitHub (or
GitLab).

```bash
git push origin main
```

### 3. Create the Blueprint on Render

1. In the Render dashboard, click **New → Blueprint**.
2. Connect your repo. Render will auto-detect `render.yaml` and show both
   services (`gullyscore-backend` and `gullyscore-frontend`).
3. For each service with `sync: false` env vars, fill them in:
   - **gullyscore-backend**:
     - `MONGO_URI` → paste the Atlas URI from step 1
     - `CORS_ORIGIN` → leave blank for now (we'll set it in step 5)
   - **gullyscore-frontend**:
     - `REACT_APP_API_URL` → leave blank for now
4. Click **Apply**. Render starts building both services in parallel.

### 4. Grab the URLs

After deployment, Render assigns URLs like:

- Backend: `https://gullyscore-backend.onrender.com`
- Frontend: `https://gullyscore-frontend.onrender.com`

(The exact names depend on availability.)

### 5. Wire the two services together

Back in the Render dashboard:

1. Open **gullyscore-frontend → Environment** and set
   `REACT_APP_API_URL=https://gullyscore-backend.onrender.com/api`.
   Save — Render will rebuild and redeploy the static site.
2. Open **gullyscore-backend → Environment** and set
   `CORS_ORIGIN=https://gullyscore-frontend.onrender.com`.
   Save — Render will restart the backend.
3. (Recommended) In the same Environment tab, set `ADMIN_TOKEN` to a long
   random string. This locks destructive actions (delete team, remove
   player from team, delete roster player, delete match) so only someone
   who has the key can perform them. See the **Admin (owner) key** section
   below for how it works.

### 6. Verify

- `https://gullyscore-backend.onrender.com/health` should return
  `Server is running`.
- Open the frontend URL and try creating a team → creating a match → scoring.

### Admin (owner) key

To keep deletions to just yourself, set an `ADMIN_TOKEN` env var on the
backend:

```
ADMIN_TOKEN=your-long-random-secret
```

- Any request to delete a team, remove a player from a team, delete a
  roster player, or delete a match must include `X-Admin-Token: <value>`.
- In the UI, click the **Admin** (🔒) button in the navbar, paste the same
  value, and hit Unlock. It's stored in your browser's localStorage so you
  don't have to re-enter it.
- Delete buttons are **hidden** for anyone who hasn't unlocked. Clicking
  **Lock** (🔓) in the navbar clears the stored key from that device.
- If `ADMIN_TOKEN` is not set on the server, the lock is disabled and
  deletes are open to everyone (the old default, convenient for local
  dev). A warning is logged at startup so you notice.
- Rotating the key: change `ADMIN_TOKEN` on Render → redeploy → re-enter
  the new value on your device. Old devices still holding the old key are
  automatically signed out on their next delete (the 403 response clears
  the stored key).

### Notes on the free tier

- Render's free web service **sleeps after 15 minutes** of inactivity. The
  first request after idle will take ~30 seconds. Upgrade to a paid plan or
  add a cron-style pinger to keep it warm.
- Cold starts do not affect the static site (frontend).
- If `CORS_ORIGIN` is left unset, the backend allows all origins (`*`).

## Notes

This is a boilerplate scaffold only; no business logic has been implemented yet.
