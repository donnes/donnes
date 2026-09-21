/** Draw the existing SVG contours on one bounded canvas instead of animating inherited SVG styles. */
function geometry(el: SVGGeometryElement): Path2D {
  const n = (key: string) => Number(el.getAttribute(key)) || 0;
  const path = new Path2D();
  switch (el.localName) {
    case 'path': return new Path2D(el.getAttribute('d') || '');
    case 'rect': {
      const rx = n('rx'), ry = el.hasAttribute('ry') ? n('ry') : rx;
      path.roundRect(n('x'), n('y'), n('width'), n('height'), [{ x: rx, y: ry }]); break;
    }
    case 'circle': path.arc(n('cx'), n('cy'), n('r'), 0, Math.PI * 2); break;
    case 'ellipse': path.ellipse(n('cx'), n('cy'), n('rx'), n('ry'), 0, 0, Math.PI * 2); break;
    case 'line': path.moveTo(n('x1'), n('y1')); path.lineTo(n('x2'), n('y2')); break;
    default: {
      const points = (el as SVGPolylineElement).points;
      for (let i = 0; i < points.numberOfItems; i++) {
        const p = points.getItem(i);
        if (i) path.lineTo(p.x, p.y); else path.moveTo(p.x, p.y);
      }
      if (el.localName === 'polygon') path.closePath();
    }
  }
  return path;
}

