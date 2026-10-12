import { expect, test } from "@playwright/test";
import { judicialDistribution } from "../judicial-fixtures";
import { referenceReport } from "../jurimetry-fixtures";
import type { components } from "../../contracts/generated/api";

test("jurimetria judicial: tribunal → órgão → relator, classes por código e variantes de nome", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      errors.push(message.text());
  });
  let queries = 0;
  await page.route("**/api/v1/jurimetry/references/query", async (route) => {
    queries++;
    const query = route.request().postDataJSON();
    const { publications: _publications, ...report } = referenceReport(6);
    void _publications;
    await route.fulfill({
      json: {
        ...report,
        criteria: query.criteria,
        references: query.references,
        includeProposals: query.includeProposals,
        page: query.page,
        pageSize: query.pageSize,
        total: { value: 6, relation: "eq" },
        presence: {
          jurisprudentialOnly: 0,
          normativeOnly: 0,
          both: 0,
          neither: 6,
        },
        judicialDistribution: judicialDistribution(),
        items: Array.from({ length: 6 }, (_, index) => ({
          id: `judicial-test-${index}`,
          revisionId: "revision",
          textVersionId: "text",
          court: index < 4 ? "TJGO" : index === 4 ? "TJSP" : null,
          documentType: null,
          publicationDate: null,
          availabilityDate: null,
          sourceDate: null,
          processes: [],
          snippets: [],
          score: null,
        })),
      },
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/jurimetria?run=1&references=any");
  await expect(page).toHaveTitle("Oráculo · Pesquisa de publicações");
  const section = page.getByRole("region", {
    name: "Órgãos judiciais e relatores",
    exact: true,
  });
  const court = section.getByLabel("Tribunal dos órgãos judiciais", {
    exact: true,
  });
  const organ = section.getByLabel("Órgão dos relatores", { exact: true });
  await expect(court).toHaveValue(JSON.stringify("TJGO"));
  let rapporteurs = section.getByRole("region", {
    name: "Relatores · 1ª Vara",
    exact: true,
  });
  await expect(rapporteurs).toContainText("Maria Silva");
  await expect(rapporteurs).toContainText("66,7%");
  await organ.selectOption(JSON.stringify("2ª Vara"));
  await expect(
    section.getByRole("region", { name: "Relatores · 2ª Vara", exact: true }),
  ).toContainText("João Lima");
  await court.selectOption(JSON.stringify("TJSP"));
  await expect(organ).toHaveValue(JSON.stringify("1ª Vara"));
  rapporteurs = section.getByRole("region", {
    name: "Relatores · 1ª Vara",
    exact: true,
  });
  await expect(rapporteurs).toContainText("Maria Silva");
  await expect(rapporteurs).toContainText("100%");
  await expect(rapporteurs).not.toContainText("66,7%");
  const classes = section
    .getByRole("region", {
      name: "Classes processuais por código",
      exact: true,
    })
    .first();
  await expect(classes).toContainText("Apelação · Código 198");
  await expect(classes).toContainText("Apelação · Código 7");
  await expect(classes).toContainText("Classe sem nome · Código 111");
  await section
    .getByRole("button", { name: "Ver nomes por código", exact: true })
    .click();
  const names = section.locator("#judicial-class-names");
  await expect(names).toContainText("Apelação Cível");
  await expect(names.locator("tbody tr")).toHaveCount(4);
  await court.selectOption("null");
  await expect(organ).toHaveValue("null");
  await expect(section).toContainText("informação ambígua: 1");
  await expect(
    section.getByRole("region", {
      name: "Relatores · Órgão não informado",
      exact: true,
    }),
  ).not.toContainText("Maria Silva");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width <= 390) {
      const bounds = await page.locator("#reference-mode").boundingBox();
      expect(bounds?.width).toBeGreaterThanOrEqual(width - 80);
    }
  }
  expect(queries).toBe(1);
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("jurimetria judicial real: população completa, ausências e métricas estáveis entre páginas", async ({
  page,
}) => {
  const firstResponse = page.waitForResponse((response) =>
    response.url().endsWith("/jurimetry/references/query"),
  );
  await page.goto("/jurimetria?run=1&references=any&size=2");
  const first = (await (
    await firstResponse
  ).json()) as components["schemas"]["ReferencesJurimetryResponse"];
  expect(first.items).toHaveLength(2);
  expect(first.population).toBe(5);
  expect(
    first.judicialDistribution?.courts.reduce(
      (count, court) => count + court.publications,
      0,
    ),
  ).toBe(5);
  expect(first.judicialDistribution?.missingClassCode).toBe(5);
  const section = page.getByRole("region", {
    name: "Órgãos judiciais e relatores",
    exact: true,
  });
  await expect(
    section.getByLabel("Tribunal dos órgãos judiciais", { exact: true }),
  ).toHaveValue(JSON.stringify("TJGO"));
  await expect(
    section.getByLabel("Órgão dos relatores", { exact: true }),
  ).toHaveValue("null");
  const nextResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/jurimetry/references/query") &&
      response.request().postDataJSON().page === 1,
  );
  await page
    .locator("#jurimetry-publications")
    .getByRole("button", { name: "Próxima →", exact: true })
    .click();
  const next = (await (
    await nextResponse
  ).json()) as components["schemas"]["ReferencesJurimetryResponse"];
  expect(next.items).toHaveLength(2);
  expect(next.judicialDistribution).toEqual(first.judicialDistribution);
  await expect(page).toHaveURL(/page=1/);
});
