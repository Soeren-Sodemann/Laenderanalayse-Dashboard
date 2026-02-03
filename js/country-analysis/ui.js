import { setText } from "../shared/dom.js";
import { formatNumber } from "../shared/formatters.js";
import { LOCALE } from "./config.js";

// Standard-Platzhalter
const FALLBACK_TEXT = "—";
// Sprache ist deutsch
const languageDisplay =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames([LOCALE], { type: "language" })
    : null;
const currencyDisplay =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? (() => {
        try {
          return new Intl.DisplayNames([LOCALE], { type: "currency" });
        } catch (err) {
          return null;
        }
      })()
    : null;

// formatiert ein Array zu einer komma getrennten Liste
function formatList(value) {
  if (!Array.isArray(value) || value.length === 0) return FALLBACK_TEXT;
  return value.filter(Boolean).join(", ");
}

// formatiert Sprach-Objekte in lesbare Labels
function formatLanguages(languages) {
  if (!languages) return FALLBACK_TEXT;
  const entries = Object.entries(languages);
  if (!entries.length) return FALLBACK_TEXT;

  return entries
    .map(([code, label]) => {
      // wenn möglich, ISO-Codes in lokale Namen übersetzen
      if (languageDisplay && code) {
        const translated = languageDisplay.of(code);
        if (translated && translated !== code) return translated;
      }
      return label;
    })
    .filter(Boolean)
    .join(", ");
}

// formatiert Währungen inkl. Code
function formatCurrencies(currencies) {
  if (!currencies) return FALLBACK_TEXT;
  const entries = Object.entries(currencies);
  if (!entries.length) return FALLBACK_TEXT;

  return entries
    .map(([code, meta]) => {
      const name = meta?.name;
      let localized = "";

      if (code && currencyDisplay) {
        const translated = currencyDisplay.of(code);
        if (translated && translated !== code) localized = translated;
      }

      if (!localized && code) {
        try {
          const parts = new Intl.NumberFormat(LOCALE, {
            style: "currency",
            currency: code,
            currencyDisplay: "name",
          }).formatToParts(1);
          const currencyPart = parts.find((part) => part.type === "currency");
          if (currencyPart?.value && currencyPart.value !== code) {
            localized = currencyPart.value;
          }
        } catch (err) {
          localized = "";
        }
      }

      const label = localized || name || code;
      if (label && code && label !== code) return `${label} (${code})`;
      return label;
    })
    .filter(Boolean)
    .join(", ");
}

// kombiniert Region und Subregion
function formatRegion(country) {
  const region = country?.region;
  const subregion = country?.subregion;
  const combined = [region, subregion].filter(Boolean).join(" · ");
  return combined || FALLBACK_TEXT;
}
// holt den lokalisierten Hauptstadtnamen aus der Map
function getLocalizedCapital(country, capitalMap) {
  if (!capitalMap) return null;
  const code = country?.cca2;
  if (!code) return null;
  const entry = capitalMap[code.toUpperCase()];
  if (!entry) return null;
  return Array.isArray(entry) ? entry : [entry];
}

// holt alle relevanten UI-Elemente
export function getUi() {
  return {
    panel: document.getElementById("country-panel"),
    tooltip: document.getElementById("map-tooltip"),
    status: document.getElementById("country-status"),
    state: document.getElementById("country-state"),
    flag: document.getElementById("country-flag"),
    name: document.getElementById("country-name"),
    region: document.getElementById("country-region"),
    capital: document.getElementById("country-capital"),
    population: document.getElementById("country-population"),
    area: document.getElementById("country-area"),
    languages: document.getElementById("country-languages"),
    currency: document.getElementById("country-currency"),
    timezones: document.getElementById("country-timezones"),
  };
}

// setzt den Panel-State und Status-Text
export function setPanelState(ui, state, message) {
  if (!ui?.panel) return;
  ui.panel.dataset.state = state;

  const statusText =
    state === "loading"
      ? "Lädt..."
      : state === "error"
      ? "Fehler"
      : state === "ready"
      ? "Aktiv"
      : "Bereit";

  setText(ui.status, statusText);
  if (message) setText(ui.state, message);
}

// leert alle Detailfelder
export function clearDetails(ui) {
  setText(ui.capital, FALLBACK_TEXT);
  setText(ui.population, FALLBACK_TEXT);
  setText(ui.area, FALLBACK_TEXT);
  setText(ui.languages, FALLBACK_TEXT);
  setText(ui.currency, FALLBACK_TEXT);
  setText(ui.timezones, FALLBACK_TEXT);
}

// rendert ein Land in die Detailansicht
export function renderCountry(ui, country, capitalMap) {
  const translated = country?.translations?.deu?.common;
  const displayName = translated || country?.name?.common || FALLBACK_TEXT;
  const flagEmoji = country?.flag || "🏳️";
  const localizedCapital = getLocalizedCapital(country, capitalMap);

  setText(ui.flag, flagEmoji);
  setText(ui.name, displayName);
  setText(ui.region, formatRegion(country));

  setText(ui.capital, formatList(localizedCapital ?? country?.capital));
  setText(
    ui.population,
    country?.population != null
      ? formatNumber(country.population, LOCALE)
      : FALLBACK_TEXT
  );
  setText(
    ui.area,
    country?.area != null
      ? `${formatNumber(country.area, LOCALE)} km²`
      : FALLBACK_TEXT
  );
  setText(ui.languages, formatLanguages(country?.languages));
  setText(ui.currency, formatCurrencies(country?.currencies));
  setText(ui.timezones, formatList(country?.timezones));
}
