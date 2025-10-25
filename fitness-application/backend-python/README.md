Python backend for Fitness Application

Overview
- Framework: FastAPI + Uvicorn
- Purpose: Mirror the existing Node/Express backend endpoints so the frontend can work unchanged.
- Endpoints:
  - GET `/api/health`
  - GET `/api/exercises`
  - GET `/api/recipes`
  - GET `/api/nutrition`
  - GET `/api/search-history`

Environment
- `MONGODB_URI` (required) – MongoDB connection string
- `API_NINJAS_KEY` (required) – API Ninjas key for exercises/recipes/nutrition
- `PORT` (optional) – defaults to 5001

Install
1) Create and activate a virtual environment
   - Windows (PowerShell): `python -m venv .venv; . .venv\\Scripts\\Activate.ps1`
   - macOS/Linux: `python3 -m venv .venv && source .venv/bin/activate`
2) `pip install -r requirements.txt`

Run
- `cp .env.example .env` and set values
- Dev: `uvicorn main:app --reload --host 0.0.0.0 --port 5001`
- Or: `python main.py`

Notes
- The Python backend uses the same routes and response shapes as the Node backend.
- Switch the frontend API base URL if needed (or run on the same port to avoid changes).

