import { fetchCountryByCode, fetchCountriesByName } from "./api.js";
import { LOCALE } from "./config.js";
import { positionPopover, setPopoverOpen } from "./popover.js";
import { hideTooltip, positionTooltip, showTooltip } from "./tooltip.js";
import { pickBestMatch } from "./service.js";
import { clearDetails, getUi, renderCountry, setPanelState } from "./ui.js";
import { setText } from "../shared/dom.js";

// einfacher Cache für geladene Länder
const cache = new Map();
// aktuell aktives Land im SVG
let activeKey = null;
// aktuell aktives SVG-Element
let activePath = null;
// aktuell aktives Tooltip-Ziel
let activeTooltipKey = null;
// laufende Anfrage-ID zum Abgleichen von Responses
let activeRequestId = 0;
// Index der SVG-Pfade je Land
let countryIndex = null;
// lokalisierte Hauptstädte
let capitalMapPromise = null;
// lokalisierte Ländernamen (für Länder ohne ISO-Code)
let countryNameMapPromise = null;

const countryDisplay =
  typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames([LOCALE], { type: "region" })
    : null;

// prüft, ob ein Wert wie ein ISO-2-Code aussieht
function isIsoCode(value) {
  return /^[A-Z]{2}$/.test(value);
}

function getLocalizedLabel(code, fallback) {
  if (!countryDisplay || !code) return fallback;
  const translated = countryDisplay.of(code);
  if (!translated || translated === code) return fallback;
  return translated;
}

function resolveCountryLabel(path, nameMap) {
  const name = path.dataset.countryName?.trim();
  const code = path.dataset.countryCode?.trim();
  const key = path.dataset.countryKey?.trim();

  if (nameMap) {
    if (name && nameMap[name]) return nameMap[name];
    if (!name && key && nameMap[key]) return nameMap[key];
  }

  return getLocalizedLabel(code, name || code || key || "");
}

// baut einen Index aus Ländernamen/ISO-Code -> SVG-Pfade
function buildCountryIndex(svg) {
  const index = new Map();
  const paths = svg.querySelectorAll("path");

  paths.forEach((path) => {
    const rawName = path.getAttribute("name") || path.getAttribute("class");
    const rawCode = path.getAttribute("id") || "";
    const name = rawName ? rawName.trim() : "";
    const code = isIsoCode(rawCode) ? rawCode : "";
    const key = name || code;

    if (!key) return;

    if (name) path.dataset.countryName = name;
    if (code) path.dataset.countryCode = code;
    path.dataset.countryKey = key;
    path.dataset.countryLabel = getLocalizedLabel(code, name || code || key);

    if (!index.has(key)) index.set(key, []);
    index.get(key).push(path);
  });

  return index;
}

function applyCountryLabels(index, nameMap) {
  if (!index || !nameMap) return;

  index.forEach((paths) => {
    paths.forEach((path) => {
      path.dataset.countryLabel = resolveCountryLabel(path, nameMap);
    });
  });
}

// markiert ein Land im SVG als aktiv
function setActiveCountry(key) {
  if (!countryIndex) return;

  if (activeKey && countryIndex.has(activeKey)) {
    countryIndex.get(activeKey).forEach((path) => {
      path.classList.remove("is-active");
      path.removeAttribute("aria-current");
    });
  }

  activeKey = key;

  if (!key || !countryIndex.has(key)) return;
  countryIndex.get(key).forEach((path) => {
    path.classList.add("is-active");
    path.setAttribute("aria-current", "true");
  });
}
// setzt das Panel in den Leerlauf-Zustand
function resetPanel(ui) {
  setPanelState(ui, "idle", "Wähle ein Land auf der Karte, um Details zu sehen.");
  setText(ui.name, "Kein Land ausgewählt");
  setText(ui.region, "Klicke auf die Karte, um Details zu sehen.");
  setText(ui.flag, "🌍");
  clearDetails(ui);
}
// schließt das Popover und setzt die UI zurück
function closePopover(ui) {
  if (!ui?.panel) return;
  setPopoverOpen(ui, false);
  setActiveCountry(null);
  activePath = null;
  activeRequestId += 1;
  resetPanel(ui);
}

// lädt das Mapping für deutsche Hauptstädte
function loadCapitalMap() {
  if (capitalMapPromise) return capitalMapPromise;

  capitalMapPromise = fetch("../data/capitals-de.json")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data && typeof data === "object" ? data : null))
    .catch(() => null);

  return capitalMapPromise;
}

function loadCountryNameMap() {
  if (countryNameMapPromise) return countryNameMapPromise;

  countryNameMapPromise = fetch("../data/country-names-de.json")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => (data && typeof data === "object" ? data : null))
    .catch(() => null);

  return countryNameMapPromise;
}

// liest die Auswahl-Daten aus dem SVG-Pfad
function getSelection(path) {
  const name = path.dataset.countryName?.trim();
  const code = path.dataset.countryCode?.trim();
  const key = path.dataset.countryKey?.trim();
  const label =
    path.dataset.countryLabel?.trim() || name || code || key || "";

  if (!label) return null;

  return { name, code, key: key || label, label };
}

