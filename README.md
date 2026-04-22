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

## Notes

This is a boilerplate scaffold only; no business logic has been implemented yet.
