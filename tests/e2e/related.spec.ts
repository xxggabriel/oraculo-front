import { expect, test } from "@playwright/test";

test("quatro relacionadas, navegação e retorno preservam o contexto", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/v1/publications/pub-001/related",
  );
  await page.goto(
    "/publicacoes/pub-001?q=dano+moral&returnTo=jurimetria&references=both&run=1",
  );
  const data = await (await response).json();
  const section = page.locator("#related-publications");
  const cards = section.locator(".related-publication");
  await expect(cards).toHaveCount(4);
  expect(data.items).toHaveLength(4);
  const ids: string[] = data.items.map(
    (item: { publication: { id: string } }) => item.publication.id,
  );
  expect(new Set(ids).size).toBe(4);
  expect(ids).not.toContain("pub-001");
  for (let i = 0; i < 4; i++) {
    await expect(cards.nth(i).getByRole("link").first()).toHaveAttribute(
      "href",
      new RegExp(`/publicacoes/${ids[i]}\\?`),
    );
  }
  await expect(cards.first()).toContainText("Mesmo processo");
  await page.getByRole("link", { name: "Relacionadas", exact: true }).click();
  await expect(section).toBeFocused();
  await page.screenshot({ path: "/tmp/oraculo-related-fixture-desktop.png" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await section.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({ path: "/tmp/oraculo-related-fixture-mobile.png" });
  const nextResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === `/api/v1/publications/${ids[0]}/related`,
  );
  await cards
    .first()
    .getByRole("link", { name: /Abrir publicação relacionada/ })
    .click();
  await expect(page.locator("#publication-heading")).toBeFocused();
  expect((await (await nextResponse).json()).publicationId).toBe(ids[0]);
  const url = new URL(page.url());
  expect(url.pathname).toBe(`/publicacoes/${ids[0]}`);
  expect(url.searchParams.get("q")).toBe("dano moral");
  expect(url.searchParams.get("references")).toBe("both");
  expect(url.searchParams.get("returnTo")).toBe("jurimetria");
  expect(url.hash).toBe("");
  await page.getByRole("link", { name: /Voltar à jurimetria/ }).click();
  await expect(page).toHaveURL(/\/jurimetria\?/);
  await expect(
    page.getByRole("textbox", { name: "Texto da pesquisa" }),
  ).toHaveValue("dano moral");
  expect(errors).toEqual([]);
});
