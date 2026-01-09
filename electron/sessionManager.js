const { EventEmitter } = require('events');
const { chromium } = require('playwright');

const FRAME_INTERVAL_MS = Number(process.env.KHANZUO_FRAME_INTERVAL_MS || 1500);
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const SCREENSHOT_OPTIONS = { type: 'jpeg', quality: 70, fullPage: true };

async function closeSafely(handle) {
  if (!handle) return;
  try {
    await handle.close();
  } catch (error) {
    console.warn('[session-manager] close failed', error?.message ?? error);
  }
}

class SessionManager extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map();
  }

  async startSession(payload = {}) {
    const sessionId = payload.sessionId?.trim();
    const targetUrl = payload.targetUrl?.trim();
    if (!sessionId) throw new Error('sessionId is required');
    if (!targetUrl) throw new Error('targetUrl is required');

    await this.stopSession({ sessionId });

    let browser;
    try {
      browser = await chromium.launch({ headless: true, args: ['--disable-gpu', '--no-sandbox'] });
      const context = await browser.newContext({ viewport: DEFAULT_VIEWPORT });
      const page = await context.newPage();
      const session = {
        id: sessionId,
        browser,
        context,
        page,
        frameTimer: null,
        targetUrl,
      };
      this.sessions.set(sessionId, session);
      this.emitStatus(sessionId, 'starting', 'Capturing');

      page.on('load', () => this.captureFrame(sessionId));
      page.on('domcontentloaded', () => this.captureFrame(sessionId));
      page.on('framenavigated', () => this.captureFrame(sessionId));
      page.on('close', () => this.stopSession({ sessionId }));

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await this.captureFrame(sessionId);
      session.frameTimer = setInterval(() => this.captureFrame(sessionId), FRAME_INTERVAL_MS);
      this.emitStatus(sessionId, 'running', 'Capturing');
    } catch (error) {
      if (browser) await closeSafely(browser);
      this.sessions.delete(sessionId);
      this.emitStatus(sessionId, 'idle', 'Ready', {
        status: 'error',
        title: 'Playwright failed to start',
        detail: error?.message ?? String(error ?? 'Unknown error'),
      });
      throw error;
    }

    return { status: 'ok' };
  }

  async stopSession(payload = {}) {
    const sessionId = payload.sessionId?.trim();
    if (!sessionId) return { status: 'ignored' };
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.emitStatus(sessionId, 'idle', 'Ready');
      return { status: 'ok' };
    }

    if (session.frameTimer) {
      clearInterval(session.frameTimer);
      session.frameTimer = null;
    }

    await closeSafely(session.page);
    await closeSafely(session.context);
    await closeSafely(session.browser);
    this.sessions.delete(sessionId);
    this.emitStatus(sessionId, 'idle', 'Ready');
    return { status: 'ok' };
  }

  async captureFrame(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.page) return;
    try {
      const buffer = await session.page.screenshot(SCREENSHOT_OPTIONS);
      const frameDataUri = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      this.emit('frame', { sessionId, frameDataUri });
    } catch (error) {
      this.emit('log', {
        sessionId,
        status: 'warning',
        title: 'Screenshot attempt failed',
        detail: error?.message ?? String(error ?? 'Unknown error'),
      });
    }
  }

  emitStatus(sessionId, status, captureStatus = 'Ready', log) {
    const payload = { sessionId, status, captureStatus };
    if (log) payload.log = log;
    this.emit('status', payload);
  }
}

module.exports = SessionManager;
