// kurzbefehle für DOM-Manipulationen
export function $(selector, root = document) {
  return root.querySelector(selector);
}
// setzt den Text-Inhalt eines Elements
export function setText(el, text) {
  if (!el) return;
  el.textContent = text;
}
// setzt das Badge-Label eines Elements
export function setBadge(el, text) {
  if (!el) return;
  el.textContent = text;
  el.title = text;
}
