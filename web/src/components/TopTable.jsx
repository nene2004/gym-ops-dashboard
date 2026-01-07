export default function TopTable({ title, rows, columns, emptyText }) {
  // ✅ normalize rows so .map never crashes
  const safeRows =
    Array.isArray(rows) ? rows :
    Array.isArray(rows?.items) ? rows.items :
    Array.isArray(rows?.results) ? rows.results :
    Array.isArray(rows?.data) ? rows.data :
    [];

  return (
    <div className="side">
      <h2>{title}</h2>
      {safeRows.length === 0 ? (
        <div className="muted">{emptyText || "No data"}</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((r, idx) => (
              <tr key={idx}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}