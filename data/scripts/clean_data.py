import pandas as pd

RAW_PATH = "../raw/gym_events.csv"
OUT_PATH = "../processed/clean_gym_events.csv"

def main():
    df = pd.read_csv(RAW_PATH)

    # Parse dates/times
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.date

    # Clean numeric columns
    df["duration_min"] = pd.to_numeric(df["duration_min"], errors="coerce")
    df["spend_cad"] = pd.to_numeric(df["spend_cad"], errors="coerce").fillna(0.0)

    # Basic sanity filters
    df = df.dropna(subset=["timestamp","date","location","member_id","activity_type"])
    df = df[df["duration_min"].between(5, 300)]

    # Normalize strings
    for col in ["location","membership_tier","activity_type","class_name","equipment_used"]:
        df[col] = df[col].fillna("").astype(str).str.strip()

    df.to_csv(OUT_PATH, index=False)
    print(f"Saved cleaned data to: {OUT_PATH} ({len(df):,} rows)")

if __name__ == "__main__":
    main()
