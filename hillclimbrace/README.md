# Ridge Runner

A hill-climb time trial built with React, Vite, and a Spring Boot API. Race over procedural alpine terrain, collect coins, manage fuel, and submit finish times to the persistent summit leaderboard.

## Requirements

- Node.js 20.19+ or 22.12+
- Java 21
- Internet access on the first backend launch so the project can download Maven and Java dependencies

## Run locally

Open two terminals in the project directory.

Terminal 1 starts the Spring Boot API on port 8081. The first run bootstraps Maven into the user-local application data directory.

```powershell
npm run dev:backend
```

Terminal 2 starts the Vite client on port 5173. API requests are proxied to the backend.

```powershell
npm run dev
```

Open http://localhost:5173 to play. Use A/D or the arrow keys to drive, W/S to tilt in the air, and Space or P to pause. Touch controls appear on small screens.

## API

- `GET /api/health` checks the service.
- `GET /api/leaderboard` returns the ten best results.
- `POST /api/races` stores a completed run. The body contains `playerName`, `distanceMeters`, `coins`, and `durationSeconds`.

Race results are stored in a local H2 database under `backend/data/`.

## Checks

```powershell
npm run lint
npm run build
powershell -ExecutionPolicy Bypass -File backend/run.ps1 test
```
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
