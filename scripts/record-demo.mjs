import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:8080";
const OUT_DIR = path.resolve("artifacts/demo");
const FINAL_WEBM = path.join(OUT_DIR, "greenshield-demo.webm");
const FINAL_MP4 = path.join(OUT_DIR, "greenshield-demo.mp4");
const VIEWPORT = { width: 1440, height: 900 };
const wantsMp4 = process.argv.includes("--mp4");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

async function waitForApp(page) {
  const response = await page.goto(APP_URL, { waitUntil: "networkidle", timeout: 45000 });
  if (!response || !response.ok()) {
    throw new Error(`Cannot open ${APP_URL}. Start the app first, for example: docker compose up -d --build`);
  }
}

async function injectDemoOverlay(page) {
  await page.addStyleTag({
    content: `
      .demo-cursor {
        position: fixed;
        left: 120px;
        top: 120px;
        z-index: 2147483647;
        pointer-events: none;
        transform: translate(-5px, -4px);
        transition:
          left 620ms cubic-bezier(.22,1,.36,1),
          top 620ms cubic-bezier(.22,1,.36,1),
          transform 180ms ease;
      }

      .demo-cursor::before {
        content: "";
        display: block;
        width: 25px;
        height: 25px;
        background: linear-gradient(135deg, #ffffff 0%, #d7fff0 100%);
        clip-path: polygon(0 0, 0 82%, 22% 66%, 34% 100%, 51% 94%, 39% 61%, 70% 61%);
        filter: drop-shadow(0 8px 14px rgba(0,0,0,.45));
      }

      .demo-cursor.is-down {
        transform: translate(-5px, -4px) scale(.9);
      }

      .demo-click-pulse {
        position: fixed;
        width: 46px;
        height: 46px;
        border-radius: 999px;
        border: 2px solid rgba(110, 231, 183, .9);
        box-shadow: 0 0 30px rgba(45, 212, 191, .38);
        z-index: 2147483646;
        pointer-events: none;
        transform: translate(-50%, -50%) scale(.45);
        animation: demoPulse 560ms ease-out forwards;
      }

      @keyframes demoPulse {
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(1.75);
        }
      }

      .demo-caption {
        position: fixed;
        left: 50%;
        bottom: 34px;
        max-width: min(860px, calc(100vw - 48px));
        transform: translateX(-50%) translateY(14px);
        padding: 12px 18px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 999px;
        background: rgba(3, 7, 18, .84);
        color: white;
        font: 750 18px/1.35 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0;
        text-align: center;
        z-index: 2147483645;
        opacity: 0;
        backdrop-filter: blur(14px);
        box-shadow: 0 20px 60px rgba(0,0,0,.28);
        transition: opacity 240ms ease, transform 240ms ease;
      }

      .demo-caption.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `,
  });

  await page.evaluate(() => {
    document.querySelector(".demo-cursor")?.remove();
    document.querySelector(".demo-caption")?.remove();

    const cursor = document.createElement("div");
    cursor.className = "demo-cursor";
    document.body.appendChild(cursor);

    const caption = document.createElement("div");
    caption.className = "demo-caption";
    document.body.appendChild(caption);

    window.__greenShieldDemo = {
      async moveCursor(x, y) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        await new Promise((resolve) => setTimeout(resolve, 660));
      },
      async clickPulse(x, y) {
        cursor.classList.add("is-down");
        const pulse = document.createElement("div");
        pulse.className = "demo-click-pulse";
        pulse.style.left = `${x}px`;
        pulse.style.top = `${y}px`;
        document.body.appendChild(pulse);
        setTimeout(() => pulse.remove(), 620);
        await new Promise((resolve) => setTimeout(resolve, 140));
        cursor.classList.remove("is-down");
        await new Promise((resolve) => setTimeout(resolve, 180));
      },
      async caption(text, duration = 1700) {
        caption.textContent = text;
        caption.classList.add("show");
        await new Promise((resolve) => setTimeout(resolve, duration));
        caption.classList.remove("show");
        await new Promise((resolve) => setTimeout(resolve, 260));
      },
    };
  });
}

async function caption(page, text, duration) {
  await page.evaluate(([nextText, nextDuration]) => window.__greenShieldDemo.caption(nextText, nextDuration), [
    text,
    duration,
  ]);
}

async function moveTo(page, locator) {
  await locator.waitFor({ state: "visible", timeout: 12000 });
  await locator.scrollIntoViewIfNeeded();
  await sleep(180);
  const box = await locator.boundingBox();
  if (!box) throw new Error("Target element is not visible");

  const x = Math.round(box.x + box.width / 2);
  const y = Math.round(box.y + box.height / 2);
  await page.evaluate(([nextX, nextY]) => window.__greenShieldDemo.moveCursor(nextX, nextY), [x, y]);
  return { x, y };
}

async function demoClick(page, locator) {
  const { x, y } = await moveTo(page, locator);
  await page.evaluate(([nextX, nextY]) => window.__greenShieldDemo.clickPulse(nextX, nextY), [x, y]);
  await locator.click();
  await sleep(520);
}