// ordnet Fehler einer UI-Meldung zu
function mapError(err) {
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (isOffline) {
    return {
      title: "Offline",
      detail: "Keine Internetverbindung. Bitte Verbindung prüfen.",
    };
  }

  const status = err?.status;
  if (status === 404) {
    return {
      title: "Nicht gefunden",
      detail: "Für dieses Land gibt es keine Daten.",
    };
  }
  if (status === 429) {
    return {
      title: "Rate Limit",
      detail: "Zu viele Anfragen. Bitte später erneut versuchen.",
    };
  }
  if (status) {
    return {
      title: `Fehler ${status}`,
      detail: "Bitte später erneut versuchen.",
    };
  }

  return {
    title: "Netzwerkfehler",
    detail: "Bitte Verbindung prüfen.",
  };
}

// löst eine Auswahl zu Länderdaten auf (Cache/API)
async function resolveCountry(selection) {
  const cacheKey = selection.code
    ? `code:${selection.code}`
    : `name:${selection.name}`;

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let country = null;

  if (selection.code) {
    try {
      country = await fetchCountryByCode(selection.code);
    } catch (err) {
      if (err?.status !== 404 || !selection.name) throw err;
    }
  }

  if (!country && selection.name) {
    const results = await fetchCountriesByName(selection.name);
    country = pickBestMatch(selection.name, results);
  }

  if (country) {
    cache.set(cacheKey, country);
    if (selection.name) cache.set(`name:${selection.name}`, country);
    if (selection.code) cache.set(`code:${selection.code}`, country);
  }

  return country;
}

// verarbeitet die Auswahl und aktualisiert die UI
async function handleSelection(path, ui, mapWrapper) {
  const selection = getSelection(path);
  if (!selection) return;

  activePath = path;
  const capitalMapRequest = loadCapitalMap();
  // UI auf "Lade Daten..." setzen
  setActiveCountry(selection.key);
  setPopoverOpen(ui, true);
  setPanelState(ui, "loading", `Lade Daten für ${selection.label}...`);
  setText(ui.name, selection.label);
  setText(ui.region, "Lade Daten...");
  setText(ui.flag, "🌍");
  clearDetails(ui);
  positionPopover(ui, mapWrapper, path);

  // Request-ID für parallele Klicks hochzählen
  const requestId = ++activeRequestId;

  try {
    const country = await resolveCountry(selection);
    // nur das letzte Ergebnis anzeigen
    if (requestId !== activeRequestId) return;

    if (!country) {
      setPanelState(ui, "error", "Land nicht gefunden.");
      setText(ui.region, "Keine Daten verfügbar.");
      positionPopover(ui, mapWrapper, path);
      return;
    }

    const localizedCapitals = await capitalMapRequest;
    if (requestId !== activeRequestId) return;

    renderCountry(ui, country, localizedCapitals);
    setPanelState(ui, "ready");
    positionPopover(ui, mapWrapper, path);
  } catch (err) {
    // nur das letzte Ergebnis anzeigen
    if (requestId !== activeRequestId) return;
    const { title, detail } = mapError(err);
    setPanelState(ui, "error", `${title}: ${detail}`);
    setText(ui.region, "Keine Daten verfügbar.");
    positionPopover(ui, mapWrapper, path);
  }
}

// initialisiert UI, Index und Event-Listener
function init() {
  const ui = getUi();
  const svg = document.getElementById("world-map");
  const mapWrapper = svg?.closest(".map-wrapper");
  const mapSection = mapWrapper?.closest(".map-section");
  if (!ui?.panel || !svg || !mapWrapper || !mapSection) return;

  countryIndex = buildCountryIndex(svg);
  loadCapitalMap();
  loadCountryNameMap().then((map) => applyCountryLabels(countryIndex, map));

  svg.addEventListener("click", (event) => {
    const targetPath = event.target.closest("path");
    if (!targetPath) return;
    handleSelection(targetPath, ui, mapWrapper);
  });

  svg.addEventListener("mousemove", (event) => {
    const targetPath = event.target.closest("path");
    if (!targetPath) {
      if (activeTooltipKey) hideTooltip(ui);
      activeTooltipKey = null;
      return;
    }

    const selection = getSelection(targetPath);
    if (!selection) {
      if (activeTooltipKey) hideTooltip(ui);
      activeTooltipKey = null;
      return;
    }

    if (activeTooltipKey !== selection.key) {
      showTooltip(ui, selection.label);
      activeTooltipKey = selection.key;
    }

    positionTooltip(ui, mapSection, event.clientX, event.clientY);
  });

  svg.addEventListener("mouseleave", () => {
    if (activeTooltipKey) hideTooltip(ui);
    activeTooltipKey = null;
  });

  document.addEventListener("click", (event) => {
    if (ui.panel.dataset.open !== "true") return;
    const target = event.target;
    if (ui.panel.contains(target)) return;
    if (target.closest("path")) return;
    closePopover(ui);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (ui.panel.dataset.open !== "true") return;
    closePopover(ui);
  });

  window.addEventListener("resize", () => {
    if (ui.panel.dataset.open !== "true" || !activePath) return;
    positionPopover(ui, mapWrapper, activePath);
  });
}

// starten wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", init);
