// The loading intro: the actual SVG geometry, shared layers and every beach object, traced as outlines on paper, then
// the paint fades in. `pending` gates the clock from the first line of boot; start() builds the drawing once the first
// state has been painted underneath the paper.
import type { SceneView } from "./scene.ts";
import { prepareBeachDrawing } from "../beach-drawing.ts";

export type IntroEls = { sceneEl: HTMLElement | null; sources: HTMLElement[]; world: HTMLElement | null };
export type IntroDeps = {
  /** the fitted viewport, so a resize during the intro can abort it */
  size: () => { width: number; height: number };
  /** a sheet holds the scene (lite phones) */
  held: () => boolean;
  /** the paper is gone: start the clock, take the weather that arrived meanwhile, set the rates */
  finished: () => void;
};

export function createIntro(scene: SceneView, els: IntroEls, deps: IntroDeps) {
  const root = scene.root;
  let pending = root.classList.contains("jb-intro") && !scene.caps.calm;
  let blending = false; // the paper is fading: the paint underneath is on show and must hold still
  function start() {
    if (!pending) return;
    const q = <T extends Element = HTMLElement>(sel: string, p: ParentNode) => Array.from(p.querySelectorAll<T>(sel));
    const draft = document.createElement("div");
    draft.className = "jb-draft";
    draft.dataset.phase = "prepare";
    draft.setAttribute("aria-hidden", "true");
    draft.inert = true;
    const paint = document.createElement("div"); // Paper only, until the canvas has read the contours.
    const drawingSources = els.sources;
    draft.append(paint);
    els.world?.append(draft);
    root.classList.add("jb-draft-ready");
    // Release the descendant CSS pause while paper still covers the scene. Keep the
    // animation objects paused so the final handoff needs no whole-scene restyle.
    const pausedScene = document.getAnimations().filter(animation => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return target instanceof Element && !draft.contains(target) && drawingSources.some(source => source.contains(target));
    });
    pausedScene.forEach(animation => animation.pause());
    root.classList.add("jb-intro-prepared");

    // One canvas draws the contours in place: no second copy of the scene, no inherited stroke style to recalculate each frame.
    const contours = drawingSources.flatMap(source => q<SVGGeometryElement | SVGUseElement | SVGTextElement>("path, rect, circle, ellipse, line, polyline, polygon, use, text", source))
      .filter((el) => !el.closest("defs, clipPath, mask"));
    let drawingRaf = 0;
    let drawingTime = 0;
    let drawingLast = 0;
    let reveal: Animation | undefined;
    const calmChanged = () => finishIntro();
    const finishIntro = () => {
      if (!pending) return;
      pending = false;
      blending = false;
      cancelAnimationFrame(drawingRaf);
      draft.remove();
      reveal?.cancel();
      root.classList.add("jb-intro-done");
      if (!deps.held() && !document.hidden && !scene.caps.calm) pausedScene.forEach(animation => animation.play());
      window.removeEventListener("resize", resizeIntro);
      window.matchMedia("(prefers-reduced-motion: reduce)").removeEventListener("change", calmChanged);
      document.removeEventListener("visibilitychange", syncReveal);
      deps.finished();
    };
    const syncReveal = () => {
      drawingLast = 0;
      if (document.hidden) reveal?.pause();
      else reveal?.play();
    };
    const { width: introWidth, height: introHeight } = deps.size();
    const resizeIntro = () => {
      if (els.sceneEl?.clientWidth !== introWidth || els.sceneEl?.clientHeight !== introHeight) finishIntro();
    };
    window.addEventListener("resize", resizeIntro);
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", calmChanged, { once: true });
    document.addEventListener("visibilitychange", syncReveal);
    // Trace contours in overlapping passes, then let the paint show through.
    // One animation per SVG inherits down to its paths, rather than one per contour.
    const fadeToPaint = () => {
      draft.dataset.phase = "color";
      blending = true;
      reveal = draft.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 700, easing: "ease", fill: "both",
      });
      syncReveal();
      void reveal.finished.then(finishIntro, finishIntro);
    };
    void prepareBeachDrawing(root, contours, introWidth, introHeight).then(({ canvas, draw }) => {
      if (!pending) return;
      paint.replaceWith(canvas);
      const trace = (now: number) => {
        if (!pending) return;
        if (!document.hidden && drawingLast) drawingTime += Math.min(50, now - drawingLast);
        drawingLast = now;
        if (drawingTime > 0 && draft.dataset.phase !== "drawing") draft.dataset.phase = "drawing";
        draw(drawingTime);
        if (drawingTime >= 1350) fadeToPaint();
        else drawingRaf = requestAnimationFrame(trace);
      };
      drawingRaf = requestAnimationFrame(trace);
    }).catch(finishIntro);
  }
  return { start, get pending() { return pending; }, get blending() { return blending; } };
}
export type Intro = ReturnType<typeof createIntro>;
