const TOOLTIP_OFFSET = 12;
const TOOLTIP_PADDING = 8;
// funktion für tooltip-anzeige und positionierung
function setTooltipOpen(ui, isOpen) {
  if (!ui?.tooltip) return;
  ui.tooltip.dataset.open = isOpen ? "true" : "false";
  ui.tooltip.setAttribute("aria-hidden", isOpen ? "false" : "true");
}
// anzeige des tooltips mit text
export function showTooltip(ui, text) {
  if (!ui?.tooltip) return;
  if (!text) {
    setTooltipOpen(ui, false);
    return;
  }
// text-inhalt des tooltips setzen
  ui.tooltip.textContent = text;
  setTooltipOpen(ui, true);
}
// tooltip ausblenden
export function hideTooltip(ui) {
  if (!ui?.tooltip) return;
  setTooltipOpen(ui, false);
}
// positionierung des tooltips relativ zum container
export function positionTooltip(ui, container, x, y) {
  if (!ui?.tooltip || !container) return;
// Größe und position des containers und tooltips abrufen
  const tooltip = ui.tooltip;
  const containerRect = container.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  if (!tooltipRect.width || !tooltipRect.height) return;
// Position des tooltips berechnen
  let left = x - containerRect.left + TOOLTIP_OFFSET;
  let top = y - containerRect.top + TOOLTIP_OFFSET;
// Sicherstellen, dass der tooltip innerhalb des containers bleibt
  const maxLeft = containerRect.width - tooltipRect.width - TOOLTIP_PADDING;
  const maxTop = containerRect.height - tooltipRect.height - TOOLTIP_PADDING;
// Anpassung der Position, falls der tooltip den container überschreitet
  left = Math.max(TOOLTIP_PADDING, Math.min(left, maxLeft));
  top = Math.max(TOOLTIP_PADDING, Math.min(top, maxTop));
// Position des tooltips setzen
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
