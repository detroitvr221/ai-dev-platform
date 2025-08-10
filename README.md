# AI Dev Platform

Multi-agent development platform scaffold with Node.js/Express backend, WebSocket updates, OpenAI-powered agents, and React/Vite frontend with Monaco.

## Prerequisites
- Node.js 18+
- OpenAI API key

## Setup

1. Backend
```bash
cd backend
cp .env.example .env
# edit .env to set OPENAI_API_KEY
npm install
npm run dev
```

2. Frontend
```bash
cd ../frontend
npm install
npm run dev
```

Web app: http://localhost:5173
Backend: http://localhost:3001
WebSocket: ws://localhost:3002

## Notes
- Agents output files using triple-fenced blocks starting with `file:/path`. The orchestrator writes them into the project.
- Basic project management APIs: list/create projects, read/write files, tree listing.

## Monaco No‑Code Editor Review
See `frontend/MONACO_EDITOR_REVIEW.md` for a gap analysis and an implementation plan to build the requested Monaco-based no-code editor (VFS, tabs, preview assembly, dependencies panel, browser persistence, and tests).

