import { test, expect } from "@playwright/test";

test("loads without failed assets and fits the viewport", async ({ page }) => {
  const failures = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(r.url());
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator('article[aria-labelledby="technotes-title"]')).toContainText("techNotes");
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("navigation reaches the project and mobile menu closes", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile)
    await page.getByRole("button", { name: "menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "main navigation" })
    .getByRole("link", { name: "work", exact: true })
    .click();
  await expect(page).toHaveURL(/#work$/);
  if (isMobile)
    await expect(
      page.getByRole("button", { name: "menu", exact: true }),
    ).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#technotes-title")).toBeVisible();
});
test("engineering tabs support keyboard and the case study expands", async ({
  page,
}) => {
  await page.goto("/#work");
  await page.getByRole("tab", { name: "backend", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "permissions belong in the API",
  );
  await page
    .getByRole("tab", { name: "backend", exact: true })
    .press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "quality", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("51 passing tests");
  await page.locator("summary").filter({hasText:"the techNotes case study"}).click();
  await expect(
    page.getByRole("heading", { name: "an unfinished workflow.", exact: true }),
  ).toBeVisible();
});
test("dark theme persists across reloads and can be restored", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "dark theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "dark theme", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "dark theme", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
test("résumé downloads as a real PDF and project links target the correct repositories", async ({
  page,
}) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("link", { name: "download résumé", exact: false })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("alex-prixman-resume.pdf");
  const response = await page.request.get("/assets/alex-prixman-resume.pdf");
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(
    page.getByRole("link", { name: "frontend source", exact: false }),
  ).toHaveAttribute(
    "href",
    "https://github.com/AlexPrixman/technotes_frontend",
  );
  await expect(
    page.getByRole("link", { name: "API source", exact: false }),
  ).toHaveAttribute("href", "https://github.com/AlexPrixman/techNotes");
});
test("denied clipboard access leaves an actionable email link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    });
  });
  await page.goto("/#contact");
  await page.getByRole("button", { name: "copy email address" }).click();
  await expect(page.getByRole("status")).toContainText("use the email link");
  await expect(
    page.getByRole("link", { name: "alexprixman@gmail.com", exact: false }),
  ).toHaveAttribute("href", "mailto:alexprixman@gmail.com");
});
test("progressive content is usable without JavaScript", async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: page.viewportSize(),
  });
  const plain = await context.newPage();
  await plain.goto("http://127.0.0.1:4173/");
  await expect(plain.getByRole("navigation")).toBeVisible();
  await expect(plain.locator("#panel-backend")).toBeVisible();
  await expect(plain.locator("#panel-quality")).toBeVisible();
  await expect(
    plain.getByRole("link", { name: "download résumé", exact: false }),
  ).toBeVisible();
  await context.close();
});
test("unknown paths show a useful 404", async ({ page }) => {
  const response = await page.goto("/missing-page");
  expect(response.status()).toBe(404);
  await expect(
    page.getByRole("link", { name: "back to the portfolio", exact: false }),
  ).toHaveAttribute("href", "/");
});

test("RentDesk has a live demo, source link, screenshot, and expandable case study", async ({page}) => {
  await page.goto("/#work");
  const card=page.locator('article[aria-labelledby="rentdesk-title"]');
  await expect(card.getByRole("heading",{name:"rentdesk",exact:true})).toBeVisible();
  await expect(card.getByRole("link",{name:"try the live demo"})).toHaveAttribute("href","https://rentdesk-alexprixman.onrender.com");
  await expect(card.getByRole("link",{name:"source code"})).toHaveAttribute("href","https://github.com/AlexPrixman/rent_car");
  await expect(card.getByRole("img")).toBeVisible();
  await page.locator("summary").filter({hasText:"the RentDesk case study"}).click();
  await expect(page.getByRole("heading",{name:"a tested app you can try."})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
