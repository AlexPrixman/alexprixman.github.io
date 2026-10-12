import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { initPortfolio } from "../main.js";
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
function fixture(options = {}) {
  const dom = new JSDOM(html, { url: "https://alexprixman.github.io/" });
  const { window } = dom;
  window.matchMedia = () => ({ addEventListener() {} });
  if (options.theme)
    window.localStorage.setItem("alexprixman:theme", options.theme);
  if (options.noStorage)
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  initPortfolio({
    document: window.document,
    window,
    navigator: options.navigator ?? {
      clipboard: { writeText: async () => {} },
    },
  });
  return {
    dom,
    window,
    document: window.document,
    close: () => window.close(),
  };
}
test("menu opens and Escape closes it and restores keyboard focus", () => {
  const f = fixture();
  const button = f.document.querySelector(".menu-toggle");
  button.click();
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(
    f.document.querySelector("header").classList.contains("menu-open"),
    true,
  );
  f.document.dispatchEvent(
    new f.window.KeyboardEvent("keydown", { key: "Escape" }),
  );
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(f.document.activeElement, button);
  f.close();
});
test("choosing a navigation destination closes the mobile menu", () => {
  const f = fixture();
  f.document.querySelector(".menu-toggle").click();
  f.document.querySelector('nav a[href="#work"]').click();
  assert.equal(
    f.document.querySelector(".menu-toggle").getAttribute("aria-expanded"),
    "false",
  );
  f.close();
});
test("theme restores the persisted choice and updates the pressed state and metadata", () => {
  const f = fixture({ theme: "dark" });
  const button = f.document.querySelector(".theme-toggle");
  assert.equal(f.document.documentElement.dataset.theme, "dark");
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.equal(
    f.document.querySelector('meta[name="theme-color"]').content,
    "#171918",
  );
  button.click();
  assert.equal(f.window.localStorage.getItem("alexprixman:theme"), "light");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  f.close();
});
test("unsupported theme values safely fall back to the default", () => {
  const f = fixture({ theme: "untrusted-value" });
  assert.equal(f.document.documentElement.dataset.theme, "light");
  f.close();
});
test("theme controls still work when browser storage is blocked", () => {
  const f = fixture({ noStorage: true });
  f.document.querySelector(".theme-toggle").click();
  assert.equal(f.document.documentElement.dataset.theme, "dark");
  f.close();
});
test("tab click selects one panel and removes inactive tabs from the tab order", () => {
  const f = fixture();
  const button = f.document.getElementById("tab-backend");
  button.click();
  assert.equal(button.getAttribute("aria-selected"), "true");
  assert.equal(button.tabIndex, 0);
  assert.equal(f.document.getElementById("tab-experience").tabIndex, -1);
  assert.equal(f.document.getElementById("panel-backend").hidden, false);
  assert.equal(f.document.getElementById("panel-experience").hidden, true);
  f.close();
});
test("tab keyboard controls wrap, go to the end and return home", () => {
  const f = fixture();
  const press = (id, key) =>
    f.document
      .getElementById(id)
      .dispatchEvent(
        new f.window.KeyboardEvent("keydown", {
          key,
          bubbles: true,
          cancelable: true,
        }),
      );
  press("tab-experience", "ArrowLeft");
  assert.equal(f.document.activeElement.id, "tab-quality");
  press("tab-quality", "ArrowRight");
  assert.equal(f.document.activeElement.id, "tab-experience");
  press("tab-experience", "End");
  assert.equal(f.document.activeElement.id, "tab-quality");
  press("tab-quality", "Home");
  assert.equal(f.document.activeElement.id, "tab-experience");
  f.close();
});
test("copy email waits for clipboard success and announces the result", async () => {
  let copied;
  let resolve;
  const f = fixture({
    navigator: {
      clipboard: {
        writeText: (value) => {
          copied = value;
          return new Promise((r) => (resolve = r));
        },
      },
    },
  });
  const button = f.document.querySelector(".copy-email");
  button.click();
  assert.equal(button.disabled, true);
  assert.equal(copied, "alexprixman@gmail.com");
  resolve();
  await new Promise((r) => setImmediate(r));
  assert.equal(button.disabled, false);
  assert.equal(
    f.document.querySelector('[role="status"]').textContent,
    "email address copied.",
  );
  f.close();
});
test("denied clipboard access gives useful feedback and keeps the email link usable", async () => {
  const f = fixture({
    navigator: {
      clipboard: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    },
  });
  f.document.querySelector(".copy-email").click();
  await new Promise((r) => setImmediate(r));
  assert.match(
    f.document.querySelector('[role="status"]').textContent,
    /use the email link/,
  );
  assert.equal(f.document.querySelector(".copy-email").disabled, false);
  assert.equal(
    f.document.querySelector(".email-link").href,
    "mailto:alexprixman@gmail.com",
  );
  f.close();
});
test("browsers without clipboard support fail gracefully", async () => {
  const f = fixture({ navigator: {} });
  f.document.querySelector(".copy-email").click();
  await new Promise((r) => setImmediate(r));
  assert.match(
    f.document.querySelector('[role="status"]').textContent,
    /copy unavailable/,
  );
  f.close();
});
test("all internal navigation fragments resolve and document IDs are unique", () => {
  const { window } = new JSDOM(html);
  const document = window.document;
  const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const link of document.querySelectorAll('a[href^="#"]'))
    assert.ok(
      document.getElementById(link.getAttribute("href").slice(1)),
      link.outerHTML,
    );
  assert.equal(document.querySelectorAll("h1").length, 1);
  window.close();
});
test("local assets and the downloadable résumé exist, and external tabs are protected", async () => {
  const { window } = new JSDOM(html);
  const document = window.document;
  for (const el of document.querySelectorAll("[src],link[href],a[download]")) {
    const target = el.getAttribute("src") || el.getAttribute("href");
    if (target && !target.startsWith("https:"))
      assert.ok(
        (await stat(new URL("../" + target, import.meta.url))).isFile(),
        target,
      );
  }
  const pdf = await readFile(
    new URL("../assets/alex-prixman-resume.pdf", import.meta.url),
  );
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  for (const a of document.querySelectorAll('a[target="_blank"]')) {
    assert.ok(a.rel.split(" ").includes("noopener"));
    assert.ok(a.rel.split(" ").includes("noreferrer"));
  }
  assert.ok(
    document.querySelector(
      'a[href="https://github.com/AlexPrixman/techNotes"]',
    ),
  );
  assert.ok(
    document.querySelector(
      'a[href="https://github.com/AlexPrixman/technotes_frontend"]',
    ),
  );
  window.close();
});
test("without JavaScript the content, navigation and every engineering panel remain accessible", () => {
  const { window } = new JSDOM(html);
  const document = window.document;
  assert.equal(document.documentElement.classList.contains("js"), false);
  for (const panel of document.querySelectorAll('[role="tabpanel"]'))
    assert.equal(panel.hidden, false);
  assert.equal(document.querySelector("nav").hidden, false);
  assert.equal(document.querySelector(".copy-email").hidden, true);
  assert.equal(document.querySelector(".theme-toggle").hidden, true);
  window.close();
});
