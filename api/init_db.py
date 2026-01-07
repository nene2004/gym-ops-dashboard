import sqlite3
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = (BASE_DIR / ".." / "data" / "processed" / "clean_gym_events.csv").resolve()
DB_PATH = (BASE_DIR / "app.db").resolve()

def main():
    df = pd.read_csv(DATA_PATH)

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.execute("DROP TABLE IF EXISTS visits")
    cur.execute("""
        CREATE TABLE visits (
            event_id INTEGER PRIMARY KEY,
            timestamp TEXT NOT NULL,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            member_id INTEGER NOT NULL,
            membership_tier TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            class_name TEXT,
            equipment_used TEXT,
            duration_min INTEGER NOT NULL,
            spend_cad REAL NOT NULL
        )
    """)
    con.commit()

    df.to_sql("visits", con, if_exists="append", index=False)

    cur.execute("CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_visits_location ON visits(location)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_visits_activity ON visits(activity_type)")
    con.commit()
    con.close()

    print(f"✅ Created {DB_PATH} and loaded {len(df):,} rows from {DATA_PATH}")

if __name__ == "__main__":
    main()
