# Day 2 — Frontend (React) Dashboard

## What this adds
A clean React dashboard that calls your FastAPI gym API and displays:
- KPI cards
- Check-in trend chart (daily/weekly)
- Top classes table
- Top equipment table
- Date range filters + loading/error states

## Run it (beginner steps)

### 1) Start the API (in Terminal 1)
From the project root:
```bash
cd api
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload
```
Confirm it works:
- http://127.0.0.1:8000/docs

### 2) Start the frontend (in Terminal 2)
From the project root:
```bash
cd web
npm install
npm run dev
```
Open:
- http://localhost:5173

## How the frontend talks to the API
During development, it calls `/api/...`.
Vite proxies `/api` -> `http://127.0.0.1:8000` (see `vite.config.js`), so you avoid CORS issues.
