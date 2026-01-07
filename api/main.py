from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = (BASE_DIR / "app.db").resolve()

app = FastAPI(title="Gym Ops Dashboard API", version="1.0.0")

# Allows a React frontend later (runs on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def parse_date(d: str) -> str:
    # Expect YYYY-MM-DD
    return datetime.strptime(d, "%Y-%m-%d").date().isoformat()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/kpis")
def kpis(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
):
    start_d = parse_date(start)
    end_d = parse_date(end)

    con = db()
    cur = con.cursor()

    cur.execute(
        """SELECT COUNT(*) AS total_visits
             FROM visits
             WHERE date BETWEEN ? AND ?""",
        (start_d, end_d),
    )
    total_visits = cur.fetchone()["total_visits"]

    cur.execute(
        """SELECT COUNT(DISTINCT member_id) AS unique_members
             FROM visits
             WHERE date BETWEEN ? AND ?""",
        (start_d, end_d),
    )
    unique_members = cur.fetchone()["unique_members"]

    cur.execute(
        """SELECT AVG(duration_min) AS avg_duration
             FROM visits
             WHERE date BETWEEN ? AND ?""",
        (start_d, end_d),
    )
    avg_duration = cur.fetchone()["avg_duration"] or 0

    cur.execute(
        """SELECT SUM(spend_cad) AS total_spend
             FROM visits
             WHERE date BETWEEN ? AND ?""",
        (start_d, end_d),
    )
    total_spend = cur.fetchone()["total_spend"] or 0

    cur.execute(
        """SELECT SUBSTR(timestamp, 12, 2) AS hour, COUNT(*) AS c
             FROM visits
             WHERE date BETWEEN ? AND ?
             GROUP BY hour
             ORDER BY c DESC
             LIMIT 1""",
        (start_d, end_d),
    )
    row = cur.fetchone()
    busiest_hour = int(row["hour"]) if row else None

    con.close()

    return {
        "start": start_d,
        "end": end_d,
        "total_visits": total_visits,
        "unique_members": unique_members,
        "avg_duration_min": round(float(avg_duration), 1),
        "total_spend_cad": round(float(total_spend), 2),
        "busiest_hour": busiest_hour,
    }

@app.get("/trend/checkins")
def trend_checkins(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    freq: str = Query("day", pattern="^(day|week)$", description="day or week"),
):
    start_d = parse_date(start)
    end_d = parse_date(end)

    con = db()
    cur = con.cursor()

    if freq == "day":
        cur.execute(
            """SELECT date AS bucket, COUNT(*) AS checkins
                 FROM visits
                 WHERE date BETWEEN ? AND ?
                 GROUP BY date
                 ORDER BY date ASC""",
            (start_d, end_d),
        )
    else:
        cur.execute(
            """SELECT strftime('%Y-W%W', date) AS bucket, COUNT(*) AS checkins
                 FROM visits
                 WHERE date BETWEEN ? AND ?
                 GROUP BY bucket
                 ORDER BY bucket ASC""",
            (start_d, end_d),
        )

    out = [{"bucket": r["bucket"], "checkins": r["checkins"]} for r in cur.fetchall()]
    con.close()
    return {"start": start_d, "end": end_d, "freq": freq, "data": out}

@app.get("/top/classes")
def top_classes(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    limit: int = Query(10, ge=1, le=50),
):
    start_d = parse_date(start)
    end_d = parse_date(end)

    con = db()
    cur = con.cursor()
    cur.execute(
        """SELECT class_name, COUNT(*) AS sessions
             FROM visits
             WHERE date BETWEEN ? AND ?
               AND activity_type = 'Class'
               AND class_name != ''
             GROUP BY class_name
             ORDER BY sessions DESC
             LIMIT ?""",
        (start_d, end_d, limit),
    )
    out = [{"class_name": r["class_name"], "sessions": r["sessions"]} for r in cur.fetchall()]
    con.close()
    return {"start": start_d, "end": end_d, "data": out}

@app.get("/top/equipment")
def top_equipment(
    start: str = Query(..., description="YYYY-MM-DD"),
    end: str = Query(..., description="YYYY-MM-DD"),
    limit: int = Query(10, ge=1, le=50),
):
    start_d = parse_date(start)
    end_d = parse_date(end)

    con = db()
    cur = con.cursor()
    cur.execute(
        """SELECT equipment_used, COUNT(*) AS uses
             FROM visits
             WHERE date BETWEEN ? AND ?
               AND activity_type = 'Gym Visit'
               AND equipment_used != ''
             GROUP BY equipment_used
             ORDER BY uses DESC
             LIMIT ?""",
        (start_d, end_d, limit),
    )
    out = [{"equipment": r["equipment_used"], "uses": r["uses"]} for r in cur.fetchall()]
    con.close()
    return {"start": start_d, "end": end_d, "data": out}
