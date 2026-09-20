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
        bottom: 86px;
        max-width: min(780px, calc(100vw - 48px));
        transform: translateX(-50%) translateY(14px);
        padding: 10px 16px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 999px;
        background: rgba(3, 7, 18, .84);
        color: white;
        font: 750 16px/1.35 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
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
  await sleep(620);
}

async function demoHover(page, locator) {
  await moveTo(page, locator);
  await sleep(460);
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
  const demoEmail = `demo-${Date.now()}@greenshield.local`;
  const demoPassword = "GreenShieldDemo2026!";
  const registerResponse = await context.request.post(`${APP_URL.replace(/\/$/, "")}/api/auth/register`, {
    data: { name: "GreenShield Demo", email: demoEmail, company: "Demo Workspace", password: demoPassword },
  });
  if (!registerResponse.ok()) throw new Error(`Cannot seed demo user: ${await registerResponse.text()}`);
  const loginResponse = await context.request.post(`${APP_URL.replace(/\/$/, "")}/api/auth/login`, {
    data: { email: demoEmail, password: demoPassword },
  });
  if (!loginResponse.ok()) throw new Error(`Cannot create demo session: ${await loginResponse.text()}`);

  const page = await context.newPage();
  await waitForApp(page);
  await injectDemoOverlay(page);
  await sleep(450);

  await caption(page, "GreenShield kiểm thử bảo mật cho chatbot, RAG và AI agent trước khi triển khai.", 3400);
  await demoClick(page, page.getByTestId("home-start-scan"));
  await page.waitForURL("**/app/projects/new", { timeout: 12000 });
  await sleep(450);

  await caption(page, "Tạo project cho ứng dụng AI cần đánh giá.", 3000);
  await demoClick(page, page.getByTestId("project-create-submit"));
  await page.waitForURL("**/app/projects/**", { timeout: 12000 });
  await caption(page, "Kết nối target demo an toàn để trình diễn trọn vẹn flow kiểm thử.", 3300);
  await demoClick(page, page.getByTestId("target-connect-demo"));
  await demoClick(page, page.getByTestId("target-test-connection"));
  await page.getByText("Đã kết nối").waitFor({ state: "visible", timeout: 12000 });
  await demoClick(page, page.getByTestId("project-new-scan"));
  await page.waitForURL("**/scans/new", { timeout: 12000 });

  await caption(page, "Chọn hoặc bỏ chọn những bài kiểm thử cần chạy trong phiên scan.", 3800);
  const optionalTest = page.getByTestId("security-test-unsafe-tool-action");
  await demoClick(page, optionalTest);
  await sleep(700);
  await demoClick(page, optionalTest);
  await caption(page, "Bắt đầu scan; tiến độ được cập nhật từ các execution thật trên server.", 3800);
  await demoClick(page, page.getByTestId("scan-run"));
  await page.waitForURL("**/app/scans/**", { timeout: 12000 });
  await caption(page, "GreenShield gửi payload, thu thập response và đánh giá từng hành vi.", 4200);
  await page.getByText("Scan đã hoàn tất").waitFor({ state: "visible", timeout: 30000 });
  await demoClick(page, page.getByTestId("scan-open-report"));
  await page.waitForURL("**/app/reports/**", { timeout: 12000 });
  await sleep(700);

  await softScroll(page, 0);
  await caption(page, "Report tóm tắt điểm rủi ro, số phát hiện và trạng thái retest.", 4000);
  await caption(page, "Chọn một finding để đọc prompt tấn công, response, tác động và hướng sửa.", 4200);
  await demoClick(page, page.getByTestId("finding-system-prompt-leakage"));
  await sleep(1300);
  await caption(page, "Sau khi khắc phục, chuyển target sang trạng thái an toàn và chạy lại đúng test đó.", 4300);
  await demoClick(page, page.getByTestId("report-fixed-mode"));
  await demoClick(page, page.getByTestId("finding-retest"));
  await page.getByText("Đã khắc phục").first().waitFor({ state: "visible", timeout: 12000 });
  await caption(page, "Lịch sử retest xác nhận finding đã được khắc phục bằng response mới.", 4000);

  await page.goto(`${APP_URL.replace(/\/$/, "")}/products`, { waitUntil: "networkidle" });
  await injectDemoOverlay(page);
  await softScroll(page, 0);
  await caption(page, "Liên hệ GreenShield để xác nhận phạm vi assessment cho sản phẩm AI của bạn.", 3800);
  await demoClick(page, page.getByTestId("pricing-request-assessment"));
  await sleep(500);
  await caption(page, "GreenShield giúp đội AI hiểu điều gì đã xảy ra, cần sửa gì trước và cách xác nhận sau khi sửa.", 4300);

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
