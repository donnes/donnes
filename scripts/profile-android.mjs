// Run after forwarding the phone's Chrome DevTools socket to localhost:9222.
// Example: node scripts/profile-android.mjs http://localhost:9222 donnes.dev 15000 /tmp/beach-baseline.json
import { writeFile } from 'node:fs/promises';
const [origin = 'http://localhost:9222', target = 'donnes.dev', durationArg = '15000', output = '/tmp/beach-profile.json'] = process.argv.slice(2);
const duration = Math.min(60000, Math.max(3000, Number(durationArg) || 15000));
const pages = await (await fetch(`${origin}/json/list`)).json();
const page = pages.find(p => p.type === 'page' && p.url.includes(target));
if (!page) throw new Error(`No page matching ${target}. Open the beach on the phone first.`);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  const waiter = pending.get(message.id);
  if (!waiter) return;
  pending.delete(message.id);
  message.error ? waiter.reject(new Error(message.error.message)) : waiter.resolve(message.result);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  pending.set(requestId, { resolve, reject });
  ws.send(JSON.stringify({ id: requestId, method, params }));
});
const timeout = setTimeout(() => { console.error('Profile timed out. Keep the phone awake with the beach visible.'); ws.close(); process.exitCode = 1; }, duration + 15000);
try {
  const result = await send('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `
    new Promise(resolve => {
      const frames = [], longTasks = [], longFrames = [];
      const observers = [];
      const observe = (type, list) => {
        if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
        const observer = new PerformanceObserver(entries => entries.getEntries().forEach(e => list.push({ start: e.startTime, duration: e.duration })));
        observer.observe({type}); observers.push(observer);
      };
      observe('longtask', longTasks); observe('long-animation-frame', longFrames);
      const started = performance.now(); let last = null, raf = 0, hidden = document.hidden;
      const visibility = () => { if (document.hidden) hidden = true; };
      document.addEventListener('visibilitychange', visibility);
      const frame = now => { if (last !== null) frames.push(now-last); last = now; raf = requestAnimationFrame(frame); };
      raf = requestAnimationFrame(frame);
      setTimeout(() => {
        cancelAnimationFrame(raf); observers.forEach(o=>o.disconnect()); document.removeEventListener('visibilitychange', visibility);
        const sorted = [...frames].sort((a,b)=>a-b), quantile = p => sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))] ?? null;
        resolve({ userAgent:navigator.userAgent, viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
          lite:document.documentElement.classList.contains('is-lite'), reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,
          invalidHiddenSample:hidden, elapsedMs:performance.now()-started, frames:frames.length,
          rafFps:frames.length ? frames.length*1000/frames.reduce((a,b)=>a+b,0) : 0,
          medianMs:quantile(.5), p95Ms:quantile(.95), p99Ms:quantile(.99), gapsOver20ms:frames.filter(n=>n>20).length,
          longTasks,longFrames,frameIntervalsMs:frames,
          note:'rAF cadence measures main-thread opportunities, not proof of presented compositor frames. Pair with a device rendering trace.' });
      }, ${duration});
    })` });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  const profile = result.result.value;
  await writeFile(output, JSON.stringify(profile, null, 2));
  const { frameIntervalsMs, userAgent, ...summary } = profile;
  console.log(JSON.stringify({ ...summary, output }, null, 2));
} finally { clearTimeout(timeout); ws.close(); }
