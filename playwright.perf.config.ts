import base from "./playwright.config";

/** Pruebas de rendimiento con JSON grandes: `npm run test:perf` (tardan; no van en test:e2e). */
export default {
  ...base,
  testMatch: "**/*.perf.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 600_000,
};
