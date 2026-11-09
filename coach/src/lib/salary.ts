/**
 * Simplified take-home pay calculators for a single person, no pension, no benefits in kind.
 * Rates are approximations for the 2026 tax year — VERIFY each year:
 *  - Ireland: revenue.ie (income tax bands/credits, USC, PRSI)
 *  - UK: gov.uk/income-tax-rates (Scotland: gov.scot), National Insurance class 1
 * Rents and living costs are rough monthly estimates for a 1-bed flat — edit them in the UI.
 */

export interface City {
  id: string;
  name: string;
  country: "IE" | "UK-ENG" | "UK-SCO";
  currency: "EUR" | "GBP";
  rent: number;
  living: number;
}

export const CITIES: City[] = [
  { id: "dublin", name: "Dublin", country: "IE", currency: "EUR", rent: 2100, living: 950 },
  { id: "cork", name: "Cork", country: "IE", currency: "EUR", rent: 1600, living: 850 },
  { id: "galway", name: "Galway", country: "IE", currency: "EUR", rent: 1500, living: 850 },
  { id: "limerick", name: "Limerick", country: "IE", currency: "EUR", rent: 1300, living: 800 },
  { id: "london", name: "London", country: "UK-ENG", currency: "GBP", rent: 2000, living: 950 },
  { id: "manchester", name: "Manchester", country: "UK-ENG", currency: "GBP", rent: 1150, living: 750 },
  { id: "birmingham", name: "Birmingham", country: "UK-ENG", currency: "GBP", rent: 1000, living: 700 },
  { id: "belfast", name: "Belfast", country: "UK-ENG", currency: "GBP", rent: 950, living: 700 },
  { id: "edinburgh", name: "Edinburgh", country: "UK-SCO", currency: "GBP", rent: 1300, living: 750 },
];

export const TAX_YEAR_NOTE = "Approximate 2026 rates (single person, no pension). Verify on revenue.ie / gov.uk.";

function bands(income: number, list: [number, number][]) {
  // list of [upperLimit, rate]; last upper = Infinity
  let tax = 0;
  let lower = 0;
  for (const [upper, rate] of list) {
    if (income <= lower) break;
    tax += (Math.min(income, upper) - lower) * rate;
    lower = upper;
  }
  return tax;
}

export function irelandNet(gross: number) {
  const incomeTax = Math.max(0, bands(gross, [[44000, 0.2], [Infinity, 0.4]]) - 4000); // personal + employee credits
  const usc = gross <= 13000 ? 0 : bands(gross, [[12012, 0.005], [28700, 0.02], [70044, 0.03], [Infinity, 0.08]]);
  const prsi = gross > 18304 ? gross * 0.042 : 0;
  const total = incomeTax + usc + prsi;
  return { incomeTax, other: usc + prsi, otherLabel: "USC + PRSI", total, net: gross - total };
}

export function ukNet(gross: number, scotland = false) {
  // Personal allowance tapers away above £100k
  const pa = Math.max(0, 12570 - Math.max(0, gross - 100000) / 2);
  const taxable = Math.max(0, gross - pa);
  const incomeTax = scotland
    ? bands(taxable, [[2827, 0.19], [14921, 0.2], [31092, 0.21], [62430, 0.42], [112570, 0.45], [Infinity, 0.48]])
    : bands(taxable, [[37700, 0.2], [112570, 0.4], [Infinity, 0.45]]);
  const ni = bands(Math.max(0, gross - 12570), [[50270 - 12570, 0.08], [Infinity, 0.02]]);
  const total = incomeTax + ni;
  return { incomeTax, other: ni, otherLabel: "National Insurance", total, net: gross - total };
}

export function takeHome(gross: number, city: City) {
  return city.country === "IE" ? irelandNet(gross) : ukNet(gross, city.country === "UK-SCO");
}

/** Visa salary floors (2026) for a quick sanity check. */
export const VISA_FLOORS = {
  IE: { amount: 40904, label: "Ireland Critical Skills (with relevant degree)" },
  UK: { amount: 54700, label: "UK Skilled Worker going rate — SOC 2134 programmers" },
};
