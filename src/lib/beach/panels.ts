// What opens: the notebook (Work) and the cream sheet (About · Stack · Contact). The paperback grows out of the towel and
// its cover swings open; pages turn as real leaves; on phones a sheet slides up and can be dragged down by its handle.
// Pure choreography: no tests, no scene state beyond the device capabilities.
import type { SceneView } from "./scene.ts";
import { clamp } from "./math.ts";

export type PanelsEls = {
  panel: HTMLElement | null;
  book: HTMLElement | null;
  ptab: HTMLElement | null;
  secs: HTMLElement[];
  openers: HTMLButtonElement[];
  dockBtns: HTMLButtonElement[];
  spreads: HTMLElement[];
  marks: HTMLButtonElement[];
  marksEl: HTMLElement | null;
  leaves: HTMLElement | null;
  board: HTMLElement | null;
  leaf: HTMLElement | null;
  lid: HTMLElement | null;
  leafF: HTMLElement | null;
  leafB: HTMLElement | null;
  shF: HTMLElement | null;
  shB: HTMLElement | null;
  cast: HTMLElement | null;
  prevBtn: HTMLButtonElement | null;
  nextBtn: HTMLButtonElement | null;
  pgNow: HTMLElement | null;
  grabs: HTMLElement[];
  closes: HTMLElement[];
  copies: HTMLButtonElement[];
};
export type PanelsDeps = {
  /** lite phones: a sheet covers the beach, so the scene stops entirely */
  holdScene(on: boolean): void;
  words: { copy: string; copied: string; copyFailed: string };
};