type Ink = { path: Path2D; matrix: DOMMatrix; length: number; fill: boolean; alpha: number; delay: number; clips: Path2D[]; text?: { value: string; font: string; x: number; y: number; align: CanvasTextAlign } };
export async function prepareBeachDrawing(paint: HTMLElement, contours: (SVGGeometryElement | SVGUseElement | SVGTextElement)[], width: number, height: number) {
  const canvas = document.createElement('canvas');
  // Pencil lines do not need the phone's full 3x backing store.
  const dpr = Math.min(devicePixelRatio, 1.5);
  canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
  canvas.style.cssText = `width:${width}px;height:${height}px;display:block`;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas unavailable');
  const inks: Ink[] = [];
  const styles = new Map<Element, CSSStyleDeclaration>();
  const style = (el: Element) => { let s = styles.get(el); if (!s) { s = getComputedStyle(el); styles.set(el, s); } return s; };
  const alphas = new Map<Element, number>();
  const alpha = (el: Element): number => {
    if (el === paint) return 1;
    const cached = alphas.get(el); if (cached !== undefined) return cached;
    const s = style(el);
    const value = s.display === 'none' || s.visibility === 'hidden' ? 0 : Number(s.opacity) * (el.parentElement ? alpha(el.parentElement) : 1);
    alphas.set(el, value); return value;
  };
  const clipAt = (el: Element, matrix: DOMMatrix): Path2D | null => {
    const ref = el.getAttribute('clip-path')?.match(/url\(#([^)]*)\)/)?.[1];
    const def = ref && document.getElementById(ref);
    if (!def) return null;
    const clip = new Path2D();
    for (const part of def.querySelectorAll<SVGGeometryElement>('path,rect,circle,ellipse,polygon,polyline')) {
      const local = part.transform.baseVal.consolidate()?.matrix;
      clip.addPath(geometry(part), local ? matrix.multiply(local) : matrix);
    }
    return clip;
  };
  const clipCache = new Map<Element, Path2D[]>();
  const clips = (el: Element): Path2D[] => {
    const cached = clipCache.get(el); if (cached) return cached;
    const result = el.parentElement && el !== paint ? [...clips(el.parentElement)] : [];
    const matrix = el instanceof SVGGraphicsElement ? el.getScreenCTM() : null;
    const clip = matrix && clipAt(el, matrix);
    if (clip) result.push(clip);
    clipCache.set(el, result); return result;
  };
  const add = (el: SVGGeometryElement, matrix: DOMMatrix, opacity: number, clipPaths: Path2D[], inheritedFill?: string) => {
    const s = style(el);
    inks.push({ path: geometry(el), matrix, length: el.getTotalLength(), fill: (el.hasAttribute('fill') || el.hasAttribute('class') ? s.fill : inheritedFill ?? s.fill) !== 'none', alpha: opacity, delay: 0, clips: clipPaths });
  };
  // <use> definitions are read in place; no expanded DOM copy or second scene layout is needed.
  const instance = (el: SVGElement, matrix: DOMMatrix, opacity: number, clipPaths: Path2D[], fill: string, depth = 0) => {
    if (depth > 12) return;
    const s = style(el);
    if (s.display === 'none') return;
    opacity *= Number(s.opacity);
    if (!opacity) return;
    if (el instanceof SVGGraphicsElement) {
      const local = el.transform.baseVal.consolidate()?.matrix;
      if (local) matrix = matrix.multiply(local);
    }
    const clip = clipAt(el, matrix);
    if (clip) clipPaths = [...clipPaths, clip];
    fill = el.hasAttribute('fill') || el.hasAttribute('class') ? s.fill : fill;
    if (el instanceof SVGUseElement) {
      const ref = document.getElementById(el.href.baseVal.slice(1));
      if (ref instanceof SVGElement) instance(ref, matrix.translate(el.x.baseVal.value, el.y.baseVal.value), opacity, clipPaths, fill, depth + 1);
    } else if (el instanceof SVGGeometryElement) add(el, matrix, opacity, clipPaths, fill);
    else for (const child of el.children) if (child instanceof SVGElement) instance(child, matrix, opacity, clipPaths, fill, depth + 1);
  };
  let batch = performance.now();
  for (const el of contours) {
    const deckSvg = el.closest<SVGSVGElement>('.jb-deck-drawing');
    const deck = deckSvg?.parentElement;
    const opacity = alpha(deck || el);
    if (!opacity) continue;
    const rect = (deck || el).getBoundingClientRect();
    if (rect.right < 0 || rect.bottom < 0 || rect.left > width || rect.top > height) continue;
    const box = deckSvg?.viewBox.baseVal;
    const matrix = box && deck ? new DOMMatrix().translate(rect.x, rect.y).scale(rect.width / box.width, rect.height / box.height).translate(-box.x, -box.y) : el.getScreenCTM();
    if (!matrix) continue;
    if (el instanceof SVGUseElement) {
      const ref = document.getElementById(el.href.baseVal.slice(1));
      if (ref instanceof SVGElement) instance(ref, matrix.translate(el.x.baseVal.value, el.y.baseVal.value), opacity, clips(el), style(el).fill);
    } else if (el instanceof SVGTextElement) {
      const s = style(el);
      inks.push({ path: new Path2D(), matrix, length: 0, fill: false, alpha: opacity, delay: 0, clips: clips(el), text: {
        value: el.textContent || '', font: s.font, x: el.x.baseVal.numberOfItems ? el.x.baseVal.getItem(0).value : 0, y: el.y.baseVal.numberOfItems ? el.y.baseVal.getItem(0).value : 0,
        align: s.textAnchor === 'middle' ? 'center' : s.textAnchor === 'end' ? 'right' : 'left',
      } });
    } else add(el, matrix, opacity, clips(el));
    if (performance.now() - batch > 6) { await new Promise<void>(resolve => requestAnimationFrame(() => resolve())); batch = performance.now(); }
  }
  inks.forEach((ink, i) => ink.delay = i / Math.max(1, inks.length - 1) * 450);
  const draw = (elapsed: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.fillStyle = '#f5f0e5'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#777166'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const ink of inks) {
      ctx.save();
      for (const clip of ink.clips) ctx.clip(clip);
      const m = ink.matrix;
      ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      ctx.globalAlpha = ink.alpha;
      if (ink.fill) { ctx.fillStyle = '#f5f0e5'; ctx.fill(ink.path); }
      const progress = Math.max(0, Math.min(1, (elapsed - ink.delay) / 900));
      if (ink.text && progress) {
        ctx.fillStyle = '#777166'; ctx.font = ink.text.font; ctx.textAlign = ink.text.align;
        ctx.globalAlpha *= progress;
        ctx.fillText(ink.text.value, ink.text.x, ink.text.y);
      }
      if (progress && ink.length > 0) {
        ctx.lineWidth = 0.8 / Math.max(0.01, Math.hypot(m.a, m.b));
        ctx.setLineDash(progress === 1 ? [] : [ink.length, ink.length]);
        ctx.lineDashOffset = ink.length * (1 - progress);
        ctx.stroke(ink.path);
      }
      ctx.restore();
    }
  };
  draw(0);
  return { canvas, draw };
}
