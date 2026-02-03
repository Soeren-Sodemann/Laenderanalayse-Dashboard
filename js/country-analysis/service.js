// normalisiert Namen für einen robusten Vergleich
function normalizeName(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// sammelt alle möglichen Namen/Schreibweisen eines Landes
function collectNames(country) {
  const names = new Set();
  const add = (value) => {
    if (value) names.add(value);
  };

  add(country?.name?.common);
  add(country?.name?.official);

  (country?.altSpellings ?? []).forEach(add);

  const nativeNames = country?.name?.nativeName;
  if (nativeNames) {
    Object.values(nativeNames).forEach((entry) => {
      add(entry?.common);
      add(entry?.official);
    });
  }

  const translations = country?.translations;
  if (translations) {
    Object.values(translations).forEach((entry) => {
      add(entry?.common);
      add(entry?.official);
    });
  }

  return Array.from(names);
}

// wählt den besten Treffer für einen Suchbegriff
export function pickBestMatch(query, countries) {
  if (!Array.isArray(countries) || countries.length === 0) return null;
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return countries[0];

  const directMatch = countries.find((country) =>
    collectNames(country).some(
      (candidate) => normalizeName(candidate) === normalizedQuery
    )
  );

  return directMatch ?? countries[0];
}
