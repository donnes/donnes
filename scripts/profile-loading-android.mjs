// Forward Chrome's Android DevTools socket to localhost:9222 before running.
// node scripts/profile-loading-android.mjs localhost:4323 /tmp/loading.json
import { writeFile } from 'node:fs/promises';
const [target = 'localhost:4323', output = '/tmp/beach-loading.json'] = process.argv.slice(2);
const pages = await (await fetch('http://localhost:9222/json/list')).json();
const page = pages.find(page => page.type === 'page' && page.url.includes(target));
if (!page) throw new Error(`Open ${target} on the phone first.`);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data), waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  ws.send(JSON.stringify({ id: requestId, method, params }));
});
const timeout = setTimeout(() => { ws.close(); console.error('Loading capture timed out.'); process.exitCode = 1; }, 20000);
let identifier;
try {
  await send('Page.enable');
  ({ identifier } = await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__beachLoading = { frames: [], longTasks: [], hidden: document.hidden };
    const capture = window.__beachLoading;
    document.addEventListener('visibilitychange', () => { if (document.hidden) capture.hidden = true; });
    new PerformanceObserver(entries => entries.getEntries().forEach(e => capture.longTasks.push({ start: e.startTime, duration: e.duration }))).observe({ type: 'longtask' });
    let last, previous;
    function sample(t) {
      const phase = document.querySelector('.jb-draft')?.dataset.phase || (document.documentElement.classList.contains('jb-intro-done') ? 'painted' : 'prepare');
      if (last != null) capture.frames.push({ t, dt: t - last, phase, stable: phase === previous });
      last = t; previous = phase;
      if (t < 7000) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  ` }));
  await send('Page.reload', { ignoreCache: true });
  await new Promise(resolve => setTimeout(resolve, 8500));
  const response = await send('Runtime.evaluate', { expression: 'window.__beachLoading', returnByValue: true });
  if (response.exceptionDetails || !response.result.value) throw new Error('Capture did not initialize.');
  const capture = response.result.value;
  const phases = {};
  for (const phase of ['prepare', 'drawing', 'color', 'painted']) {
    const frames = capture.frames.filter(frame => frame.phase === phase && frame.stable).map(frame => frame.dt).sort((a, b) => a - b);
    phases[phase] = { frames: frames.length, rafFps: frames.length * 1000 / frames.reduce((sum, dt) => sum + dt, 0), p95Ms: frames[Math.floor(frames.length * .95)], maxMs: Math.max(...frames), gapsOver20ms: frames.filter(dt => dt > 20).length };
  }
  await writeFile(output, JSON.stringify({ ...capture, phases, note: 'Browser callback cadence, not compositor presentation. Boundary frames remain in the raw capture; phase statistics exclude boundaries.' }, null, 2));
  console.log(JSON.stringify({ invalidHiddenSample: capture.hidden, phases, longTasks: capture.longTasks, output }, null, 2));
  if (capture.hidden) process.exitCode = 1;
} finally {
  if (identifier && ws.readyState === WebSocket.OPEN) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  clearTimeout(timeout); ws.close();
}
