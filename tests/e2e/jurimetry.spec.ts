import { expect, test } from "@playwright/test";
import { referenceReport } from "../jurimetry-fixtures";

test("jurimetria: apresenta contagens acima de mil e preserva páginas profundas", async ({
  page,
}) => {
  const requested: number[] = [];
  await page.route("**/api/v1/jurimetry/references/query", async (route) => {
    const query = route.request().postDataJSON();
    requested.push(query.page);
    const { publications: _publications, ...report } = referenceReport(25001);
    void _publications;
    await route.fulfill({
      json: {
        ...report,
        criteria: query.criteria,
        page: query.page,
        pageSize: query.pageSize,
        references: query.references,
        includeProposals: query.includeProposals,
        items: [],
        total: { value: 25001, relation: "eq" },
        hasMore: true,
      },
    });
  });
  await page.goto("/jurimetria?run=1&references=any&size=10&page=1001");
  await expect(page.getByLabel("Referências nos documentos")).toHaveValue(
    "any",
  );
  await expect(page.locator(".jurimetry-population")).toHaveText("25.001");
  await expect(page.getByText("Página 1002", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Próxima →" }).click();
  await expect(page).toHaveURL(/page=1002/);
  await expect(page.getByText("Página 1003", { exact: true })).toBeVisible();
  expect(requested).toEqual([1001, 1002]);
});

test("jurimetria: recorte completo, plots, refino por barra e retorno do documento", async ({
  page,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().includes("/jurimetry/references/query"))
      requests.push(request.url());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/jurimetria");
  await expect(page).toHaveTitle("Oráculo · Pesquisa de publicações");
  await expect(
    page.getByRole("heading", { name: "Prepare um recorte" }),
  ).toBeVisible();
  expect(requests).toEqual([]);
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
  await page
    .getByRole("button", { name: "Consultar recorte", exact: true })
    .click();
  await expect(page.locator(".jurimetry-population")).toHaveText("1");
  await expect(page.locator(".publication-row")).toHaveCount(1);
  const presence = page.getByRole("region", {
    name: "Presença de referências",
    exact: true,
  });
  await expect(presence).toContainText("Ambas as famílias");
  await expect(page.getByRole("img", { name: /Volume por mês/ })).toBeVisible();
  const ranking = page.getByRole("region", {
    name: "Referências mais frequentes",
    exact: true,
  });
  await expect(ranking).toContainText("Jurisprudência: Súmula 7");
  await expect(ranking).toContainText("Normativa: Art. 5");
  await expect(ranking).not.toContainText("sumula:unknown:7");
  await expect(ranking).not.toContainText("provision|?|article:5");
  await expect(ranking).not.toContainText("Outros valores:");
  await ranking
    .getByRole("button", { name: /Filtrar/ })
    .count()
    .then((value) => expect(value).toBe(0));
  await page.screenshot({
    path: "/tmp/oraculo-jurimetry-reference-desktop.png",
  });
  await page
    .getByText("Publicações e menções por referência", { exact: true })
    .click();
  const referenceTable = page.getByRole("table", {
    name: "Frequência das referências: publicações únicas e ocorrências admitidas",
  });
  await expect(referenceTable).toContainText("Jurisprudência: Súmula 7");
  await expect(referenceTable).not.toContainText("sumula:unknown:7");
  await expect(referenceTable).not.toContainText("provision|?|article:5");
  await page
    .getByRole("region", { name: "Publicações por tribunal", exact: true })
    .getByRole("button", { name: /^Filtrar por TJGO:/ })
    .click();
  await expect(page).toHaveURL(/courts=TJGO/);
  await expect(page.locator(".jurimetry-population")).toHaveText("1");
  await page.getByRole("button", { name: "Ver publicações →" }).click();
  await expect(page.locator("#jurimetry-publications")).toBeFocused();
  await page
    .locator(".publication-row")
    .first()
    .getByRole("link", { name: /Ler publicação/ })
    .click();
  await expect(page).toHaveURL(/returnTo=jurimetria/);
  await expect(
    page.getByRole("heading", { name: "Texto da publicação", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar à jurimetria" }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/jurimetria" &&
      url.searchParams.get("courts") === "TJGO",
  );
  await expect(page.locator(".jurimetry-population")).toHaveText("1");
  expect(errors).toEqual([]);
});

test("jurimetria: famílias, validação, paginação e URL fora do intervalo", async ({
  page,
}) => {
  await page.goto("/jurimetria?run=1&references=both");
  await expect(page.getByLabel("Referências nos documentos")).toHaveValue(
    "both",
  );
  await expect(page.locator(".jurimetry-population")).toHaveText("1");
  for (const mode of ["jurisprudential", "normative", "both"] as const) {
    await page.getByLabel("Referências nos documentos").selectOption(mode);
    await page
      .getByRole("button", { name: "Consultar recorte", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("references") === mode,
    );
    await expect(page.locator(".jurimetry-population")).toHaveText("1");
  }
  await page.getByLabel("Referências nos documentos").selectOption("any");
  await page
    .getByRole("button", { name: "Consultar recorte", exact: true })
    .click();
  await expect(page.locator(".jurimetry-population")).toHaveText("5");
  await page.getByLabel("Publicações por página").selectOption("2");
  await expect(page.locator(".publication-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Próxima →" }).click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.locator(".publication-row")).toHaveCount(2);
  await expect(page.locator(".jurimetry-population")).toHaveText("5");
  await page.goto("/jurimetria?run=1&references=any&size=2&page=999");
  await expect(page).toHaveURL((url) => !url.searchParams.has("page"));
  await expect(page.locator(".publication-row")).toHaveCount(2);
  await page.getByLabel("Referências nos documentos").selectOption("both");
  await page.getByLabel("Incluir menções não validadas").uncheck();
  await page
    .getByRole("button", { name: "Consultar recorte", exact: true })
    .click();
  await expect(page).toHaveURL(/unvalidated=false/);
  await expect(page.locator(".jurimetry-population")).toHaveText("0");
  await expect(page.locator(".publication-row")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Nenhum resultado neste recorte" }),
  ).toBeVisible();
  expect(await page.locator("#jurimetry-results").innerHTML()).not.toMatch(
    /NaN|Infinity/,
  );
});

test("jurimetria mobile: filtros compartilhados, layout e valores acessíveis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/jurimetria?run=1&references=both");
  await expect(page.locator(".jurimetry-population")).toHaveText("1");
  await expect(page.locator("#jurimetry-filter-fields")).toBeHidden();
  const rail = page.getByRole("complementary", {
    name: "Filtros de jurimetria",
  });
  await rail.getByRole("button", { name: /^Filtros/ }).click();
  await rail.getByLabel("Intervalo de datas").selectOption("last7");
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/from=/);
  await expect(page.locator("#jurimetry-filter-fields")).toBeHidden();
  await expect(page.locator(".jurimetry-population")).toHaveText("1");
  const presence = page.getByRole("region", {
    name: "Presença de referências",
    exact: true,
  });
  await presence.getByText(/Ver tabela com/).click();
  await expect(presence.getByRole("table")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/oraculo-jurimetry-reference-mobile.png",
  });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "overflow at " + width,
    ).toBe(true);
  }
});
