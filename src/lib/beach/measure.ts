// Painting → screen mapping, and where the four things sit. The painting is 1600×1000 and covers the viewport; the
// objects on the sand, the court, the habitat board and the 404 digits are placed from the fit.
import type { Scene } from "./scene.ts";
import { HORIZON, SHORE, yAt } from "./shore.ts";
import { clamp } from "./math.ts";

export type MeasureEls = { sceneEl: HTMLElement | null; placed: HTMLElement[] };
export type Viewport = { innerWidth: number; innerHeight: number };

export function createMeasure(scene: Scene, els: MeasureEls, viewport: Viewport = window) {
  const { fit, root } = scene;
  const shoreY = (x: number) => yAt(SHORE, x);
  let measuredWidth = 0, measuredHeight = 0;
  /** re-fits the painting when the viewport changed; returns whether it did */
  function measure(): boolean {
    // Match the painting's 100svh canvas, which stays put when mobile browser chrome moves.
    const viewportWidth = els.sceneEl?.clientWidth || viewport.innerWidth;
    const viewportHeight = els.sceneEl?.clientHeight || viewport.innerHeight;
    if (viewportWidth === measuredWidth && viewportHeight === measuredHeight) return false;
    measuredWidth = viewportWidth;
    measuredHeight = viewportHeight;
    const W = viewportWidth + 48;
    const H = viewportHeight + 48;
    fit.s = Math.max(W / 1600, H / 1000);
    fit.ox = (W - 1600 * fit.s) / 2 - 24;
    fit.oy = (H - 1000 * fit.s) / 2 - 24;
    fit.left = -fit.ox / fit.s;
    fit.width = viewportWidth / fit.s;
    fit.portrait = fit.width < 1100;
    const st = root.style;
    st.setProperty("--fs", fit.s.toFixed(4));
    st.setProperty("--ox", `${fit.ox.toFixed(1)}px`);
    st.setProperty("--oy", `${fit.oy.toFixed(1)}px`);
    st.setProperty("--hz", `${((H - 1000 * fit.s) / 2 + HORIZON * fit.s).toFixed(1)}px`);
    // a portrait screen only sees the middle of the painting: the things gather there, a little smaller
    const k = fit.portrait ? clamp(viewportWidth / 780, 0.46, 0.64) : clamp(fit.width / 1500, 0.78, 1);
    st.setProperty("--k", k.toFixed(3));
    const bottom = (viewportHeight - fit.oy) / fit.s; // painting-y of the screen's bottom edge
    for (const el of els.placed) {
      const d = el.dataset;
      const fx = Number(fit.portrait ? d.pfx : d.fx);
      const x = fit.left + fx * fit.width;
      const sh = fit.portrait ? d.pshore : d.shore;
      let y = sh ? shoreY(x) + Number(sh) : Number(d.y);
      if (fit.portrait && d.prow) {
        // two rows on the sand: towel + cooler along the bottom, the guarda-sol standing clear above them
        // Keep the foreground props below a full-width court on portrait screens.
        const screenY = d.prow === "bottom" ? viewportHeight - 54 : d.prow === "top" ? viewportHeight * 0.56 : viewportHeight - 80;
        y = (screenY - fit.oy) / fit.s;
      } else if (fit.portrait && el.classList.contains("jb-o-contact")) y = (viewportHeight * 0.56 - fit.oy) / fit.s;
      else y = Math.min(y, bottom - 84 / fit.s + (el.classList.contains("jb-ball") ? 30 : 0));
      el.style.setProperty("--x", x.toFixed(1));
      el.style.setProperty("--y", y.toFixed(1));
    }
    // the beach-tennis court lies further along the sand, parallel to the shore and clear of the biggest wave
    let cx = Math.min(fit.left + fit.width * 0.76, 1195); // …and of the palm fronds
    let cy = shoreY(cx) + 68;
    let ck = 0.8;
    if (fit.portrait) {
      // The court gets its own middle row, rather than shrinking into a leftover gap.
      cx = fit.left + fit.width * 0.44;
      ck = fit.width * 0.80 / 380;
      cy = (viewportHeight * 0.725 - fit.oy) / fit.s;
    }
    st.setProperty("--bt-x", cx.toFixed(1));
    st.setProperty("--bt-y", cy.toFixed(1));
    st.setProperty("--bt-k", ck.toFixed(3));
    st.setProperty("--hb-x", (fit.portrait ? fit.left + fit.width * 0.84 : cx + 205).toFixed(1));
    st.setProperty("--hb-y", (fit.portrait ? Math.min(cy - 8, (viewportHeight - 54 - 230 * k * fit.s - 86 - fit.oy) / fit.s) : cy - 8).toFixed(1));
    st.setProperty("--hb-w", (fit.portrait ? 90 / fit.s : 138).toFixed(1));
    if (scene.notFound) {
      // "404" sits on the open sand in front of the court: left of centre on a wide screen, a bottom row on a portrait one
      const nw = fit.portrait ? fit.width * 0.8 : clamp(fit.width * 0.44, 460, 680);
      st.setProperty("--nf-x", (fit.left + fit.width * (fit.portrait ? 0.5 : 0.4)).toFixed(1));
      st.setProperty("--nf-y", (fit.portrait ? (viewportHeight * 0.885 - fit.oy) / fit.s : Math.min(820, bottom - nw * 0.2 - 70 / fit.s)).toFixed(1));
      st.setProperty("--nf-w", nw.toFixed(1));
    }
    return true;
  }
  return { measure, get width() { return measuredWidth; }, get height() { return measuredHeight; } };
}
export type Measure = ReturnType<typeof createMeasure>;