async function fillField(page, locator, value) {
  const { x, y } = await moveTo(page, locator);
  await page.evaluate(([nextX, nextY]) => window.__greenShieldDemo.clickPulse(nextX, nextY), [x, y]);
  await locator.click();
  await locator.fill("");
  await locator.pressSequentially(value, { delay: 18 });
  await sleep(220);
}

async function softScroll(page, y) {
  await page.evaluate((targetY) => {
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }, y);
  await sleep(800);
}

async function demoHover(page, locator) {
  await moveTo(page, locator);
  await sleep(700);
}

async function convertToMp4IfRequested() {
  if (!wantsMp4) return;

  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  if (probe.status !== 0) {
    console.warn("ffmpeg not found. Skipping MP4 conversion.");
    return;
  }

  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", FINAL_WEBM, "-movflags", "+faststart", "-pix_fmt", "yuv420p", FINAL_MP4],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    throw new Error("ffmpeg conversion failed");
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const file of [FINAL_WEBM, FINAL_MP4]) {
    if (await fileExists(file)) await fs.rm(file, { force: true });
  }
  for (const file of await fs.readdir(OUT_DIR)) {
    if (/^page@.*\.webm$/i.test(file)) {
      await fs.rm(path.join(OUT_DIR, file), { force: true });
    }
  }

  const executablePath = await findChromeExecutable();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: OUT_DIR,
      size: VIEWPORT,
    },
  });
  await context.addInitScript(() => {
    window.localStorage.setItem(
      "greenshield.auth",
      JSON.stringify({ name: "GreenShield Admin", email: "admin@example.com" }),
    );
  });

  const page = await context.newPage();
  await waitForApp(page);
  await injectDemoOverlay(page);
  await sleep(600);

  await caption(page, "AI app có thể rò rỉ dữ liệu, bỏ qua policy và lạm dụng tool.", 2100);
  await caption(page, "Bắt đầu bằng một phiên scan bảo mật AI.", 1600);
  await demoClick(page, page.getByTestId("home-start-scan"));
  await page.waitForURL("**/scan/new", { timeout: 12000 });
  await sleep(650);

  await caption(page, "Chọn ứng dụng mục tiêu và môi trường cần kiểm thử.", 1800);
  for (let step = 0; step < 2; step += 1) {
    await demoClick(page, page.getByTestId("scan-next-step"));
  }

  await caption(page, "Chọn module rủi ro: Prompt Injection, RAG Leakage, Tool Abuse và API Exposure.", 2600);
  await demoHover(page, page.getByTestId("risk-module-prompt-injection"));
  await demoHover(page, page.getByTestId("risk-module-rag-data-leakage"));
  await demoHover(page, page.getByTestId("risk-module-unsafe-tool-calls"));
  await caption(page, "Module được chọn sẽ quyết định bằng chứng và checklist retest trong report.", 2400);
  await demoClick(page, page.getByTestId("scan-next-step"));

  await caption(page, "Chạy phiên scan bảo mật tập trung.", 1500);
  await demoClick(page, page.getByTestId("scan-run-button"));
  await page.waitForURL("**/scan/progress", { timeout: 12000 });
  await sleep(900);

  await caption(page, "GreenShield kiểm tra prompt, RAG, tool và API risk.", 2300);
  await sleep(1200);
  await demoClick(page, page.getByTestId("progress-open-report"));
  await page.waitForURL("**/reports/scan-gs-001", { timeout: 12000 });
  await sleep(850);

  await softScroll(page, 0);
  await caption(page, "Báo cáo mở đầu bằng điểm rủi ro, tóm tắt và ưu tiên sửa.", 2400);
  await demoClick(page, page.getByTestId("report-top-retest"));
  await caption(page, "Có thể chạy retest sau khi đội kỹ thuật đã sửa lỗi.", 1900);
  await softScroll(page, 430);
  await caption(page, "Chọn từng finding để xem bằng chứng và hướng xử lý.", 1900);
  await demoClick(page, page.getByTestId("finding-finding-002"));
  await caption(page, "Mỗi finding có hành vi xảy ra, bằng chứng, tác động và hướng fix.", 2400);
  await demoClick(page, page.getByTestId("finding-detail-retest"));
  await caption(page, "Sửa lỗi ưu tiên cao trước, sau đó retest để xác nhận.", 1900);

  await page.goto(`${APP_URL.replace(/\/$/, "")}/products`, { waitUntil: "networkidle" });
  await injectDemoOverlay(page);
  await softScroll(page, 120);
  await caption(page, "Chọn gói scan hoặc yêu cầu assessment bảo mật AI.", 2100);
  await demoClick(page, page.getByTestId("pricing-request-assessment"));
  await sleep(900);
  await caption(page, "GreenShield giúp đội AI triển khai LLM, RAG và agent an toàn hơn.", 2300);

  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const rawVideoPath = await video.path();
  await fs.rename(rawVideoPath, FINAL_WEBM);
  await convertToMp4IfRequested();

  console.log(`Demo video saved: ${FINAL_WEBM}`);
  if (wantsMp4 && (await fileExists(FINAL_MP4))) {
    console.log(`MP4 video saved: ${FINAL_MP4}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
