/* Run with a Playwright Page in an isolated browser context. No provider calls. */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export default async function captureDesignPreview(page, { version, viewport, screenIds }) {
  if (!["before", "after"].includes(version)) throw new Error("Unknown version");
  const root = fileURLToPath(new URL("../artifacts/design-preview/", import.meta.url));
  const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
  const fixture = JSON.parse(await fs.readFile(path.join(root, "fixture.json"), "utf8"));
  const { width, height } = manifest.viewports[viewport];
  const context = await page.context().browser().newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce", locale: "ko-KR", timezoneId: "Asia/Seoul" });
  const errors = [];
  const results = [];
  try {
    await context.route("**/api/ai/**", route => route.abort());
    await context.addInitScript(projects => localStorage.setItem("plancraft_projects", JSON.stringify(projects)), fixture);
    const capturePage = await context.newPage();
    capturePage.on("pageerror", error => errors.push(error.message));
    await fs.mkdir(path.join(root, "shots"), { recursive: true });
    for (const screen of manifest.screens.filter(item => !screenIds || screenIds.includes(item.id))) {
      const response = await capturePage.goto(`http://127.0.0.1:${version === "before" ? 3101 : 3000}${screen.route}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      if (!response?.ok()) throw new Error(`${screen.id}: HTTP ${response?.status()}`);
      if (screen.id === "dashboard") await capturePage.getByText(fixture[0].title, { exact: true }).first().waitFor({ state: "attached" });
      if (screen.id === "guide") await capturePage.locator("h1").waitFor();
      if (screen.route.startsWith("/project/")) {
        await capturePage.locator("main").waitFor();
        await capturePage.waitForFunction(() => !document.querySelector("main")?.textContent?.includes("불러오는 중"));
        await capturePage.getByText(fixture[0].title, { exact: true }).first().waitFor({ state: "attached" });
      }
      if (screen.id === "home" && version === "after") await capturePage.locator('[data-aurora][data-visible="true"]').waitFor();
      await capturePage.addStyleTag({ content: "nextjs-portal{display:none!important}*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;scroll-behavior:auto!important}" });
      await capturePage.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).filter(img => { const r = img.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0; }).map(img => img.decode().catch(() => {})));
      });
      await capturePage.screenshot({ path: path.join(root, "shots", `${screen.id}-${version}-${viewport}.png`), animations: "disabled", fullPage: false });
      results.push({ screen: screen.id, status: response.status(), width, height });
    }
  } finally { await context.close(); }
  const report = { version, viewport, results, errors };
  await fs.writeFile(path.join(root, `capture-${version}-${viewport}.json`), JSON.stringify(report, null, 2));
  return report;
}
