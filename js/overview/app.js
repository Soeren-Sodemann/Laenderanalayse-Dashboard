import { LOCALE } from "./config.js";
import { $, setBadge } from "../shared/dom.js";
import { formatNumber, formatPercent } from "../shared/formatters.js";
import {
  setKpiLoading,
  setKpiError,
  renderKpi,
  renderPanelLoading,
  renderPanelEmpty,
  renderPanelError,
  renderListInPanel,
} from "./ui.js";
import {
  getWorldKpis,
  getPopulationByContinents,
  getGdpGrowthSeries,
} from "./service.js";
// holt die UI-Elemente
function getUi() {
  return {
    // KPI Elemente
    populationValue: $("#population-value"),
    areaValue: $("#area-value"),
    gdpValue: $("#gdp-value"),
    // KPI Badges
    populationBadge: $("#population-badge"),
    areaBadge: $("#area-badge"),
    gdpBadge: $("#gdp-badge"),
    // Panel Badges
    populationChartBadge: $("#population-chart-badge"),
    gdpChartBadge: $("#gdp-chart-badge"),
    // Panels
    populationPanel: $("#population-panel"),
    gdpPanel: $("#gdp-panel"),
  };
}
// erstellt die HTML-Liste für die Bevölkerungsverteilung
function buildPopulationListHtml(results) {
  const total = results.reduce((sum, result) => sum + result.value, 0);

  return `
    <ul class="list">
      ${results
        .map((result) => {
          const pct = total ? (result.value / total) * 100 : 0;
          return `
            <li class="list-row">
              <span class="label">${result.label}</span>
              <span class="value">
                ${formatNumber(result.value, LOCALE)}
                <span class="muted">(${formatPercent(pct, LOCALE)})</span>
              </span>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}
// erstellt die HTML-Liste für das BIP-Wachstum
function buildGdpGrowthListHtml(series) {
  return `
    <ul class="list">
      ${series
        .map((datapoint) => {
          const sign = datapoint.value > 0 ? "+" : "";
          return `
            <li class="list-row">
              <span class="label">${datapoint.year}</span>
              <span class="value">${sign}${formatPercent(datapoint.value, LOCALE)}</span>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}
// ordnet Fehler einem UI-Text zu
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
      detail: "Die angeforderten Daten sind aktuell nicht verfügbar.",
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
// Initialisiert die App und lädt die Daten
async function init() {
  const ui = getUi();

  try {
    // KPIs auf "Lädt…" setzen
    setKpiLoading(ui);

    // KPIs laden
    const { pop, area, gdp, latestYear } = await getWorldKpis();
   // KPIs rendern
    renderKpi(ui, {
      valueEl: ui.populationValue,
      badgeEl: ui.populationBadge,
      valueText: pop ? formatNumber(pop.value, LOCALE) : "—",
      year: pop?.year,
    });
    // Area KPI rendern
    renderKpi(ui, {
      valueEl: ui.areaValue,
      badgeEl: ui.areaBadge,
      valueText: area ? formatNumber(area.value, LOCALE) : "—",
      year: area?.year,
    });
    // GDP KPI rendern
    renderKpi(ui, {
      valueEl: ui.gdpValue,
      badgeEl: ui.gdpBadge,
      valueText: gdp ? formatNumber(gdp.value, LOCALE) : "—",
      year: gdp?.year,
    });

    // Population Panel rendern
    renderPanelLoading(ui.populationPanel);
    setBadge(ui.populationChartBadge, latestYear ? `Stand: ${latestYear}` : "Stand: —");

    const continentResults = await getPopulationByContinents(latestYear);
    if (continentResults.length === 0) {
      renderPanelEmpty(ui.populationPanel);
    } else {
      renderListInPanel(ui.populationPanel, buildPopulationListHtml(continentResults));
    }

    // GDP Growth Panel rendern
    renderPanelLoading(ui.gdpPanel);
    const series = await getGdpGrowthSeries();

    if (series.length === 0) {
      setBadge(ui.gdpChartBadge, "");
      renderPanelEmpty(ui.gdpPanel);
    } else {
      // Jahresbereich im Badge setzen
      const start = series[0].year;
      const end = series[series.length - 1].year;
      setBadge(ui.gdpChartBadge, `Jahre: ${start}–${end}`);
      renderListInPanel(ui.gdpPanel, buildGdpGrowthListHtml(series));
    }
  } catch (err) {
    // Fehlerbehandlung
    console.error(err);
    const { title, detail } = mapError(err);
    // KPIs auf Fehler setzen
    setKpiError(ui);
    setBadge(ui.populationChartBadge, "Fehler");
    setBadge(ui.gdpChartBadge, "Fehler");
    renderPanelError(ui.populationPanel, { title, detail });
    renderPanelError(ui.gdpPanel, { title, detail });
  }
}
// starten wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", init);
