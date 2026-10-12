import { expect, test } from "@playwright/test";

test("cards de referências: leitura simples, contexto, auditoria e retorno acessíveis", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/publicacoes/pub-001?q=dano+moral&returnTo=jurimetria");
  await expect(page).toHaveTitle("Oráculo · Pesquisa de publicações");
  const section = page.locator("#referencias-publicacao");
  const citation = section.locator(".reference-row").filter({
    has: page.getByRole("heading", { name: "Súmula 7", exact: true }),
  });
  const normative = section.locator(".reference-row").filter({
    has: page.getByRole("heading", { name: "Art. 5", exact: true }),
  });
  await expect(section.locator(".reference-row")).toHaveCount(2);
  await expect(citation.locator(".review-state")).toHaveText("A conferir");
  await expect(
    citation.getByText("sumula:unknown:7", { exact: true }),
  ).toBeHidden();
  await expect(
    normative.getByText("statute_provision", { exact: true }),
  ).toBeHidden();
  await expect(normative).toContainText("Artigo ou trecho de norma");
  await expect(normative).toContainText("Vigência não verificada");
  await expect(normative).toContainText("Não identificada");
  expect(await section.locator("script").count()).toBe(0);
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
  await page
    .locator(".publication-text")
    .getByRole("link", { name: /Referência jurisprudencial/ })
    .first()
    .click();
  await expect(citation).toBeFocused();
  await expect(citation.locator("mark")).toHaveText("Súmula 7");
  await expect(citation.locator("details")).not.toHaveAttribute("open");
  const summary = citation.getByText("Detalhes da identificação e evidências", {
    exact: true,
  });
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    citation.getByText("sumula:unknown:7", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Space");
  await expect(
    citation.getByText("sumula:unknown:7", { exact: true }),
  ).toBeHidden();
  await section.evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY,
      behavior: "instant",
    }),
  );
  await page.screenshot({
    path: "/tmp/oraculo-reference-cards-fixture-desktop.png",
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await normative
      .getByText("Detalhes da identificação e evidências", { exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await normative
      .getByText("Detalhes da identificação e evidências", { exact: true })
      .click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await citation.evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 16,
      behavior: "instant",
    }),
  );
  await page.screenshot({
    path: "/tmp/oraculo-reference-cards-fixture-mobile.png",
  });
  await citation
    .getByRole("link", { name: "Ver no texto da publicação" })
    .click();
  await expect(page.locator(".publication-text :focus")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("q")).toBe("dano moral");
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe("jurimetria");
  expect(errors).toEqual([]);
});
