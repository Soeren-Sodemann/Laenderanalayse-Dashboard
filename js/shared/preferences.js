(() => {
  const STORAGE_KEY = "dashboard.theme";
  const VALID_THEMES = new Set(["light", "dark", "system"]);
// hier wird das theme ausgelesen
  function readThemePreference() {
    let value = null;
    try {
      value = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return "system";
    }
    return VALID_THEMES.has(value) ? value : "system";
  }
// hier wird das theme gespeichert
  function writeThemePreference(value) {
    if (!VALID_THEMES.has(value)) return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (err) {
      return;
    }
  }
//  hier frage ich nach dem system theme
  function resolveSystemTheme() {
    if (typeof window === "undefined" || !window.matchMedia) return "dark";
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
// hier wird das theme angewendet
  function applyTheme(preference) {
    const root = document.documentElement;
    if (!root) return "dark";

    const resolved =
      preference === "system" ? resolveSystemTheme() : preference;
// hier wird das data-theme attribut gesetzt
    if (resolved === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
    }

    return resolved;
  }
// hier wird das theme initialisiert
  function initTheme() {
    applyTheme(readThemePreference());
  }
// hier wird auf änderungen des system themes reagiert
  function handleSystemChange() {
    if (readThemePreference() === "system") {
      applyTheme("system");
    }
  }
// hier wird der event listener für system theme änderungen hinzugefügt
  if (typeof window !== "undefined" && window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }
  }
// hier werden die funktionen exportiert
  window.preferences = {
    readThemePreference,
    writeThemePreference,
    applyTheme,
    resolveSystemTheme,
    initTheme,
  };
// hier wird das theme initial angewendet
  initTheme();
})();
