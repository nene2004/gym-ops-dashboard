import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'

export default function TrendChart({ title, data, xKey, yKey, yLabel }) {
  return (
    <div className="panel">
      <h2>{title}</h2>
      {(!data || data.length === 0) ? (
        <div className="muted">No data for this range.</div>
      ) : (
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey={yKey} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="muted" style={{ marginTop: 8 }}>{yLabel}</div>
        </div>
      )}
    </div>
  )
}
