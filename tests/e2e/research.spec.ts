import { expect, test } from "@playwright/test";
test("prévias de referências: hover, teclado, saída e navegação preservada", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/publicacoes/pub-001?q=dano+moral");
  const text = page.locator(".publication-text");
  const citation = text
    .getByRole("link", { name: /Referência jurisprudencial/ })
    .first();
  const normative = text
    .getByRole("link", { name: /Referência normativa/ })
    .first();
  const preview = page.getByRole("tooltip");
  await expect(citation).toBeVisible();
  await expect(preview).toHaveCount(0);
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      requests.push(request.url());
  });
  await citation.hover();
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Súmula 7");
  await expect(preview).toContainText("Trecho da publicação");
  await expect(preview).toContainText("Proposta não validada");
  const linkBounds = await citation.boundingBox();
  const cardBounds = await preview.boundingBox();
  expect(cardBounds!.y).toBeGreaterThanOrEqual(
    linkBounds!.y + linkBounds!.height,
  );
  await preview.hover();
  await expect(preview).toBeVisible();
  await page.screenshot({ path: "/tmp/oraculo-reference-hover-desktop.png" });
  await page.mouse.move(5, 5);
  await expect(preview).toHaveCount(0);
  await normative.focus();
  await expect(preview).toBeVisible();
  await expect(preview).toContainText("Referência normativa");
  await expect(preview).toContainText("Art. 5");
  await expect(normative).toHaveAttribute(
    "aria-describedby",
    (await preview.getAttribute("id")) as string,
  );
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await expect(normative).toBeFocused();
  expect(requests).toEqual([]);
  await citation.focus();
  await expect(preview).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(preview).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/publicacoes/pub-001?q=dano+moral");
  await expect(citation).toBeVisible();
  await citation.focus();
  await expect(preview).toBeVisible();
  const mobileCard = await preview.boundingBox();
  expect(mobileCard!.x).toBeGreaterThanOrEqual(0);
  expect(mobileCard!.x + mobileCard!.width).toBeLessThanOrEqual(320);
  expect(mobileCard!.y + mobileCard!.height).toBeLessThanOrEqual(844);
  await page.screenshot({ path: "/tmp/oraculo-reference-hover-mobile.png" });
  await page.keyboard.press("Escape");
  await normative.click();
  await expect(preview).toHaveCount(0);
  await expect(
    page.locator(".reference-row").filter({
      has: page.getByRole("heading", {
        name: "Art. 5",
        exact: true,
      }),
    }),
  ).toBeFocused();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("q") === "dano moral" && !!url.hash,
  );
  expect(errors).toEqual([]);
});

test("busca real, URL, detalhe seguro, jurimetria e estado vazio", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Oráculo · Pesquisa de publicações");
  await expect(
    page.getByRole("heading", { name: "Pesquisa de publicações" }),
  ).toBeVisible();
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
  await page.getByLabel("Texto da pesquisa").fill("dano moral");
  await page.getByRole("button", { name: "Pesquisar", exact: false }).click();
  await expect(page).toHaveURL(/q=dano/);
  await expect(page.locator(".publication-row").first()).toBeVisible();
  await page
    .getByLabel("Publicações por página")
    .selectOption({ label: "2 por página" });
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Próxima →" }).click();
  await expect(page.getByText("Página 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "← Anterior" }).click();
  await expect(page.getByText("Página 1", { exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/oraculo-search-desktop.png",
    fullPage: false,
  });
  await page
    .locator(".publication-row")
    .first()
    .getByRole("link", { name: /Ler publicação/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Texto da publicação" }),
  ).toBeVisible();
  await page.goto("/publicacoes/pub-001?q=dano+moral");
  await expect(
    page.getByRole("heading", { name: "Texto da publicação" }),
  ).toBeVisible();
  await expect(page.locator(".publication-text")).not.toContainText(
    '<script>alert("xss")</script>',
  );
  expect(await page.locator(".publication-text script").count()).toBe(0);
  await expect(
    page.getByText("Proposta não validada", { exact: true }).first(),
  ).toBeVisible();
  const jurisprudentialLink = page
    .locator(".publication-text")
    .getByRole("link", { name: /Referência jurisprudencial/ });
  await expect(jurisprudentialLink.first()).toHaveText("Súmula 7");
  await jurisprudentialLink.first().click();
  const citation = page.locator(".reference-row").filter({
    has: page.getByRole("heading", { name: "Súmula 7", exact: true }),
  });
  await expect(citation).toBeFocused();
  await expect(page).toHaveURL(
    (url) => url.searchParams.get("q") === "dano moral" && !!url.hash,
  );
  await citation
    .getByRole("link", { name: "Ver no texto da publicação" })
    .click();
  await expect(
    page.locator(".publication-text").locator(":focus"),
  ).toBeVisible();
  const normativeLink = page
    .locator(".publication-text")
    .getByRole("link", { name: /Referência normativa/ });
  await expect(normativeLink.first()).toHaveText("Art. 5");
  await normativeLink.first().click();
  await expect(
    page.locator(".reference-row").filter({
      has: page.getByRole("heading", {
        name: "Art. 5",
        exact: true,
      }),
    }),
  ).toBeFocused();
  await page.reload();
  await expect(
    page.locator(".reference-row").filter({
      has: page.getByRole("heading", {
        name: "Art. 5",
        exact: true,
      }),
    }),
  ).toBeFocused();
  await page
    .getByRole("navigation", { name: "Seções da publicação" })
    .getByRole("link", { name: "Atos e classificações" })
    .click();
  await expect(page).toHaveURL(
    (url) =>
      url.pathname === "/publicacoes/pub-001" &&
      url.searchParams.get("q") === "dano moral" &&
      url.hash === "#outputs-selecionados",
  );
  await expect(page.locator("#outputs-selecionados")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/oraculo-detail-desktop.png",
    fullPage: false,
  });
  await page.getByRole("link", { name: "Voltar à pesquisa" }).click();
  await expect(page.getByLabel("Texto da pesquisa")).toHaveValue("dano moral");
  await page.getByRole("button", { name: "Jurimetria do recorte" }).click();
  await expect(
    page.getByRole("heading", { name: "Distribuição do recorte" }),
  ).toBeVisible();
  await expect(page.locator(".population-number")).toBeVisible();
  await expect(page.locator(".distribution table").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Indicadores decisórios indisponíveis" }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/oraculo-jurimetry-desktop.png",
    fullPage: false,
  });
  await page
    .getByLabel("Texto da pesquisa")
    .fill("termoinevitavelmenteinexistente987654");
  await page.getByRole("button", { name: "Pesquisar", exact: false }).click();
  await page.getByRole("button", { name: "Publicações", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum resultado neste recorte" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Pesquisa de publicações" }),
  ).toBeVisible();
  await expect(page.locator(".publication-row").first()).toBeVisible();
  await expect(page.locator("#filter-fields")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/oraculo-search-mobile.png",
    fullPage: false,
  });
  expect(errors).toEqual([]);
});

