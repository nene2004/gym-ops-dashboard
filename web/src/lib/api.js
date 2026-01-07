/**
 * API helper
 * - In dev, we recommend using Vite proxy and calling /api/...
 * - In prod, set VITE_API_BASE to your deployed API URL (no trailing slash).
 */
const API_BASE = import.meta.env.VITE_API_BASE || '';

function buildUrl(path, params) {
  const url = new URL((API_BASE ? API_BASE : '') + path, window.location.origin);
  // If API_BASE is empty, URL() will use window.location.origin and keep absolute path.
  // Works fine for dev proxy usage.
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  // When using proxy with empty API_BASE, ensure path starts with /api
  return url.toString();
}

export async function getJson(path, params) {
  const res = await fetch(buildUrl(path, params));
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${msg || res.statusText}`);
  }
  return res.json();
}

export function isoDate(d) {
  // d is a Date
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
