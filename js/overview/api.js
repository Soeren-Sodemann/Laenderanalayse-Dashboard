import { API_BASE } from "./config.js";
// hilfsfunktion für API-Anfragen, die JSON zurückgeben
async function requestJson(url) {
  const res = await fetch(url);
// Fehlerbehandlung
  if (!res.ok) {
    // Einheitlicher Fehler, damit UI später sauber reagieren kann
    const error = new Error(`HTTP_${res.status}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

// gibt { value, year } oder null zurück
export async function fetchLatestIndicator(countryCode, indicatorCode) {
    // per_page=60, um sicherzustellen, dass ein wert gefunden wird
  const url =
    `${API_BASE}/${countryCode}/indicator/${encodeURIComponent(indicatorCode)}` +
    `?format=json&per_page=60`;

  const data = await requestJson(url);
//   data[1] enthält die eigentlichen Daten
  const rows = Array.isArray(data) ? data[1] : null;
  if (!Array.isArray(rows)) return null;
//   den neuesten Eintrag mit Wert finden (der ein value hat)
  const latest = rows.find((row) => row && row.value != null);
  if (!latest) return null;

  return { value: latest.value, year: latest.date };
}

// gibt number oder null zurück
export async function fetchIndicatorForYear(countryCode, indicatorCode, year) {
    // per_page=1, um nur einen Wert zu erhalten
  const url =
    `${API_BASE}/${countryCode}/indicator/${encodeURIComponent(indicatorCode)}` +
    `?format=json&per_page=1&date=${encodeURIComponent(year)}`;

  const data = await requestJson(url);
  const rows = Array.isArray(data) ? data[1] : null;
// wenn kein Wert vorhanden ist, null zurückgeben
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first || first.value == null) return null;

  return first.value;
}

// gibt [{year, value}] zurück (alt -> neu)
export async function fetchLatestSeries(countryCode, indicatorCode, count) {
  const url =
    `${API_BASE}/${countryCode}/indicator/${encodeURIComponent(indicatorCode)}` +
    `?format=json&per_page=80`;

  const data = await requestJson(url);
  const rows = Array.isArray(data) ? data[1] : null;
  if (!Array.isArray(rows)) return [];
// werte filtern die keine value haben
  const filtered = rows.filter((row) => row && row.value != null);
// slice : neuste "count" werte nehmen, reverse für alt -> neu
  return filtered
    .slice(0, count)
    .reverse()
    .map((row) => ({ year: row.date, value: row.value }));
}