test("filtros do recorte, remoção e painel mobile preservam a pesquisa", async ({
  page,
}) => {
  await page.goto("/");
  const rail = page.getByRole("complementary", { name: "Filtros de pesquisa" });
  await rail.getByRole("checkbox", { name: /TJSP/ }).check();
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/courts=TJSP/);
  await expect(page.locator(".publication-row")).toHaveCount(1);
  await expect(page.locator(".publication-row").first()).toContainText("TJSP");
  await page
    .getByRole("button", { name: "Remover filtro: TJSP", exact: true })
    .click();
  await expect(page).not.toHaveURL(/courts=/);
  await expect(page.locator(".publication-row")).toHaveCount(5);
  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = rail.getByRole("button", { name: /^Filtros/ });
  await expect(page.locator("#filter-fields")).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByLabel("Buscar tribunal", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Buscar tribunal", { exact: true }).fill("TJSP");
  await rail.getByRole("checkbox", { name: /TJSP/ }).check();
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.locator("#filter-fields")).not.toBeVisible();
  await expect(page.locator("#results-plane")).toBeFocused();
  await expect(page.locator(".publication-row")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Remover filtro: TJSP", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("rascunho, cancelamento e limpeza dos filtros preservam a busca", async ({
  page,
}) => {
  await page.goto("/?q=dano+moral&mode=lexical&size=2&sort=date_desc");
  await expect(page.locator(".publication-row")).toHaveCount(2);
  const rail = page.getByRole("complementary", { name: "Filtros de pesquisa" });
  await rail.getByRole("checkbox", { name: /TJGO/ }).check();
  await expect(
    rail.getByText("Há alterações de filtros para aplicar."),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/courts=/);
  await rail.getByRole("button", { name: "Cancelar alterações" }).click();
  await expect(rail.getByRole("checkbox", { name: /TJGO/ })).not.toBeChecked();
  await rail.getByRole("checkbox", { name: /TJGO/ }).check();
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(/courts=TJGO/);
  await expect(
    rail.getByRole("button", { name: "Limpar filtros" }),
  ).toBeEnabled();
  await rail.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).toHaveURL(
    (url) =>
      !url.searchParams.has("courts") &&
      url.searchParams.get("q") === "dano moral" &&
      url.searchParams.get("mode") === "lexical" &&
      url.searchParams.get("size") === "2" &&
      url.searchParams.get("sort") === "date_desc",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await rail.getByRole("button", { name: /^Filtros/ }).click();
  await rail.getByRole("checkbox", { name: /TJGO/ }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator("#filter-fields")).not.toBeVisible();
  await rail.getByRole("button", { name: /^Filtros/ }).click();
  await expect(rail.getByRole("checkbox", { name: /TJGO/ })).not.toBeChecked();
});

test("período personalizado exige as duas datas antes de aplicar", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".publication-row").first()).toBeVisible();
  const rail = page.getByRole("complementary", { name: "Filtros de pesquisa" });
  await rail.getByLabel("Intervalo de datas").selectOption("custom");
  await rail.getByLabel("De", { exact: true }).fill("2026-10-01");
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(rail.getByRole("alert")).toContainText(
    "Informe a data inicial e a data final",
  );
  await expect(page).not.toHaveURL(/from=/);
  await rail.getByLabel("Até", { exact: true }).fill("2026-10-11");
  await rail.getByLabel("Datas ausentes").selectOption("only");
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(rail.getByRole("alert")).toContainText("Todo o período");
  await expect(page).not.toHaveURL(/from=/);
  await expect(rail.getByLabel("De", { exact: true })).toHaveValue(
    "2026-10-01",
  );
  await rail.getByLabel("Datas ausentes").selectOption("exclude");
  await rail.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page).toHaveURL(
    (url) =>
      url.searchParams.get("from") === "2026-10-01" &&
      url.searchParams.get("to") === "2026-10-11",
  );
});
