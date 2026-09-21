// Trace the loading intro in a local Chromium, desktop or phone-shaped, with CPU throttling.
// node scripts/profile-loading.mjs "http://127.0.0.1:4321/?wx=rain" [mobile] [throttle=4] [trace.json]
// WX_CODE=63 answers the Open-Meteo request with that weather code (63 rain, 95 storm) after WX_DELAY ms (default 600),
// which is the real first visit on a rainy day: the beach starts clear and the rain arrives while it is being drawn.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [url = 'http://127.0.0.1:4321/?wx=rain', shape = 'desktop', throttle = '4', output = ''] = process.argv.slice(2);
const mobile = shape === 'mobile';
const port = 9300 + Math.floor(Math.random() * 500);
const profile = await mkdtemp(join(tmpdir(), 'beach-profile-'));
const chrome = spawn(process.env.CHROME || 'chromium', [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--headless=new', '--no-first-run', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', ...(process.env.CHROME_FLAGS || '').split(' ').filter(Boolean), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  let pages;
  for (let i = 0; i < 50 && !pages; i++) {
    await sleep(200);
    pages = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json()).catch(() => undefined);
  }
  const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map(), events = [];
  let traceDone;
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Tracing.dataCollected') events.push(...message.params.value);
    if (message.method === 'Tracing.tracingComplete') traceDone?.();
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
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', mobile ? { width: 412, height: 915, deviceScaleFactor: 2.625, mobile: true } : { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Emulation.setCPUThrottlingRate', { rate: Number(throttle) });
  if (process.env.WX_CODE) await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const realFetch = window.fetch;
    window.fetch = (input, init) => String(input).includes('open-meteo') ? new Promise(resolve => setTimeout(() => resolve(new Response(JSON.stringify({
      current: { temperature_2m: 19, apparent_temperature: 18, weather_code: ${Number(process.env.WX_CODE)}, cloud_cover: 100, wind_speed_10m: 16, wind_gusts_10m: 28, wind_direction_10m: 140, is_day: 1, precipitation: 2, rain: 2, showers: 0 },
      daily: { sunrise: ['2026-01-01T06:00'], sunset: ['2026-01-01T18:30'] },
    }), { headers: { 'content-type': 'application/json' } })), ${Number(process.env.WX_DELAY || 600)})) : realFetch(input, init);
  ` });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__beachLoading = { frames: [], marks: [] };
    let last;
    function sample(t) {
      const phase = document.querySelector('.jb-draft')?.dataset.phase || (document.documentElement.classList.contains('jb-intro-done') ? 'painted' : 'prepare');
      if (last != null) window.__beachLoading.frames.push({ dt: t - last, phase });
      if (phase !== window.__beachLoading.phase) window.__beachLoading.marks.push({ phase, at: t });
      window.__beachLoading.phase = phase;
      last = t;
      if (t < 20000) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  ` });
  await send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc', 'gpu', 'viz', 'blink', 'blink.user_timing', 'disabled-by-default-devtools.timeline.invalidationTracking'] } });
  await send('Page.navigate', { url });
  await sleep(Number(process.env.RUN_MS || 7000));
  const { result } = await send('Runtime.evaluate', { expression: 'window.__beachLoading', returnByValue: true });
  const finished = new Promise(resolve => { traceDone = resolve; });
  await send('Tracing.end');
  await finished;
  const phases = {};
  for (const phase of ['prepare', 'drawing', 'color', 'painted']) {
    const frames = result.value.frames.filter(f => f.phase === phase).map(f => f.dt).sort((a, b) => a - b);
    if (!frames.length) continue;
    const total = frames.reduce((sum, dt) => sum + dt, 0);
    phases[phase] = { frames: frames.length, ms: Math.round(total), fps: +(frames.length * 1000 / total).toFixed(1), p95Ms: +frames[Math.floor(frames.length * 0.95)].toFixed(1), maxMs: +frames.at(-1).toFixed(1) };
  }
  // Where the time goes: self-inclusive totals per event name on each thread.
  const threads = new Map();
  for (const e of events) if (e.name === 'thread_name') threads.set(`${e.pid}:${e.tid}`, e.args.name);
  const totals = new Map();
  for (const e of events) {
    if (e.ph !== 'X' || !e.dur) continue;
    const thread = (threads.get(`${e.pid}:${e.tid}`) || 'other').replace(/\d+$/, '').replace(/ThreadPool.*/, 'ThreadPool');
    const key = `${thread} · ${e.name}`;
    const entry = totals.get(key) || { ms: 0, n: 0, max: 0 };
    entry.ms += e.dur / 1000; entry.n++; entry.max = Math.max(entry.max, e.dur / 1000);
    totals.set(key, entry);
  }
  // The same, per intro phase, for the few events that explain a slow frame.
  const origin = events.find(e => e.name === 'navigationStart' && e.args?.data?.isLoadingMainFrame && e.args.data.documentLoaderURL?.startsWith('http'))?.ts;
  const watch = { 'CrRendererMain · UpdateLayoutTree': 'style', 'CrRendererMain · Layout': 'layout', 'CrRendererMain · Paint': 'paint', 'CrRendererMain · FunctionCall': 'script', 'CrRendererMain · FireAnimationFrame': 'raf', 'ThreadPool · RasterTask': 'raster', 'CrGpuMain · RunTask': 'gpu', 'VizCompositorThread · RunTask': 'viz', 'Compositor · RunTask': 'cc' };
  if (origin) {
    const marks = [...result.value.marks, { phase: 'end', at: Infinity }];
    for (let i = 0; i < marks.length - 1; i++) {
      const from = origin + marks[i].at * 1000, to = origin + marks[i + 1].at * 1000, sums = {};
      for (const e of events) {
        if (e.ph !== 'X' || !e.dur || e.ts < from || e.ts >= to) continue;
        const thread = (threads.get(`${e.pid}:${e.tid}`) || 'other').replace(/\d+$/, '').replace(/ThreadPool.*/, 'ThreadPool');
        const label = watch[`${thread} · ${e.name}`];
        if (label) sums[label] = (sums[label] || 0) + e.dur / 1000;
      }
      const frames = phases[marks[i].phase]?.frames || 1;
      console.log(marks[i].phase.padEnd(8), Object.entries(sums).map(([k, v]) => `${k} ${(v / frames).toFixed(1)}`).join('  '), ' (ms per frame)');
    }
  }
  // What keeps invalidating style.
  const why = new Map();
  for (const e of events) {
    if (e.name !== 'StyleRecalcInvalidationTracking' && e.name !== 'ScheduleStyleInvalidationTracking') continue;
    const d = e.args.data, key = `${e.name === 'StyleRecalcInvalidationTracking' ? 'recalc' : 'schedule'} ${d.nodeName} · ${d.reason || d.invalidationSet || ''} ${d.changedAttribute || d.changedClass || d.extraData || ''}`;
    why.set(key, (why.get(key) || 0) + 1);
  }
  console.log([...why].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => `${String(n).padStart(7)}  ${k}`).join('\n'));
  const top = [...totals].filter(([, v]) => v.ms > 25).sort((a, b) => b[1].ms - a[1].ms).slice(0, 40).map(([k, v]) => `${v.ms.toFixed(0).padStart(6)}ms  n=${String(v.n).padStart(5)}  max=${v.max.toFixed(1).padStart(6)}  ${k}`);
  console.log(JSON.stringify({ url, shape, throttle, phases }, null, 2));
  console.log(top.join('\n'));
  if (output) await writeFile(output, JSON.stringify(events));
  ws.close();
} finally {
  chrome.kill();
}