export function createPanels(scene: SceneView, els: PanelsEls, deps: PanelsDeps) {
  const q = <T extends Element = HTMLElement>(sel: string, p: ParentNode = document) => p.querySelector<T>(sel);
  const qa = <T extends Element = HTMLElement>(sel: string, p: ParentNode = document) => Array.from(p.querySelectorAll<T>(sel));
  const { panel, book, ptab, secs, openers, dockBtns, spreads, marks, marksEl, leaves, board, leaf, lid, leafF, leafB, shF, shB, cast, prevBtn, nextBtn, pgNow, grabs, closes, copies } = els;
  const SPRING = "cubic-bezier(.26,1.38,.44,1)";
  const OUT = "cubic-bezier(.5,0,.8,.4)";
  let openId: string | null = null;
  const live2 = new Map<HTMLElement, Animation[]>();
  const stopAnims = (el: HTMLElement) => {
    (live2.get(el) || []).forEach((a) => a.cancel());
    live2.set(el, []);
  };
  secs.forEach((s) => {
    s.hidden = true;
    Array.from(s.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--n", String(i)));
  });
  const btnFor = (id: string | null) => openers.find((b) => b.dataset.open === id) ?? null;
  const hostOf = (id: string | null) => (id === "work" ? book : id ? panel : null);

  /* the notebook's pages */
  const seen = new Set<number>();
  let active = 0;
  let turning: Animation[] = [];
  let afterTurn: (() => void) | null = null;
  let roleFade: Animation | null = null;
  // headings are "written on" word by word the first time a page is seen
  spreads.forEach((sp) => {
    const h = q("h3", sp);
    if (h && !h.children.length) {
      const words = (h.textContent || "").trim().split(/\s+/);
      h.textContent = "";
      words.forEach((w, i) => {
        const span = document.createElement("span");
        span.className = "jb-w";
        span.style.setProperty("--i", String(i));
        span.textContent = w;
        h.append(span, i < words.length - 1 ? " " : "");
      });
    }
    qa(".jb-built, .jb-notes li", sp).forEach((li, i) => li.style.setProperty("--i", String(i)));
  });
  function paint(i: number) {
    marks.forEach((m, k) => {
      m.setAttribute("aria-selected", String(k === i));
      m.tabIndex = k === i ? 0 : -1;
    });
    if (pgNow) pgNow.textContent = String(i + 1);
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i === spreads.length - 1;
    // phones: the strip only moves when the picked tab is not fully in view — just far enough to show it and a peek of its neighbour
    const m = marks[i];
    if (!marksEl || !m || !scene.caps.sheet) return;
    const lo = m.offsetLeft - 20 - (i > 0 ? 36 : 0);
    const hi = m.offsetLeft + m.offsetWidth + 20 + (i < marks.length - 1 ? 36 : 0) - marksEl.clientWidth;
    const left = marksEl.scrollLeft;
    const to = left > lo ? lo : left < hi ? hi : left;
    if (Math.abs(to - left) > 1) marksEl.scrollTo({ left: to, behavior: scene.caps.calm ? "auto" : "smooth" });
  }
  function show(i: number, ink = true) {
    spreads.forEach((sp, k) => {
      sp.classList.remove("jb-hide-l", "jb-hide-r", "jb-turned", "is-in", "is-new");
      sp.hidden = k !== i;
      if (k === i && ink) {
        void sp.offsetWidth;
        sp.classList.add("is-in");
        if (!seen.has(i)) sp.classList.add("is-new");
      }
    });
    if (ink) seen.add(i);
  }
  function ghost(src: HTMLElement | null, host: HTMLElement, fresh: boolean) {
    if (!src) return;
    const c = src.cloneNode(true) as HTMLElement;
    c.removeAttribute("tabindex");
    c.removeAttribute("aria-label");
    qa("[id]", c).forEach((n) => n.removeAttribute("id"));
    qa("a, button", c).forEach((n) => n.setAttribute("tabindex", "-1"));
    c.classList.add("jb-ghost");
    if (fresh) c.classList.add("jb-ghost-new");
    host.append(c);
    c.scrollTop = src.scrollTop;
  }
  function endTurn() {
    turning.forEach((a) => a.cancel());
    turning = [];
    const fn = afterTurn;
    afterTurn = null;
    fn?.();
  }
  // a real leaf crosses the gutter: its front carries the old right-hand page, its back the new left-hand page
  function turn(from: number, to: number) {
    if (!leaf || !leafF || !leafB || !shF || !shB) return show(to);
    endTurn();
    const fwd = to > from;
    const A = spreads[from];
    const B = spreads[to];
    const front = fwd ? A : B;
    const back = fwd ? B : A;
    leafF.replaceChildren();
    leafB.replaceChildren();
    ghost(q(".jb-pg-r", front), leafF, false);
    ghost(q(".jb-pg-l", back), leafB, fwd && !seen.has(to));
    spreads.forEach((sp, k) => (sp.hidden = k !== from && k !== to));
    A.classList.remove("is-in", "is-new");
    B.classList.remove("is-in", "is-new");
    A.classList.add(fwd ? "jb-hide-r" : "jb-hide-l");
    B.classList.add(fwd ? "jb-hide-l" : "jb-hide-r");
    leaf.classList.add("is-turning");
    cast?.classList.toggle("on-r", !fwd);
    const timing: KeyframeAnimationOptions = { duration: Math.abs(to - from) > 1 ? 560 : 720, easing: "cubic-bezier(.42,.02,.2,1)", fill: "both" };
    const k0 = fwd ? 0 : -180;
    const k1 = fwd ? -180 : 0;
    const bend = fwd ? -3 : 3;
    const main = leaf.animate(
      [
        { transform: `rotateY(${k0}deg) skewY(0deg) scaleX(1)` },
        { transform: `rotateY(${(k0 + k1) / 2 - (fwd ? -28 : 28)}deg) skewY(${bend}deg) scaleX(.985)`, offset: 0.34 },
        { transform: `rotateY(${(k0 + k1) / 2 + (fwd ? -40 : 40)}deg) skewY(${bend * 0.6}deg) scaleX(.985)`, offset: 0.66 },
        { transform: `rotateY(${k1}deg) skewY(0deg) scaleX(1)` },
      ],
      timing,
    );
    const first = fwd ? shF : shB;
    const second = fwd ? shB : shF;
    turning = [main, first.animate([{ opacity: 0 }, { opacity: 0.75, offset: 0.5 }, { opacity: 0.75 }], timing), second.animate([{ opacity: 0.75 }, { opacity: 0.6, offset: 0.5 }, { opacity: 0 }], timing)];
    if (cast) turning.push(cast.animate([{ opacity: 0 }, { opacity: 0, offset: 0.4 }, { opacity: 0.55, offset: 0.62 }, { opacity: 0 }], timing));
    afterTurn = () => {
      leaf.classList.remove("is-turning");
      leafF.replaceChildren();
      leafB.replaceChildren();
      show(active);
      spreads[active].classList.add("jb-turned"); // its right-hand page was already read during the turn
    };
    main.onfinish = endTurn;
  }
  function selectRole(i: number, focus = false) {
    i = clamp(i, 0, spreads.length - 1);
    const from = active;
    active = i;
    paint(i);
    if (focus) marks[i]?.focus({ preventScroll: true });
    if (from === i) return;
    if (openId !== "work" || scene.caps.calm) {
      endTurn();
      show(i);
      if (openId === "work") spreads[i].animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease-out" }); // reduced motion: a plain crossfade
      return;
    }
    if (!scene.caps.sheet) return turn(from, i);
    // phones: one swap, one short fade-in of the whole page — no write-on, no staggered ink, nothing arrives twice
    endTurn();
    roleFade?.cancel();
    show(i, false);
    if (leaves) leaves.scrollTop = 0;
    const dir = i > from ? 1 : -1;
    // (it starts from a faint page rather than from nothing, so a slow phone never shows an empty sheet between the two)
    roleFade = spreads[i].animate([{ transform: `translateX(${dir * 12}px)`, opacity: 0.3 }, { transform: "none", opacity: 1 }], { duration: 160, easing: "cubic-bezier(.2,.7,.3,1)" });
  }
  marks.forEach((m, k) => m.addEventListener("click", () => selectRole(k)));
  prevBtn?.addEventListener("click", () => selectRole(active - 1));
  nextBtn?.addEventListener("click", () => selectRole(active + 1));
  // swipe to turn (touch / pen only, so text stays selectable with a mouse)
  if (leaves) {
    let sx = 0, sy = 0, tracking = false;
    leaves.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      tracking = true;
      sx = e.clientX;
      sy = e.clientY;
    });
    leaves.addEventListener("pointerup", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) selectRole(active + (dx < 0 ? 1 : -1));
    });
    leaves.addEventListener("pointercancel", () => (tracking = false));
  }
  show(0, false);
  paint(0);

  // "start here": one handwritten nudge towards the notebook — wide screens, once per session, never under reduced motion
  let hintTimer = 0;
  function stopHint() {
    window.clearTimeout(hintTimer);
    scene.root.classList.remove("jb-hinting");
  }
  hintTimer = window.setTimeout(() => {
    if (scene.caps.calm || openId || !window.matchMedia("(min-width: 1100px)").matches) return;
    try {
      if (sessionStorage.getItem("jb-hint")) return;
      sessionStorage.setItem("jb-hint", "1");
    } catch {
      return;
    }
    scene.root.classList.add("jb-hinting");
    hintTimer = window.setTimeout(stopHint, 12000);
  }, 2100);

  // how a sheet leaves/returns: from the object on desktop, from below on phones
  function tucked(el: HTMLElement, btn: HTMLElement | null): Keyframe {
    if (scene.caps.sheet || !btn) return { transform: "translateY(100%)", opacity: 1 };
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width * (el === book ? 0.42 : 0.5) - el.offsetLeft;
    const cy = r.top + r.height * 0.55 - el.offsetTop;
    el.style.transformOrigin = `${cx.toFixed(0)}px ${cy.toFixed(0)}px`;
    return { transform: el === book ? "scale(0.07) rotate(-13deg)" : "scale(0.06) rotate(-9deg)", opacity: 0 };
  }
  function tuckGhost(oldBtn: HTMLElement | null) {
    if (!panel || scene.caps.calm || scene.caps.sheet) return; // phones: the sheet simply slides up again with the new section
    const g = panel.cloneNode(true) as HTMLElement;
    g.removeAttribute("id");
    qa("[id]", g).forEach((n) => n.removeAttribute("id"));
    g.setAttribute("aria-hidden", "true");
    g.setAttribute("inert", "");
    g.style.zIndex = "19";
    panel.after(g);
    const to = tucked(g, oldBtn);
    const a = g.animate([{ transform: "none", opacity: 1 }, { ...to, opacity: scene.caps.sheet ? 1 : 0.2 }], { duration: 220, easing: OUT, fill: "forwards" });
    a.onfinish = a.oncancel = () => g.remove();
  }
  // the cover: a leaf of its own. While it swings across the gutter the left half of the book does not exist yet.
  const HALF = "inset(-70px -70px -70px 50%)";
  const FULL = "inset(-70px -70px -70px -70px)";
  function coverAnims(opening: boolean, delay: number, duration: number): Animation[] {
    if (!lid || !board) return [];
    const t: KeyframeAnimationOptions = { duration, delay, fill: "both" };
    const swing = opening
      ? [{ transform: "rotateY(0deg)", easing: "cubic-bezier(.5,0,.9,.6)" }, { transform: "rotateY(-90deg)", offset: 0.5, easing: "cubic-bezier(.1,.5,.3,1)" }, { transform: "rotateY(-180deg)" }]
      : [{ transform: "rotateY(-180deg)", easing: "cubic-bezier(.5,0,.9,.6)" }, { transform: "rotateY(-90deg)", offset: 0.5, easing: "cubic-bezier(.1,.5,.3,1)" }, { transform: "rotateY(0deg)" }];
    const clip = opening ? [{ clipPath: HALF, easing: "steps(1, end)" }, { clipPath: FULL, offset: 0.5 }, { clipPath: FULL }] : [{ clipPath: FULL, easing: "steps(1, end)" }, { clipPath: HALF, offset: 0.5 }, { clipPath: HALF }];
    return [lid.animate(swing, t), board.animate(clip, t)];
  }
  // phones: which section the cream sheet holds. Done on pointerdown already, so it is laid out and painted before the slide starts.
  function fillPanel(id: string) {
    if (!panel || panel.dataset.open === id) return;
    const ink = !scene.caps.sheet; // the staggered ink-in is for the desktop card; a sheet arrives complete
    secs.forEach((s) => {
      const on = s.dataset.sec === id;
      s.hidden = !on;
      s.classList.toggle("is-in", on && ink);
      if (on) {
        panel.style.setProperty("--mark", s.style.getPropertyValue("--mark") || "#ffd25e");
        if (ptab) ptab.textContent = q("h2", s)?.textContent || "";
      }
    });
    panel.dataset.open = id;
    panel.setAttribute("aria-labelledby", `jb-h-${id}`);
    const sc = q(".jb-scroll", panel);
    if (sc) sc.scrollTop = 0;
  }
  function finishHide(el: HTMLElement) {
    el.classList.remove("is-open", "is-leaving", "jb-opening", "jb-closing");
    el.style.transform = "";
    el.inert = true; // a parked sheet is still rendered on phones: keep it out of the tab order and the accessibility tree
    deps.holdScene(!!openId);
    if (el === panel) secs.forEach((s) => s.classList.remove("is-in"));
    else endTurn();
  }
  function animateOut(el: HTMLElement, btn: HTMLElement | null) {
    stopAnims(el);
    if (scene.caps.calm) return finishHide(el);
    el.classList.add("is-leaving");
    const cur = el.style.transform || "none";
    el.style.transform = "";
    const shrink = (delay: number) => {
      const a = el.animate([{ transform: cur, opacity: 1 }, tucked(el, btn)], { duration: scene.caps.sheet ? 220 : 210, delay, easing: scene.caps.sheet ? "cubic-bezier(.4,0,1,1)" : OUT, fill: "both" });
      a.onfinish = () => {
        finishHide(el);
        stopAnims(el);
      };
      return a;
    };
    if (el === book && !scene.caps.sheet) {
      endTurn();
      el.classList.remove("jb-opening");
      el.classList.add("jb-closing");
      live2.set(el, [...coverAnims(false, 0, 300), shrink(250)]);
    } else live2.set(el, [shrink(0)]);
  }
  function openPanel(id: string, focus = true) {
    const host = hostOf(id);
    if (!host) return;
    const btn = btnFor(id);
    if (openId === id) return closePanel();
    stopHint();
    if (openId) {
      const oldHost = hostOf(openId);
      const oldBtn = btnFor(openId);
      oldBtn?.setAttribute("aria-expanded", "false");
      if (oldHost === host) tuckGhost(oldBtn);
      else if (oldHost) animateOut(oldHost, oldBtn);
    }
    stopAnims(host);
    host.classList.remove("is-leaving", "jb-closing", "jb-opening");
    host.style.transform = "";
    openId = id;
    if (host === panel) {
      if (!scene.caps.sheet) delete panel.dataset.open; // desktop: always re-inked
      fillPanel(id);
      const sc = q(".jb-scroll", panel);
      if (sc) sc.scrollTop = 0;
    }
    host.dataset.open = id;
    host.inert = false;
    host.classList.add("is-open");
    deps.holdScene(true);
    scene.root.dataset.panel = id;
    btn?.setAttribute("aria-expanded", "true");
    dockBtns.forEach((d) => (d.dataset.go === id ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
    if (host === book) {
      paint(active);
      if (leaves && scene.caps.sheet) leaves.scrollTop = 0;
    }
    if (scene.caps.calm) {
      if (host === book) show(active);
    } else if (host === book && !scene.caps.sheet && lid) {
      // the paperback grows out of the towel, then its cover swings open
      show(active, false);
      host.classList.add("jb-opening");
      const from = tucked(host, btn);
      const grow = host.animate([from, { opacity: 1, offset: 0.4 }, { transform: "none", opacity: 1 }], { duration: 400, easing: SPRING });
      const cover = coverAnims(true, 170, 600);
      live2.set(host, [grow, ...cover]);
      if (cover[0])
        cover[0].onfinish = () => {
          stopAnims(host);
          host.classList.remove("jb-opening");
          show(active);
          spreads[active].classList.add("jb-turned");
        };
    } else if (scene.caps.sheet) {
      // phones: the sheet is already laid out and painted below the screen — a plain slide up, transform only, no overshoot
      if (host === book) show(active, false);
      live2.set(host, [host.animate([{ transform: "translateY(100%)" }, { transform: "none" }], { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" })]);
    } else {
      if (host === book) show(active);
      const from = tucked(host, btn);
      live2.set(host, [host.animate([from, { opacity: 1, offset: 0.4 }, { transform: "none", opacity: 1 }], { duration: 340, easing: SPRING })]);
    }
    if (focus) (host === book ? marks[active] ?? host : host).focus({ preventScroll: true });
    history.replaceState(null, "", `${location.pathname}${location.search}#${id}`);
  }
  function closePanel(returnFocus = true) {
    const host = hostOf(openId);
    if (!host || !openId) return;
    const btn = btnFor(openId);
    const hadFocus = host.contains(document.activeElement) || dockBtns.includes(document.activeElement as HTMLButtonElement);
    btn?.setAttribute("aria-expanded", "false");
    openId = null;
    delete scene.root.dataset.panel;
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    if (returnFocus && hadFocus) btn?.focus({ preventScroll: true });
    animateOut(host, btn);
  }
  openers.forEach((b) => b.addEventListener("click", () => openPanel(b.dataset.open || "")));
  openers.forEach((b) => b.addEventListener("pointerdown", () => scene.caps.sheet && !openId && b.dataset.open !== "work" && fillPanel(b.dataset.open || ""), { passive: true }));
  for (const h of [panel, book]) if (h) h.inert = true;
  dockBtns.forEach((d) => d.addEventListener("click", () => d.dataset.go !== openId && openPanel(d.dataset.go || "")));
  closes.forEach((c) => c.addEventListener("click", () => closePanel()));
  document.addEventListener("keydown", (e) => {
    if (!openId) return;
    if (e.key === "Escape") {
      e.preventDefault();
      const btn = btnFor(openId);
      closePanel(false);
      btn?.focus({ preventScroll: true });
    } else if (openId === "work" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const onMark = marks.includes(document.activeElement as HTMLButtonElement);
      const to = ({ ArrowRight: active + 1, ArrowLeft: active - 1, PageDown: active + 1, PageUp: active - 1, Home: 0, End: spreads.length - 1 } as Record<string, number>)[e.key];
      if (to === undefined || ((e.key === "Home" || e.key === "End" || e.key.startsWith("Page")) && !onMark)) return;
      e.preventDefault();
      selectRole(to, onMark);
    }
  });
  // clicking the beach puts things back
  document.addEventListener("pointerdown", (e) => {
    if (!openId) return;
    const t = e.target as Element | null;
    if (t?.closest(".jb-panel, .jb-book, .jb-dock, .jb-obj, .jb-top")) return;
    closePanel(false);
  });
  // phones: drag a sheet down by its handle
  grabs.forEach((grab) => {
    const host = grab.closest<HTMLElement>(".jb-panel, .jb-book");
    if (!host) return;
    let y0 = 0, dy = 0, on = false;
    grab.addEventListener("pointerdown", (e) => {
      if (!scene.caps.sheet) return;
      on = true;
      y0 = e.clientY;
      dy = 0;
      stopAnims(host);
      grab.setPointerCapture(e.pointerId);
    });
    grab.addEventListener("pointermove", (e) => {
      if (!on) return;
      dy = Math.max(0, e.clientY - y0);
      host.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      if (!on) return;
      on = false;
      if (dy > 90) return closePanel();
      if (dy > 0 && !scene.caps.calm) live2.set(host, [host.animate([{ transform: `translateY(${dy}px)` }, { transform: "none" }], { duration: 300, easing: SPRING })]);
      host.style.transform = "";
    };
    grab.addEventListener("pointerup", end);
    grab.addEventListener("pointercancel", end);
  });

  // contact: copy the address
  copies.forEach((btn) => {
    const label = q(".jb-copy-t", btn);
    let timer = 0;
    btn.addEventListener("click", async () => {
      let ok = true;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy || "");
      } catch {
        ok = false;
      }
      if (label) label.textContent = ok ? deps.words.copied : deps.words.copyFailed;
      btn.classList.toggle("ok", ok);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = deps.words.copy;
        btn.classList.remove("ok");
      }, 1800);
    });
  });

  return {
    open: openPanel,
    close: closePanel,
    /** the deep link: is there a panel by that name? */
    has: (id: string) => !!btnFor(id),
    get openId() { return openId; },
  };
}
