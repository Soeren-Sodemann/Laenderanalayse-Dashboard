import { RESTCOUNTRIES_BASE, RESTCOUNTRIES_FIELDS } from "./config.js";

// hilfsfunktion für API-Anfragen, die JSON zurückgeben
async function requestJson(url) {
  const res = await fetch(url);

  // Fehlerbehandlung
  if (!res.ok) {
    const error = new Error(`HTTP_${res.status}`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

// lädt ein Land per ISO-Code
export async function fetchCountryByCode(code) {
  const url = `${RESTCOUNTRIES_BASE}/alpha/${encodeURIComponent(code)}?fields=${RESTCOUNTRIES_FIELDS}`;
  const data = await requestJson(url);
  return Array.isArray(data) ? data[0] : data;
}

// lädt Länder per Namen
export async function fetchCountriesByName(name) {
  const url = `${RESTCOUNTRIES_BASE}/name/${encodeURIComponent(name)}?fields=${RESTCOUNTRIES_FIELDS}`;
  const data = await requestJson(url);
  return Array.isArray(data) ? data : [data];
}
