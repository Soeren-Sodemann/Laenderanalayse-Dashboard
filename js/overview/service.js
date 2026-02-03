import { WORLD_CODE, INDICATORS, GDP_GROWTH_YEARS, CONTINENTS } from "./config.js";
import {
  fetchLatestIndicator,
  fetchIndicatorForYear,
  fetchLatestSeries,
} from "./api.js";
// gibt { pop, area, gdp, latestYear } zurück
export async function getWorldKpis() {
  const [pop, area, gdp] = await Promise.all([
    fetchLatestIndicator(WORLD_CODE, INDICATORS.POPULATION),
    fetchLatestIndicator(WORLD_CODE, INDICATORS.AREA),
    fetchLatestIndicator(WORLD_CODE, INDICATORS.GDP),
  ]);
// bestimmt das neueste Jahr unter den KPIs
  const latestYear = pop?.year ?? area?.year ?? gdp?.year ?? null;

  return { pop, area, gdp, latestYear };
}
// holt pop nach Kontinenten für ein Jahr
export async function getPopulationByContinents(year) {
  if (!year) return [];
// holt die Werte für alle Kontinente parallel
  const values = await Promise.all(
    CONTINENTS.map(async (continent) => {
      const value = await fetchIndicatorForYear(continent.code, INDICATORS.POPULATION, year);
      return value == null ? null : { label: continent.label, value };
    })
  );
// filtert null-Werte heraus und sortiert absteigend nach Wert
  return values.filter(Boolean).sort((a, b) => b.value - a.value);
}
// gibt die BIP-Wachstumsserie zurück [{year, value}]
export async function getGdpGrowthSeries() {
  return fetchLatestSeries(WORLD_CODE, INDICATORS.GDP_GROWTH, GDP_GROWTH_YEARS);
}
