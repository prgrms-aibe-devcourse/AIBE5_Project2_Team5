import fs from "node:fs/promises";

const { chromium } = await import("file:///C:/Users/jeaju/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs");

const APP_BASE = "http://127.0.0.1:5173";
const seedText = await fs.readFile(new URL("./verify-ai-helper-seed.json", import.meta.url), "utf8");
const seed = JSON.parse(seedText.replace(/^\uFEFF/, ""));

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

await page.addInitScript(({ accessToken, currentUser }) => {
  window.localStorage.setItem("pickxel:isLoggedIn", "true");
  window.localStorage.setItem("pickxel:accessToken", accessToken);
  window.localStorage.setItem("pickxel:currentUser", JSON.stringify(currentUser));
}, {
  accessToken: seed.accessToken,
  currentUser: seed.currentUser,
});

await page.goto(`${APP_BASE}/messages?conversationId=${seed.conversationId}`, {
  waitUntil: "networkidle",
});

const expandButton = page.getByRole("button", { name: /AI 도우미 (펼치기|접기)/ });
await expandButton.waitFor({ state: "visible" });
if (await page.getByRole("button", { name: "AI 도우미 펼치기" }).isVisible().catch(() => false)) {
  await page.getByRole("button", { name: "AI 도우미 펼치기" }).click();
}

await page.getByRole("button", { name: "미팅 일정 잡기" }).click();

const actionLabels = new Set(["답장 추천", "다음 단계 안내", "미팅 일정 잡기", "문서 전달 안내", "펼치기", "접기"]);
const getAssistantSuggestions = (labels) => {
  const title = Array.from(document.querySelectorAll("span")).find((node) =>
    node.textContent?.trim() === "AI 메시지 도우미"
  );
  const root = title?.closest("div.rounded-2xl");
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll("button"))
    .map((button) => button.textContent?.trim() ?? "")
    .filter((text) => text.length > 20 && !labels.includes(text));
};

await page.waitForFunction((labels) => getAssistantSuggestions(labels).length > 0, Array.from(actionLabels));

const suggestions = await page.evaluate(getAssistantSuggestions, Array.from(actionLabels));

const firstSuggestion = suggestions[0];
if (!firstSuggestion) {
  throw new Error("No assistant suggestion button was rendered.");
}

await page.evaluate((targetText) => {
  const title = Array.from(document.querySelectorAll("span")).find((node) =>
    node.textContent?.trim() === "AI 메시지 도우미"
  );
  const root = title?.closest("div.rounded-2xl");
  const targetButton = Array.from(root?.querySelectorAll("button") ?? []).find(
    (button) => button.textContent?.trim() === targetText
  );
  if (!targetButton) {
    throw new Error("Assistant suggestion button not found.");
  }
  targetButton.click();
}, firstSuggestion);
await page.keyboard.press("Enter");
await page.waitForTimeout(1800);

const bodyText = await page.locator("body").innerText();
const inputValue = await page.locator('input[placeholder*="메시지 보내기"]').inputValue();
const suggestionVisible = await page.getByText(firstSuggestion, { exact: true }).last().isVisible();
const failedVisible = bodyText.includes("전송 실패");

await page.screenshot({ path: "tmp/verify-ai-helper-send.png", fullPage: true });
await browser.close();

console.log(JSON.stringify({
  conversationId: seed.conversationId,
  firstSuggestion,
  inputClearedAfterSend: inputValue === "",
  suggestionVisible,
  failedVisible,
}, null, 2));
