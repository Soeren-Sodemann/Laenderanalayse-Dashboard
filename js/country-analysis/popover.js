// holt die Zeigerdimension aus den CSS-Variablen des Popovers
function getPointerSize(popover) {
  if (!popover) return 12;
  const raw = getComputedStyle(popover).getPropertyValue("--pointer-size");
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 12;
}

// setzt die Sichtbarkeit des Popovers
export function setPopoverOpen(ui, isOpen) {
  if (!ui?.panel) return;
  ui.panel.dataset.open = isOpen ? "true" : "false";
  ui.panel.setAttribute("aria-hidden", isOpen ? "false" : "true");
}

// positioniert das Popover relativ zum Pfad im SVG
export function positionPopover(ui, mapWrapper, path) {
  if (!ui?.panel || !mapWrapper || !path) return;
  // berechnet die Position des Popovers relativ zum Pfad
  const popover = ui.panel;
  const mapSection = mapWrapper.closest(".map-section");
  if (!mapSection) return;
  // berechnet die Position des Popovers relativ zum Pfad
  const sectionRect = mapSection.getBoundingClientRect();
  const pathRect = path.getBoundingClientRect();
  const popoverRect = popover.getBoundingClientRect();
  if (!popoverRect.width || !popoverRect.height) return;
  // setzt die Position des Popovers
  const padding = 12;
  const gap = 8;
  const pointerSize = getPointerSize(popover);
  const anchorX = pathRect.left + pathRect.width / 2;
  const anchorTop = pathRect.top;
  const anchorBottom = pathRect.bottom;
  // berechnet den verfügbaren Platz oberhalb und unterhalb des Pfads
  const spaceAbove = anchorTop - sectionRect.top - padding;
  const spaceBelow = sectionRect.bottom - anchorBottom - padding;
  // entscheidet, ob das Popover oberhalb oder unterhalb des Pfads platziert wird
  let position = "top";
  let top =
    anchorTop - sectionRect.top - popoverRect.height - pointerSize - gap;
  // wenn nicht genug Platz oben ist, unten platzieren
  if (spaceAbove < popoverRect.height + pointerSize + gap && spaceBelow > spaceAbove) {
    position = "bottom";
    top = anchorBottom - sectionRect.top + pointerSize + gap;
  }
  // stellt sicher, dass das Popover innerhalb des sichtbaren Bereichs bleibt
  const minTop = padding;
  const maxTop = sectionRect.height - popoverRect.height - padding;
  top = Math.max(minTop, Math.min(top, maxTop));
  // berechnet die horizontale Position des Popovers
  let left = anchorX - sectionRect.left - popoverRect.width / 2;
  const minLeft = padding;
  const maxLeft = sectionRect.width - popoverRect.width - padding;
  left = Math.max(minLeft, Math.min(left, maxLeft));
  // berechnet die Position des Zeigers
  const pointerPadding = 18;
  const rawPointerLeft = anchorX - sectionRect.left - left;
  const pointerLeft = Math.max(
    pointerPadding,
    Math.min(rawPointerLeft, popoverRect.width - pointerPadding)
  );
  // setzt die finalen Styles
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.dataset.position = position;
  popover.style.setProperty("--pointer-left", `${pointerLeft}px`);
}
