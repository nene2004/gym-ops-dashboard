/**
 * KPI tile used across the dashboard.
 * We keep it reusable so adding new KPIs later is easy.
 */
export default function StatCard({ title, value, sub, hint, loading }) {
  return (
    <div className="card">
      <div className="cardTop">
        <div>
          <h3>{title}</h3>
          <div className="kpiValue">
            {loading ? <div className="skeleton" style={{ width: "72%" }} /> : value}
          </div>
          {sub ? <div className="kpiSub">{sub}</div> : null}
          {hint ? <div className="kpiHint">{hint}</div> : null}
        </div>

        {/* A subtle badge slot – feels like a real admin UI */}
        <span className="badge">Live</span>
      </div>
    </div>
  );
}