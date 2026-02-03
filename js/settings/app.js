(() => {
    // hier wird das select element geholt
  const themeSelect = document.getElementById("theme-select");
  if (!themeSelect || !window.preferences) return;
// hier werden die funktionen aus preferences.js geholt
  const { readThemePreference, writeThemePreference, applyTheme } =
    window.preferences;
// hier wird der aktuelle wert im select element gesetzt
  themeSelect.value = readThemePreference();
// hier wird auf änderungen des select elements reagiert
  themeSelect.addEventListener("change", () => {
    const nextTheme = themeSelect.value;
    writeThemePreference(nextTheme);
    applyTheme(nextTheme);
  });
})();
