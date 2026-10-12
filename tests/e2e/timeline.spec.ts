import { expect, test } from "@playwright/test";

test("timeline: processo próprio, datas, publicação atual e navegação preservada", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) errors.push(m.text());
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname ===
      "/api/v1/publications/pub-001/timeline/query",
  );
  await page.goto("/publicacoes/pub-001?q=dano+moral&returnTo=jurimetria");
  const r = await response;
  expect(r.status()).toBe(200);
  const report = await r.json();
  expect(report.selectedProcess).toBe("00012345120248090001");
  expect(report.items.map((p: { id: string }) => p.id)).toEqual([
    "pub-001",
    "pub-002",
    "pub-009",
    "pub-003",
  ]);
  const section = page.locator("#timeline-publications");
  await expect(section.locator(".timeline-entry")).toHaveCount(4);
  await expect(section.locator(".timeline-entry").first()).toContainText(
    "Partes e polo destinatário não informados.",
  );
  await expect(section.locator(".timeline-entry").first()).toContainText(
    "Advogados não informados.",
  );
  await expect(section.locator('[aria-current="true"]')).toContainText(
    "Você está nesta publicação",
  );
  await expect(section.locator(".timeline-entry").last()).toContainText(
    "Data de publicação não informada",
  );
  await expect(
    section.locator(".timeline-entry").last().locator("time"),
  ).toHaveCount(0);
  expect(await section.locator("script").count()).toBe(0);
  await page.getByRole("link", { name: "Linha do tempo", exact: true }).click();
  await expect(section).toBeFocused();
  await page.screenshot({ path: "/tmp/oraculo-timeline-fixture-desktop.png" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await section.scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await section.evaluate((el) =>
    window.scrollTo({
      top: el.getBoundingClientRect().top + scrollY,
      behavior: "instant",
    }),
  );
  await page.screenshot({ path: "/tmp/oraculo-timeline-fixture-mobile.png" });
  await section.getByRole("link", { name: /Abrir publicação pub-002/ }).click();
  await expect(page.locator("#publication-heading")).toBeFocused();
  expect(new URL(page.url()).searchParams.get("returnTo")).toBe("jurimetria");
  expect(new URL(page.url()).searchParams.get("q")).toBe("dano moral");
  await expect(section.locator('[aria-current="true"]')).toHaveAttribute(
    "id",
    "timeline-item-pub-002",
  );
  await page.goto("/publicacoes/pub-008?q=dano+moral");
  await expect(section.locator(".timeline-entry")).toHaveCount(1);
  await expect(section).toContainText("0009999-11.2024.8.09.0001");
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
  expect(errors).toEqual([]);
});
