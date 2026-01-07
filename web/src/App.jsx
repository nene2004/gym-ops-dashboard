/**
 * Gym Ops Dashboard (frontend)
 * Purpose:
 * - Visualize gym activity KPIs for a selected date range.
 * - Pulls data from the FastAPI backend and renders cards, trend chart, and top lists.
 *
 * Notes:
 * - In development, API calls go to /api/* which Vite proxies to http://127.0.0.1:8000
 * - For deployment, set VITE_API_BASE to your hosted API URL.
 */

import { useEffect, useMemo, useState } from "react";
import StatCard from "./components/StatCard.jsx";
import TrendChart from "./components/TrendChart.jsx";
import TopTable from "./components/TopTable.jsx";
import { getJson, isoDate } from "./lib/api.js";

// We call the FastAPI through the Vite proxy:
//   frontend: http://localhost:5173
//   backend:  http://127.0.0.1:8000
// Vite proxy rewrites /api/* -> backend/*
const API_PREFIX = "/api";

function fmtInt(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat().format(Number(n));
}
function fmtMoney(n) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(Number(n));
}
function fmtPct(n) {
  if (n === null || n === undefined) return "—";
  return `${(Number(n) * 100).toFixed(1)}%`;
}

export default function App() {
  // Default date range: last 30 days from "today"
  const today = useMemo(() => new Date(), []);
  const defaultEnd = useMemo(() => isoDate(today), [today]);
  const defaultStart = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return isoDate(d);
  }, [today]);

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [freq, setFreq] = useState("day");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topClasses, setTopClasses] = useState([]);
  const [topEquipment, setTopEquipment] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [k, t, c, e] = await Promise.all([
        getJson(`${API_PREFIX}/kpis`, { start, end }),
        getJson(`${API_PREFIX}/trend/checkins`, { start, end, freq }),
        getJson(`${API_PREFIX}/top/classes`, { start, end, limit: 8 }),
        getJson(`${API_PREFIX}/top/equipment`, { start, end, limit: 8 }),
      ]);

      setKpis(k);
      setTrend(t?.data ?? []);
      setTopClasses(c?.data ?? []);
      setTopEquipment(e?.data ?? []);

      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div className="title">
          <h1>Gym Operations Dashboard</h1>
          <div className="subtitleRow">
            <span>
              KPIs + trends from check-ins, classes, equipment, and spend.
            </span>

            <span className="chip">
              <span className={`dot ${error ? "err" : ""}`}></span>
              {error ? "API issue" : "API connected"}
            </span>

            <span className="chip">
              Range: {start} → {end}
            </span>

            {lastUpdated ? (
              <span className="chip">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="controls">
          <div className="control">
            <span>Start</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="control">
            <span>End</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div className="control">
            <span>Trend</span>
            <select value={freq} onChange={(e) => setFreq(e.target.value)}>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
            </select>
          </div>

          <button
            className="btn secondary"
            onClick={() => {
              setStart(defaultStart);
              setEnd(defaultEnd);
              setFreq("day");
            }}
          >
            Reset
          </button>
          <button className="btn" onClick={loadAll}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="grid" style={{ marginTop: 14 }}>
          <div className="panel" style={{ gridColumn: "span 12" }}>
            <h2>Couldn’t load data</h2>
            <div className="muted">{error}</div>
            <div className="muted" style={{ marginTop: 10 }}>
              Make sure your API is running:{" "}
              <span className="badge">uvicorn main:app --reload</span> and you
              can open <span className="badge">http://127.0.0.1:8000/docs</span>
              .
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid">
        <StatCard
          loading={loading}
          title="Total Visits"
          value={fmtInt(kpis?.total_visits)}
          sub="Member visits in range"
          hint="Tracks foot traffic volume"
        />

        <StatCard
          loading={loading}
          title="Unique Members"
          value={fmtInt(kpis?.unique_members)}
          sub="Distinct members"
          hint="Useful for retention signals"
        />

        <StatCard
          loading={loading}
          title="Avg Duration"
          value={`${kpis?.avg_duration_min?.toFixed?.(1) ?? "—"} min`}
          sub="Average visit length"
          hint="Longer can mean higher engagement"
        />

        <StatCard
          loading={loading}
          title="Total Spend"
          value={fmtMoney(kpis?.total_spend_cad)}
          sub={`Busiest hour: ${kpis?.busiest_hour ?? "—"}:00`}
          hint="Revenue from add-ons, passes, etc."
        />

        <TrendChart
          title="Check-ins Over Time"
          data={loading ? [] : trend}
          xKey="bucket"
          yKey="checkins"
          yLabel="Check-ins per period"
        />

        <TopTable
          title="Top Classes"
          rows={loading ? [] : topClasses}
          emptyText="No class activity for this range."
          columns={[
            { key: "class_name", label: "Class" },
            { key: "sessions", label: "Sessions", render: (v) => fmtInt(v) },
          ]}
        />

        <TopTable
          title="Top Equipment"
          rows={loading ? [] : topEquipment}
          emptyText="No equipment usage for this range."
          columns={[
            { key: "equipment", label: "Equipment" },
            { key: "uses", label: "Uses", render: (v) => fmtInt(v) },
          ]}
        />
      </div>
      <div className="panel" style={{ gridColumn: "span 12" }}>
        <h2>Insights</h2>
        <ul className="insights">
          <li>
            <span className="badge">Usage</span>{" "}
            {topEquipment?.[0]?.equipment
              ? `${topEquipment[0].equipment} is the most used equipment.`
              : "—"}
          </li>
          <li>
            <span className="badge">Classes</span>{" "}
            {topClasses?.[0]?.class_name
              ? `${topClasses[0].class_name} is the most popular class.`
              : "—"}
          </li>
          <li>
            <span className="badge">Traffic</span>{" "}
            {kpis?.busiest_hour !== undefined
              ? `Busiest hour is around ${kpis.busiest_hour}:00.`
              : "—"}
          </li>
        </ul>
      </div>
      <div className="footer">
        Tip: In dev, the frontend calls <span className="badge">/api</span> and
        Vite proxies to your FastAPI server. For deployment, set{" "}
        <span className="badge">VITE_API_BASE</span> to your API URL.
      </div>
    </div>
  );
}
