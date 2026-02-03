import { setText, setBadge } from "../shared/dom.js";
// setzt die KPI-Anzeige auf "Lädt…"
export function setKpiLoading(ui) {
  setText(ui.populationValue, "—");
  setText(ui.areaValue, "—");
  setText(ui.gdpValue, "—");
  setBadge(ui.populationBadge, "Stand: Lädt…");
  setBadge(ui.areaBadge, "Stand: Lädt…");
  setBadge(ui.gdpBadge, "Stand: Lädt…");
}
// setzt die KPI-Anzeige auf Fehler
export function setKpiError(ui) {
  setText(ui.populationValue, "—");
  setText(ui.areaValue, "—");
  setText(ui.gdpValue, "—");
  setBadge(ui.populationBadge, "Fehler");
  setBadge(ui.areaBadge, "Fehler");
  setBadge(ui.gdpBadge, "Fehler");
}
// rendert eine KPI-Anzeige mit Wert und Jahr
export function renderKpi(ui, { valueEl, badgeEl, valueText, year }) {
  setText(valueEl, valueText ?? "—");
  setBadge(badgeEl, year ? `Stand: ${year}` : "Stand: —");
}
// setzt ein Panel auf "Lade Daten…"
export function renderPanelLoading(panelEl) {
  renderListInPanel(panelEl, `<p class="muted">Lade Daten…</p>`);
}
// setzt ein Panel auf "Keine Daten verfügbar"
export function renderPanelEmpty(panelEl) {
  renderListInPanel(panelEl, `<p class="muted">Keine Daten verfügbar.</p>`);
}
// setzt ein Panel auf eine Fehlermeldung
export function renderPanelError(panelEl, { title, detail }) {
  renderListInPanel(
    panelEl,
    `<div class="panel-error" role="alert">
      <p class="error-text">${title}</p>
      <p class="muted">${detail}</p>
    </div>`
  );
}
// rendert eine Liste von HTML-Items in ein Panel ein
export function renderListInPanel(panelEl, itemsHtml) {
  if (!panelEl) return;

  let content = panelEl.querySelector(".panel-content");
  if (!content) {
    content = document.createElement("div");
    content.className = "panel-content";
    panelEl.appendChild(content);
  }
  content.innerHTML = itemsHtml;
}
