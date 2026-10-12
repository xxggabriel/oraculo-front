import { expect, test } from "@playwright/test";

test("skeletons e expansão 5 + 10 preservam seções e referências profundas", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let referenceAnchor = "";
  const timelinePages: number[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/v1/publications/pub-001", async (route) => {
    const response = await route.fetch();
    const detail = await response.json();
    detail.references = Array.from({ length: 26 }, (_, i) => ({
      ...detail.references[0],
      id: `ref-${i}`,
      evidence: [],
    }));
    detail.outputs = Array.from({ length: 26 }, (_, i) => ({
      ...detail.outputs[0],
      id: `output-${i}`,
      label: `Ato ${i + 1}`,
      evidence: [],
    }));
    referenceAnchor =
      "publication-reference-" +
      encodeURIComponent(
        JSON.stringify([detail.references[22].family, "ref-22"]),
      );
    await gate;
    await route.fulfill({ response, json: detail });
  });
  await page.route(
    "**/api/v1/publications/pub-001/timeline/query",
    async (route) => {
      const query = route.request().postDataJSON();
      timelinePages.push(query.page);
      const response = await route.fetch();
      const report = await response.json();
      const example = report.items[0] ?? {
        id: "pub-001",
        revisionId: "r",
        textVersionId: "t",
        court: "TJGO",
        documentType: "sentenca",
        publicationDate: "2026-10-08",
        availabilityDate: null,
        sourceDate: null,
        processes: [report.selectedProcess],
        snippets: [],
        score: null,
      };
      report.items = Array.from({ length: 20 }, (_, i) => ({
        ...example,
        id: `timeline-${String(query.page * 20 + i).padStart(2, "0")}`,
        publicationDate: "2026-10-08",
        sourceDocumentType: "Decisão interlocutória",
        snippets: [],
      }));
      report.total = { value: 40, relation: "eq" };
      report.hasMore = query.page === 0;
      await route.fulfill({ response, json: report });
    },
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/publicacoes/pub-001");
  await expect(page.locator(".skeleton-row")).toHaveCount(17);
  await expect(
    page
      .getByRole("status", { name: "" })
      .filter({ hasText: "Carregando referências" }),
  ).toHaveCount(1);
  await page.screenshot({ path: "/tmp/oraculo-sections-skeleton-mobile.png" });
  release();
  const timeline = page.locator("#timeline-publications");
  const references = page.locator("#referencias-publicacao");
  const outputs = page.locator("#outputs-selecionados");
  await expect(timeline.locator(".timeline-entry")).toHaveCount(5);
  await expect(references.locator(".reference-row")).toHaveCount(5);
  await expect(outputs.locator(".output-row")).toHaveCount(5);
  await expect(timeline).toContainText(
    "Tipo de documento: Decisão interlocutória",
  );
  await timeline
    .getByRole("button", { name: "Mostrar mais 10 publicações" })
    .click();
  await expect(timeline.locator(".timeline-entry")).toHaveCount(15);
  expect(timelinePages).toEqual([0]);
  await timeline
    .getByRole("button", { name: "Mostrar mais 10 publicações" })
    .click();
  await expect(timeline.locator(".timeline-entry")).toHaveCount(25);
  expect(timelinePages).toEqual([0, 1]);
  for (const section of [references, outputs]) {
    await section.getByRole("button", { name: /Mostrar mais/ }).click();
    await expect(section.locator("article")).toHaveCount(15);
    await section.getByRole("button", { name: /Mostrar mais/ }).click();
    await expect(section.locator("article")).toHaveCount(25);
    await section.getByRole("button", { name: /Mostrar mais/ }).click();
    await expect(section.locator("article")).toHaveCount(26);
    await expect(
      section.getByRole("button", { name: /Mostrar mais/ }),
    ).toHaveCount(0);
  }
  await page.screenshot({ path: "/tmp/oraculo-sections-expanded-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/");
  await page.goto(
    `/publicacoes/pub-001#${encodeURIComponent(referenceAnchor)}`,
  );
  await expect(references.locator(".reference-row")).toHaveCount(25);
  await expect(page.locator(`[id="${referenceAnchor}"]`)).toBeFocused();
  expect(errors).toEqual([]);
});
