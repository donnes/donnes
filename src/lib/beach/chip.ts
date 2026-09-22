// The quiet line under the location: glyph · local time · phase of the day · temperature, sky and wind.
import type { Sky, SceneState } from "./scene.ts";

// the chip's tiny drawn glyph, one per sky (sun/moon swapped by the hour)
const G_CLOUD = "<path d='M5.5 15.5h9.5a3.2 3.2 0 0 0 .4-6.4a4.6 4.6 0 0 0-8.8-1.1a3.8 3.8 0 0 0-1.1 7.5Z'/>";
const G_SUN = "<circle cx='10' cy='10' r='3.6' class='gf'/><path d='M10 2.2v2.2M10 15.600v2.200M2.200 10h2.200M15.600 10h2.200M4.500 4.500l1.500 1.500M14 14l1.500 1.500M4.500 15.500l1.500-1.500M14 6l1.500-1.500'/>";
const G_MOON = "<path class='gf' d='M13.500 2.800a7.400 7.400 0 1 0 3.700 12.400a6.200 6.200 0 0 1-3.700-12.400Z'/>";
export const glyphFor = (sky: Sky, night: boolean): string =>
  ({
    clear: night ? G_MOON : G_SUN,
    partly: `<g transform='translate(7 -3) scale(.62)'>${night ? G_MOON : G_SUN}</g><g transform='translate(-1 2)'>${G_CLOUD}</g>`,
    cloudy: `<g transform='translate(0 -1)'>${G_CLOUD}</g>`,
    fog: "<path d='M3 6.500h14M5 10h12M3 13.500h11M6 17h10'/>",
    drizzle: `<g transform='translate(0 -4)'>${G_CLOUD}</g><path d='M7 15v1.500M10.500 16v1.500M14 15v1.500'/>`,
    rain: `<g transform='translate(0 -4)'>${G_CLOUD}</g><path d='M7.500 14l-1.300 4M11 14l-1.300 4M14.500 14l-1.300 4'/>`,
    heavy: `<g transform='translate(0 -4)'>${G_CLOUD}</g><path d='M6 13.500l-1.600 5M9.300 13.500l-1.600 5M12.600 13.500l-1.600 5M15.900 13.500l-1.600 5'/>`,
    storm: `<g transform='translate(0 -4)'>${G_CLOUD}</g><path class='gf' d='M11.500 11.500l-4 5h2.600l-1 3.500l4.200-5.200h-2.700Z'/>`,
  })[sky];

export type ChipEls = { phase: HTMLElement | null; wx: HTMLElement | null; pre: HTMLElement | null; glyph: HTMLElement | null; wxT: HTMLElement | null; wxW: HTMLElement | null; time: HTMLElement | null };
export type ChipWords = { phase?: Record<string, string>; wind?: string };

export function createChip(els: ChipEls, words: ChipWords) {
  function show(s: SceneState) {
    const { phase, wx, pre, glyph } = els;
    if (!phase || !wx || !pre || !glyph) return;
    glyph.innerHTML = glyphFor(s.sky, s.cyc > 1.02 && s.cyc < 1.98);
    phase.textContent = words.phase?.[s.phase] ?? "";
    phase.hidden = false;
    wx.hidden = s.temp === null;
    if (els.wxT) els.wxT.textContent = s.temp === null ? "" : `${Math.round(s.temp)}° ${s.label}`;
    if (els.wxW) els.wxW.textContent = s.temp !== null && s.compass ? `, ${words.wind} ${s.kmh} km/h ${s.compass}` : "";
    pre.hidden = !s.preview;
  }
  function time(text: string) {
    if (els.time && els.time.textContent !== text) {
      els.time.textContent = text;
      els.time.setAttribute("datetime", text);
    }
  }
  return { show, time };
}
export type Chip = ReturnType<typeof createChip>;
