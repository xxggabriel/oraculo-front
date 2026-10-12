import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { components } from "../../contracts/generated/api";
type Api = components["schemas"];
const snippet: Api["Snippet"] = {
  text: "<center>ATO ORDINATÓRIO</center><p>Texto &amp; <b>art. 5</b></p>",
  highlights: [{ start: 8, end: 24 }],
};
test("HTML: formatting, raw Unicode references, hover, exact return and safe markup", async ({
  page,
}) => {
  const errors: string[] = [];
  const resources: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      errors.push(message.text());
  });
  page.on("request", (request) => {
    if (request.url().includes("html-resource.invalid"))
      resources.push(request.url());
  });
  await page.route("**/api/v1/publications/pub-001", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as Api["DetailResponse"];
    const surface = "art. <b>5</b>";
    body.text =
      "😀 <center>ATO ORDINATÓRIO</center><p>Primeira " +
      surface +
      ". Segunda " +
      surface +
      ' &amp; Súmula 7.</p><ol reversed start="3" type="I"><li value="7">item</li><li>outro</li></ol><table><tr><th>Tribunal</th><td>TJGO</td></tr></table><script>window.__htmlExecuted=1</script><img src="https://html-resource.invalid/image" onerror="window.__htmlExecuted=2"><a href="javascript:window.__htmlExecuted=3">rótulo</a>';
    const version = createHash("sha256").update(body.text).digest("hex");
    body.publication.textVersionId = version;
    body.source.textSha256 = version;
    body.outputs = [];
    const normative = body.references.find((reference) =>
      ["normative", "normative_reference"].includes(reference.family),
    )!;
    const citation = body.references.find(
      (reference) => reference.family === "citation",
    )!;
    const evidence = (start: number, mention: string): Api["Evidence"] => ({
      publicationId: body.publication.id,
      revisionId: body.publication.revisionId,
      textVersionId: version,
      start: Array.from(body.text.slice(0, start)).length,
      end:
        Array.from(body.text.slice(0, start)).length +
        Array.from(mention).length,
      surface: mention,
    });
    const first = body.text.indexOf(surface);
    const second = body.text.indexOf(surface, first + surface.length);
    body.references = [
      {
        ...normative,
        surface,
        evidence: [evidence(first, surface), evidence(second, surface)],
      },
      {
        ...citation,
        surface: "Súmula 7",
        evidence: [evidence(body.text.indexOf("Súmula 7"), "Súmula 7")],
      },
    ];
    await route.fulfill({ json: body });
  });
  await page.route("**/api/v1/publications/pub-001/related", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as Api["RelatedPublicationsResponse"];
    for (const item of body.items) item.publication.snippets = [snippet];
    await route.fulfill({ json: body });
  });
  await page.route(
    "**/api/v1/publications/pub-001/timeline/query",
    async (route) => {
      const response = await route.fetch();
      const body =
        (await response.json()) as Api["PublicationTimelineResponse"];
      for (const item of body.items) item.snippets = [snippet];
      await route.fulfill({ json: body });
    },
  );
  await page.addInitScript(() => Object.assign(window, { __htmlExecuted: 0 }));
  await page.goto("/publicacoes/pub-001?q=dano+moral");
  await expect(page).toHaveTitle("Oráculo · Pesquisa de publicações");
  const text = page.locator(".publication-text");
  await expect(text.locator(".publication-html-center")).toHaveText(
    "ATO ORDINATÓRIO",
  );
  await expect(text.locator("table")).toContainText("TJGO");
  await expect(text.locator("ol")).toHaveAttribute("reversed", "");
  await expect(text.locator("li").first()).toHaveAttribute("value", "7");
  await expect(text).not.toContainText("<center>");
  expect(await text.locator("script,img,iframe,svg,[onerror]").count()).toBe(0);
  const normLinks = text.getByRole("link", { name: /Referência normativa/ });
  await expect(normLinks).toHaveCount(4);
  const secondPart = normLinks.nth(3);
  // Hover also exercises automatic scrolling to the link below the metadata block.
  await secondPart.hover();
  await expect(page.getByRole("tooltip")).toContainText("art. 5");
  await expect(page.getByRole("tooltip")).not.toContainText("<b>");
  const sourceAnchor = await secondPart.evaluate(
    (element) => element.closest('[id^="publication-fragment-"]')?.id,
  );
  expect(sourceAnchor).toBeTruthy();
  await secondPart.click();
  const card = page.locator(".reference-row.border-brand-500");
  await expect(card).toContainText("art. 5");
  await card.getByRole("link", { name: /Ver no texto|Voltar/ }).click();
  await expect(page.locator('[id="' + sourceAnchor + '"]')).toBeFocused();
  await expect(page.locator("#related-publications")).toContainText(
    "ATO ORDINATÓRIO Texto & art. 5",
  );
  await expect(page.locator("#timeline-publications")).toContainText(
    "ATO ORDINATÓRIO Texto & art. 5",
  );
  expect(await page.evaluate(() => Reflect.get(window, "__htmlExecuted"))).toBe(
    0,
  );
  expect(resources).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.locator("vite-error-overlay").count()).toBe(0);
});

test("HTML snippets: search and reference jurimetry parse the complete fragment and preserve highlight marks", async ({
  page,
}) => {
  await page.route("**/api/v1/publications/search", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as Api["SearchResponse"];
    for (const item of body.items) item.snippets = [snippet];
    await route.fulfill({ json: body });
  });
  await page.route("**/api/v1/jurimetry/references/query", async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as Api["ReferencesJurimetryResponse"];
    for (const item of body.items) item.snippets = [snippet];
    await route.fulfill({ json: body });
  });
  await page.goto("/?q=dano+moral");
  const row = page.locator(".publication-row").first();
  await expect(row.locator(".publication-html-center")).toHaveText(
    "ATO ORDINATÓRIO",
  );
  await expect(row.locator("mark")).toHaveText("ATO ORDINATÓRIO");
  await expect(row).not.toContainText("<center>");
  await page.goto("/jurimetria?run=1&references=both");
  await expect(row.locator(".publication-html-center")).toHaveText(
    "ATO ORDINATÓRIO",
  );
  await expect(row.locator("mark")).toHaveText("ATO ORDINATÓRIO");
});
