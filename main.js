export function initPortfolio({
  document = globalThis.document,
  window = globalThis.window,
  navigator = globalThis.navigator,
} = {}) {
  if (!document || !window) return;
  document.documentElement.classList.add("js");
  const header = document.querySelector("#site-header");
  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-navigation");
  function closeMenu(restoreFocus = false) {
    header?.classList.remove("menu-open");
    menu?.setAttribute("aria-expanded", "false");
    if (restoreFocus) menu?.focus();
  }
  if (menu && header) {
    menu.hidden = false;
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      header.classList.toggle("menu-open", open);
    });
    nav?.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menu.getAttribute("aria-expanded") === "true"
      )
        closeMenu(true);
    });
    window
      .matchMedia?.("(min-width: 761px)")
      .addEventListener?.("change", (event) => {
        if (event.matches) closeMenu();
      });
  }
  const themeButton = document.querySelector(".theme-toggle");
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton?.setAttribute("aria-pressed", String(theme === "dark"));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#171918" : "#f6f5f0";
  }
  let savedTheme;
  try {
    savedTheme = window.localStorage.getItem("alexprixman:theme");
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
  applyTheme(savedTheme === "dark" ? "dark" : "light");
  if (themeButton) {
    themeButton.hidden = false;
    themeButton.addEventListener("click", () => {
      const theme =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      try {
        window.localStorage.setItem("alexprixman:theme", theme);
      } catch {
        /* Theme still works for this visit. */
      }
    });
  }
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(selected, moveFocus = false) {
    for (const tab of tabs) {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls"));
      if (panel) panel.hidden = !active;
    }
    if (moveFocus) selected.focus();
  }
  if (tabs.length) {
    selectTab(
      tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ||
        tabs[0],
    );
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        const targets = {
          ArrowRight: (index + 1) % tabs.length,
          ArrowLeft: (index + tabs.length - 1) % tabs.length,
          Home: 0,
          End: tabs.length - 1,
        };
        if (event.key in targets) {
          event.preventDefault();
          selectTab(tabs[targets[event.key]], true);
        }
      });
    });
  }
  const copyButton = document.querySelector(".copy-email");
  const feedback = document.querySelector(".copy-feedback");
  const emailLink = document.querySelector('a[href^="mailto:"]');
  if (copyButton && feedback && emailLink) {
    copyButton.hidden = false;
    copyButton.addEventListener("click", async () => {
      copyButton.disabled = true;
      try {
        if (!navigator?.clipboard?.writeText)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(
          emailLink.getAttribute("href").slice(7),
        );
        feedback.textContent = "email address copied.";
      } catch {
        feedback.textContent = "copy unavailable. use the email link above.";
      } finally {
        copyButton.disabled = false;
      }
    });
  }
  if (typeof window.IntersectionObserver === "function" && nav) {
    const observer = new window.IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        for (const link of nav.querySelectorAll("a")) {
          if (link.hash === "#" + visible.target.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      },
      { rootMargin: "-12% 0px -45% 0px", threshold: [0, 0.15, 0.4] },
    );
    document
      .querySelectorAll("[data-section]")
      .forEach((section) => observer.observe(section));
  }
}
if (typeof document !== "undefined") initPortfolio();
