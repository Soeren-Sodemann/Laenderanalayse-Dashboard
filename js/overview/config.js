// Sprache
export const LOCALE = "de-DE";
// World Bank API
export const API_BASE = "https://api.worldbank.org/v2/country";
// Welt-code in der World Bank API
export const WORLD_CODE = "WLD";
// Indikatoren-codes in der World Bank API
export const INDICATORS = {
  POPULATION: "SP.POP.TOTL",        // Gesamtbevölkerung
  AREA: "AG.LND.TOTL.K2",           // Fläche in km²
  GDP: "NY.GDP.MKTP.CD",            // Bruttoinlandsprodukt in US-Dollar
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",  // BIP-Wachstum in Prozent
};
// Kontinente mit ihren World Bank API-codes
export const CONTINENTS = [
  { code: "EAS", label: "Ostasien & Pazifik" },
  { code: "SAS", label: "Südasien" },
  { code: "ECS", label: "Europa & Zentralasien" },
  { code: "LCN", label: "Lateinamerika & Karibik" },
  { code: "MEA", label: "Naher Osten & Nordafrika" },
  { code: "SSF", label: "Subsahara-Afrika" },
  { code: "NAC", label: "Nordamerika" },
];
// Anzahl Jahre für BIP-Wachstumsserie
export const GDP_GROWTH_YEARS = 7;
