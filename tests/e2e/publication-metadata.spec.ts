import { expect, test } from "@playwright/test";
import type { components } from "../../contracts/generated/api";

test("detalhe: cinco metadados da fonte e estados ausente/ambíguo", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let uncertain = false;
  await page.route("**/api/v1/publications/pub-001", async (route) => {
    const response = await route.fetch();
    const body =
      (await response.json()) as components["schemas"]["DetailResponse"];
    body.metadata = {
      rapporteur: uncertain ? null : "Maria Silva",
      rapporteurStatus: uncertain ? "ambiguous" : "available",
      organName: "2ª Câmara Cível",
      className: "Apelação Cível",
      documentType: "Acórdão",
      instanceDegree: uncertain ? null : "2º grau",
      instanceDegreeStatus: uncertain ? "absent" : "available",
    };
    await route.fulfill({ json: body });
  });
  await page.goto("/publicacoes/pub-001");
  const metadata = page.getByRole("region", { name: "Dados da publicação" });
  await expect(metadata).toContainText("Maria Silva");
  await expect(metadata).toContainText("2ª Câmara Cível");
  await expect(metadata).toContainText("Apelação Cível");
  await expect(metadata).toContainText("Acórdão");
  await expect(page.locator(".detail-heading > p").first()).toContainText(
    "Acórdão",
  );
  await expect(metadata).toContainText("2º grau");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  uncertain = true;
  await page.reload();
  await expect(metadata).toContainText("Informação ambígua na fonte");
  await expect(metadata).toContainText("Não informado");
  await expect(metadata).not.toContainText("Maria Silva");
  expect(errors).toEqual([]);
});

test("publicidade: seleção, URL, chips, pesquisa e jurimetria respeitam o acesso", async ({
  page,
}) => {
  const requests: { path: string; visibility: string | undefined }[] = [];
  page.on("request", (request) => {
    if (request.method() !== "POST" || !request.url().includes("/api/v1/"))
      return;
    const body = request.postDataJSON();
    if (body.criteria)
      requests.push({
        path: new URL(request.url()).pathname,
        visibility: body.criteria.visibility,
      });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/?q=dano+moral");
  const visibility = page.getByLabel("Publicidade do processo", {
    exact: true,
  });
  await expect(page.locator(".publication-row")).toHaveCount(3);
  await expect(visibility).toHaveValue("both");
  await visibility.selectOption("public");
  const publicResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/publications/search") &&
      response.request().postDataJSON().criteria.visibility === "public",
  );
  await page
    .getByRole("button", { name: "Aplicar filtros", exact: true })
    .click();
  await expect(page).toHaveURL(/visibility=public/);
  await publicResponse;
  await expect(page.locator("#results-plane")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator(".publication-row")).toHaveCount(3);
  await visibility.selectOption("restricted");
  await page
    .getByRole("button", { name: "Aplicar filtros", exact: true })
    .click();
  await expect(page).toHaveURL(/visibility=restricted/);
  await expect(
    page.getByRole("heading", { name: "Nenhum resultado neste recorte" }),
  ).toBeVisible();
  await expect(page.locator("#results-plane")).toContainText(
    "não estão disponíveis neste acesso",
  );
  await page.reload();
  await expect(visibility).toHaveValue("restricted");
  await page
    .getByRole("button", {
      name: "Remover filtro: Processos privados (restritos)",
      exact: true,
    })
    .click();
  await expect(page).not.toHaveURL(/visibility=/);
  await expect(visibility).toHaveValue("both");
  await expect(page.locator(".publication-row")).toHaveCount(3);
  expect(requests).toEqual(
    expect.arrayContaining([
      { path: "/api/v1/publications/search", visibility: "public" },
      { path: "/api/v1/publications/search", visibility: "restricted" },
      { path: "/api/v1/search/facets", visibility: "restricted" },
      { path: "/api/v1/jurimetry/query", visibility: "restricted" },
    ]),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/jurimetria?run=1&references=any&visibility=restricted");
  await expect(page.locator(".jurimetry-population")).toHaveText("0");
  await expect(page.locator("#jurimetry-results")).toContainText(
    "não estão disponíveis neste acesso",
  );
  await page
    .getByRole("button", { name: "Filtros", exact: false })
    .first()
    .click();
  await expect(visibility).toHaveValue("restricted");
  await visibility.selectOption("both");
  await page
    .getByRole("button", { name: "Aplicar filtros", exact: true })
    .click();
  await expect(page.locator(".jurimetry-population")).toHaveText("5");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(requests).toEqual(
    expect.arrayContaining([
      { path: "/api/v1/jurimetry/references/query", visibility: "restricted" },
      { path: "/api/v1/jurimetry/references/query", visibility: "both" },
    ]),
  );
});
