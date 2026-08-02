const openButton = document.getElementById('openButton');
const scene = document.getElementById('scene');
const canvas = document.getElementById('bouquetCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

const DURATION = 9.2;
let startTime = null;
let running = false;
let fixedPreviewTime = null;
let messageTimer = null;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
const easeInOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const backOut = t => {
  t = clamp(t);
  const c1 = 1.22;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const segment = (time, start, duration) => clamp((time - start) / duration);

const palettes = {
  pink: ['#fff9f8', '#f5d4dd', '#dc8ea2', '#8c485f'],
  rose: ['#ffeef2', '#edb4c2', '#cb6f89', '#7f3b54'],
  ivory: ['#fffdf7', '#f5ebdc', '#ddb99b', '#9f7452'],
  peach: ['#fff8f0', '#f1d4c8', '#dca18e', '#a4675d'],
  champagne: ['#fffaf2', '#f3e0ca', '#d6b18f', '#967052'],
  mauve: ['#f8e1e7', '#dfa6b5', '#ba7187', '#7d4256'],
  white: ['#ffffff', '#f7f1eb', '#dfd5cc', '#a99186']
};

const flowers = [
  { x: 58,  y: 310, s: 40, c: 'mauve',     start: 4.10, rot: -.24, type: 'rose' },
  { x: 86,  y: 266, s: 45, c: 'pink',      start: 4.18, rot: -.18, type: 'rose' },
  { x: 126, y: 228, s: 48, c: 'rose',      start: 4.26, rot: -.10, type: 'peony' },
  { x: 172, y: 202, s: 44, c: 'ivory',     start: 4.34, rot: -.04, type: 'rose' },
  { x: 214, y: 190, s: 42, c: 'champagne', start: 4.42, rot:  0,   type: 'ranunculus' },
  { x: 258, y: 202, s: 45, c: 'ivory',     start: 4.50, rot: .05,  type: 'peony' },
  { x: 302, y: 232, s: 48, c: 'pink',      start: 4.58, rot: .12,  type: 'rose' },
  { x: 338, y: 274, s: 44, c: 'rose',      start: 4.66, rot: .20,  type: 'rose' },
  { x: 366, y: 318, s: 38, c: 'champagne', start: 4.74, rot: .25,  type: 'ranunculus' },

  { x: 86,  y: 350, s: 48, c: 'ivory',     start: 4.82, rot: -.18, type: 'rose' },
  { x: 128, y: 322, s: 55, c: 'pink',      start: 4.90, rot: -.10, type: 'peony' },
  { x: 170, y: 294, s: 57, c: 'peach',     start: 4.98, rot: -.05, type: 'rose' },
  { x: 212, y: 282, s: 74, c: 'pink',      start: 5.06, rot: 0,    type: 'peony', hero: true },
  { x: 256, y: 294, s: 57, c: 'ivory',     start: 5.14, rot: .05,  type: 'rose' },
  { x: 298, y: 324, s: 55, c: 'rose',      start: 5.22, rot: .11,  type: 'peony' },
  { x: 338, y: 352, s: 48, c: 'champagne', start: 5.30, rot: .17,  type: 'rose' },

  { x: 118, y: 382, s: 40, c: 'champagne', start: 5.38, rot: -.12, type: 'ranunculus' },
  { x: 160, y: 368, s: 43, c: 'rose',      start: 5.46, rot: -.06, type: 'rose' },
  { x: 204, y: 368, s: 42, c: 'ivory',     start: 5.54, rot: -.02, type: 'ranunculus' },
  { x: 246, y: 368, s: 44, c: 'peach',     start: 5.62, rot: .04,  type: 'rose' },
  { x: 288, y: 382, s: 40, c: 'champagne', start: 5.70, rot: .10,  type: 'ranunculus' },

  { x: 148, y: 250, s: 33, c: 'ivory',     start: 5.78, rot: -.08, type: 'rose' },
  { x: 230, y: 238, s: 35, c: 'peach',     start: 5.86, rot: .06,  type: 'rose' },
  { x: 274, y: 258, s: 31, c: 'white',     start: 5.94, rot: .05,  type: 'ranunculus' }
];

const hydrangeas = [
  { x: 104, y: 402, s: 46, c: 'ivory', start: 5.28 },
  { x: 154, y: 410, s: 42, c: 'peach', start: 5.38 },
  { x: 216, y: 414, s: 48, c: 'white', start: 5.48 },
  { x: 278, y: 408, s: 44, c: 'peach', start: 5.58 },
  { x: 326, y: 400, s: 46, c: 'ivory', start: 5.68 }
];

const stems = flowers.map((f, i) => {
  const spread = (f.x - 210) * .42;
  const baseX = 210 + Math.max(-42, Math.min(42, spread));
  return [[baseX, 646], [210 + spread * .55, 500 - (i % 4) * 8], [f.x, f.y]];
});

const leaves = [
  { x: 72,  y: 426, s: 34, a: -2.38, start: 3.70 },
  { x: 98,  y: 448, s: 34, a: -2.25, start: 3.78 },
  { x: 126, y: 462, s: 32, a: -2.10, start: 3.86 },
  { x: 156, y: 474, s: 30, a: -1.96, start: 3.94 },
  { x: 260, y: 474, s: 30, a: .40,  start: 4.02 },
  { x: 292, y: 462, s: 32, a: .54,  start: 4.10 },
  { x: 322, y: 446, s: 34, a: .70,  start: 4.18 },
  { x: 350, y: 426, s: 34, a: .84,  start: 4.26 },
  { x: 120, y: 356, s: 24, a: -1.38, start: 4.34 },
  { x: 158, y: 386, s: 22, a: -1.72, start: 4.42 },
  { x: 252, y: 386, s: 22, a: .20,  start: 4.50 },
  { x: 302, y: 358, s: 24, a: .96,  start: 4.58 }
];

const fillers = [
  { x: 72,  y: 286, start: 4.78 },
  { x: 104, y: 202, start: 4.86 },
  { x: 150, y: 188, start: 4.94 },
  { x: 194, y: 174, start: 5.02 },
  { x: 238, y: 176, start: 5.10 },
  { x: 282, y: 192, start: 5.18 },
  { x: 324, y: 212, start: 5.26 },
  { x: 354, y: 300, start: 5.34 }
];

const sprigs = [];

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawFrame(fixedPreviewTime ?? (running && startTime ? (performance.now() - startTime) / 1000 : 0));
}

function resetTransformForCssPixels() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function bezierPoint(p0, p1, p2, t) {
  const u = 1 - t;
  return [u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]];
}

function drawStem(points, progress) {
  if (progress <= 0) return;
  const steps = 56;
  const count = Math.max(1, Math.floor(steps * progress));
  ctx.save();
  ctx.lineWidth = 3.6;
  ctx.lineCap = 'round';
  const grad = ctx.createLinearGradient(points[0][0], points[0][1], points[2][0], points[2][1]);
  grad.addColorStop(0, '#183621');
  grad.addColorStop(.5, '#5f8465');
  grad.addColorStop(1, '#254c32');
  ctx.strokeStyle = grad;
  ctx.beginPath();
  const pStart = bezierPoint(points[0], points[1], points[2], 0);
  ctx.moveTo(pStart[0], pStart[1]);
  for (let i = 1; i <= count; i++) {
    const p = bezierPoint(points[0], points[1], points[2], i / steps);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
  ctx.restore();
}

function drawLeaf(leaf, progress) {
  if (progress <= 0) return;
  const p = backOut(progress);
  ctx.save();
  ctx.translate(leaf.x, leaf.y);
  ctx.rotate(leaf.a);
  ctx.scale(p, p);
  ctx.globalAlpha = clamp(progress * 1.35);
  const g = ctx.createLinearGradient(0, 0, leaf.s, -leaf.s * .2);
  g.addColorStop(0, '#294333');
  g.addColorStop(.46, '#718f75');
  g.addColorStop(1, '#becbb7');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(leaf.s * .18, -leaf.s * .82, leaf.s * .94, -leaf.s * .74, leaf.s, -leaf.s * .06);
  ctx.bezierCurveTo(leaf.s * .72, leaf.s * .23, leaf.s * .2, leaf.s * .2, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,250,240,.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(3, -1);
  ctx.quadraticCurveTo(leaf.s * .5, -leaf.s * .28, leaf.s * .9, -leaf.s * .08);
  ctx.stroke();
  ctx.restore();
}

function drawSoftPetal(x, y, rx, ry, rotation, colors, alpha = 1, pinch = .6) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const grad = ctx.createRadialGradient(-rx * .2, -ry * .32, 1, 0, 0, Math.max(rx, ry));
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.bezierCurveTo(rx * .92, -ry * .92, rx, ry * pinch, 0, ry);
  ctx.bezierCurveTo(-rx, ry * pinch, -rx * .92, -ry * .92, 0, -ry);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= .22;
  ctx.fillStyle = colors[0];
  ctx.beginPath();
  ctx.ellipse(-rx * .18, -ry * .22, rx * .34, ry * .26, -.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRose(size, colors, p) {
  const rings = [
    { count: 8, spread: .45, rx: .22, ry: .34, offset: .02, pinch: .46 },
    { count: 7, spread: .30, rx: .18, ry: .29, offset: .16, pinch: .52 },
    { count: 5, spread: .16, rx: .14, ry: .23, offset: .34, pinch: .60 }
  ];
  rings.forEach((ring, idx) => {
    for (let i = 0; i < ring.count; i++) {
      const local = clamp((p - idx * .07 - i * .012) / .82);
      if (local <= 0) continue;
      const t = backOut(local);
      const a = (i / ring.count) * Math.PI * 2 + ring.offset;
      const radius = size * ring.spread * t;
      drawSoftPetal(
        Math.cos(a) * radius,
        Math.sin(a) * radius * .58,
        size * ring.rx * (.34 + .66 * t),
        size * ring.ry * (.32 + .68 * t),
        a + Math.PI / 2,
        colors,
        .90,
        ring.pinch
      );
    }
  });
  for (let i = 0; i < 4; i++) {
    const local = clamp((p - .13 - i * .018) / .8);
    if (local <= 0) continue;
    const t = backOut(local);
    const a = i * (Math.PI / 2) + .42;
    drawSoftPetal(Math.cos(a) * size * .07 * t, Math.sin(a) * size * .05 * t, size * .11 * t, size * .16 * t, a + .8, colors, .98, .68);
  }
  const cg = ctx.createRadialGradient(-size*.03, -size*.05, 1, 0, 0, size*.18);
  cg.addColorStop(0, colors[0]);
  cg.addColorStop(.56, colors[2]);
  cg.addColorStop(1, colors[3]);
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.arc(0, 0, size * .095 * backOut(p), 0, Math.PI * 2);
  ctx.fill();
}

function drawPeony(size, colors, p) {
  const layers = [
    { count: 10, spread: .42, rx: .22, ry: .32, offset: .04 },
    { count: 9, spread: .28, rx: .18, ry: .27, offset: .16 },
    { count: 7, spread: .16, rx: .14, ry: .22, offset: .28 },
    { count: 5, spread: .08, rx: .12, ry: .17, offset: .08 }
  ];
  layers.forEach((layer, idx) => {
    for (let i = 0; i < layer.count; i++) {
      const local = clamp((p - idx * .06 - i * .01) / .82);
      if (local <= 0) continue;
      const t = backOut(local);
      const a = (i / layer.count) * Math.PI * 2 + layer.offset;
      drawSoftPetal(
        Math.cos(a) * size * layer.spread * t,
        Math.sin(a) * size * layer.spread * .55 * t,
        size * layer.rx * (.38 + .62 * t),
        size * layer.ry * (.38 + .62 * t),
        a + Math.PI / 2,
        colors,
        .87,
        .72
      );
    }
  });
}

function drawRanunculus(size, colors, p) {
  for (let layer = 0; layer < 5; layer++) {
    const count = 10 - layer;
    const spread = .3 - layer * .05;
    for (let i = 0; i < count; i++) {
      const local = clamp((p - layer * .055 - i * .008) / .82);
      if (local <= 0) continue;
      const t = backOut(local);
      const a = (i / count) * Math.PI * 2 + layer * .22;
      drawSoftPetal(
        Math.cos(a) * size * spread * t,
        Math.sin(a) * size * spread * .52 * t,
        size * (.15 - layer * .01) * (.48 + .52 * t),
        size * (.21 - layer * .01) * (.45 + .55 * t),
        a + Math.PI / 2,
        colors,
        .90,
        .70
      );
    }
  }
}

function drawFlower(flower, time) {
  const progress = segment(time, flower.start, flower.hero ? 1.82 : 1.48);
  if (progress <= 0) return;
  const rise = lerp(34, 0, easeOutCubic(progress));
  const scale = lerp(.16, 1, backOut(progress));
  const colors = palettes[flower.c];
  ctx.save();
  ctx.translate(flower.x, flower.y + rise);
  ctx.rotate(flower.rot * (1 - progress));
  ctx.scale(scale, scale);
  ctx.globalAlpha = clamp(progress * 1.4);
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = flower.hero ? 14 : 9;
  ctx.shadowOffsetY = 4;
  if (flower.type === 'peony') drawPeony(flower.s, colors, progress);
  else if (flower.type === 'ranunculus') drawRanunculus(flower.s, colors, progress);
  else drawRose(flower.s, colors, progress);
  ctx.restore();
}

function drawHydrangea(h, time) {
  const progress = segment(time, h.start, 1.3);
  if (progress <= 0) return;
  const p = backOut(progress);
  const colors = palettes[h.c];
  const seeds = [
    [-.62,-.18,.34],[-.36,-.48,.32],[-.08,-.56,.33],[.22,-.50,.31],[.52,-.26,.32],
    [-.48,.12,.34],[-.18,.02,.36],[.12,-.02,.36],[.42,.12,.34],[-.26,.34,.32],[.08,.34,.34],[.36,.34,.3],[0,.58,.3]
  ];
  ctx.save();
  ctx.translate(h.x, h.y + lerp(18,0,easeOutCubic(progress)));
  ctx.scale(p,p);
  ctx.globalAlpha = clamp(progress*1.4);
  seeds.forEach(([dx,dy,ss], idx) => {
    const local = clamp((progress - idx*.015)/.92);
    if (local <= 0) return;
    const ep = backOut(local);
    ctx.save();
    ctx.translate(dx*h.s,dy*h.s);
    ctx.scale(ep,ep);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      drawSoftPetal(0,0,h.s*ss*.34,h.s*ss*.55,a,colors,.86,.72);
    }
    ctx.fillStyle=colors[3];
    ctx.globalAlpha*=.35;
    ctx.beginPath();ctx.arc(0,0,h.s*ss*.08,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawFiller(f, progress) {
  if (progress <= 0) return;
  const p = backOut(progress);
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(p, p);
  ctx.globalAlpha = clamp(progress * 1.4);
  const blooms = [[0,0,5.2],[12,-8,4],[15,9,3.8],[-10,6,3.8],[3,16,3.4]];
  blooms.forEach(([x,y,r]) => {
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      drawSoftPetal(x,y,r*.45,r*.7,a,palettes.white,.92,.74);
    }
    ctx.fillStyle='#c7a777';
    ctx.beginPath();ctx.arc(x,y,r*.16,0,Math.PI*2);ctx.fill();
  });
  ctx.restore();
}

function drawSprig(s, time) {
  const progress = segment(time, s.start, 1.8);
  if (progress <= 0) return;
  const p = easeOutCubic(progress);
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.a);
  ctx.globalAlpha = clamp(progress*1.35);
  ctx.strokeStyle = 'rgba(226,211,190,.86)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(0,-s.h*p);
  ctx.stroke();

  if (s.type === 'pampas') {
    const top = -s.h*p;
    const count=20;
    for(let i=0;i<count;i++){
      const tt=i/(count-1);
      const yy=lerp(top,top+s.h*.42,tt);
      const width=Math.sin(tt*Math.PI)*s.h*.12;
      const dir=i%2===0?-1:1;
      ctx.strokeStyle=`rgba(247,238,220,${.25+.55*(1-tt)})`;
      ctx.lineWidth=1.2;
      ctx.beginPath();
      ctx.moveTo(0,yy);
      ctx.quadraticCurveTo(dir*width*.55,yy-s.h*.025,dir*width,yy-s.h*.06);
      ctx.stroke();
    }
  } else {
    const levels=8;
    for(let i=1;i<=levels;i++){
      const tt=i/(levels+1);
      const yy=-s.h*p*tt;
      const len=s.h*(.06+.04*Math.sin(tt*Math.PI));
      const dir=i%2===0?-1:1;
      ctx.strokeStyle='rgba(232,218,197,.82)';
      ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(dir*len,yy-len*.6);ctx.stroke();
      ctx.fillStyle='rgba(250,241,225,.9)';
      ctx.beginPath();ctx.arc(dir*len,yy-len*.6,2.2,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
}

function drawWrapBack(time) {
  const p = backOut(segment(time, 3.40, 1.75));
  if (p <= 0) return;
  const y = lerp(110, 0, easeOutCubic(p));
  const scale = lerp(.65, 1, p);
  ctx.save();
  ctx.translate(210, 520 + y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = clamp(p*1.25);
  ctx.shadowColor='rgba(0,0,0,.30)';ctx.shadowBlur=16;ctx.shadowOffsetY=12;

  const dark=ctx.createLinearGradient(-220,-120,220,220);
  dark.addColorStop(0,'#8d4f58');
  dark.addColorStop(.5,'#b8737d');
  dark.addColorStop(1,'#62353e');
  ctx.fillStyle=dark;
  const panels=[
    [[-210,-74],[-125,-166],[-62,218],[-108,252]],
    [[-122,-94],[-44,-188],[-20,222],[-64,246]],
    [[122,-94],[44,-188],[20,222],[64,246]],
    [[210,-74],[125,-166],[62,218],[108,252]]
  ];
  panels.forEach(poly=>{ctx.beginPath();ctx.moveTo(poly[0][0],poly[0][1]);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i][0],poly[i][1]);ctx.closePath();ctx.fill();});

  const cream=ctx.createLinearGradient(-190,-100,190,220);
  cream.addColorStop(0,'#f6e9e1');cream.addColorStop(.55,'#e8d8cf');cream.addColorStop(1,'#bda39c');
  ctx.fillStyle=cream;
  ctx.beginPath();ctx.moveTo(-188,-50);ctx.lineTo(-92,-142);ctx.lineTo(-28,230);ctx.lineTo(-74,254);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(188,-50);ctx.lineTo(92,-142);ctx.lineTo(28,230);ctx.lineTo(74,254);ctx.closePath();ctx.fill();

  ctx.restore();
}

function drawWrapFront(time) {
  const p = backOut(segment(time, 3.40, 1.75));
  if (p <= 0) return;
  const y = lerp(110, 0, easeOutCubic(p));
  const scale = lerp(.65, 1, p);
  ctx.save();
  ctx.translate(210, 520 + y);
  ctx.scale(scale, scale);
  ctx.globalAlpha=clamp(p*1.25);

  const blush=ctx.createLinearGradient(-190,-90,140,250);
  blush.addColorStop(0,'#f4ddd8');blush.addColorStop(.52,'#d9aba7');blush.addColorStop(1,'#9a6268');
  ctx.fillStyle=blush;
  ctx.shadowColor='rgba(0,0,0,.24)';ctx.shadowBlur=10;ctx.shadowOffsetY=7;
  ctx.beginPath();
  ctx.moveTo(-194,-34);
  ctx.quadraticCurveTo(0,14,194,-34);
  ctx.lineTo(58,252);
  ctx.quadraticCurveTo(0,286,-58,252);
  ctx.closePath();
  ctx.fill();

  const ivory=ctx.createLinearGradient(-130,-42,120,220);
  ivory.addColorStop(0,'#fff5ef');ivory.addColorStop(.55,'#eadbd3');ivory.addColorStop(1,'#c1a39e');
  ctx.fillStyle=ivory;
  ctx.beginPath();
  ctx.moveTo(-142,-20);ctx.quadraticCurveTo(0,18,142,-20);ctx.lineTo(38,228);ctx.quadraticCurveTo(0,250,-38,228);ctx.closePath();ctx.fill();

  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,255,255,.34)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(-194,-34);ctx.quadraticCurveTo(0,14,194,-34);ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,.20)';
  ctx.beginPath();ctx.moveTo(-142,-20);ctx.quadraticCurveTo(0,18,142,-20);ctx.stroke();

  ctx.restore();
}

function drawRibbon(time) {
  const p = backOut(segment(time, 4.35, 1.45));
  if (p <= 0) return;
  ctx.save();
  ctx.translate(210, 665 + lerp(58,0,easeOutCubic(p)));
  ctx.scale(lerp(.40,1,p),lerp(.40,1,p));
  ctx.globalAlpha=clamp(p*1.3);
  ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=9;ctx.shadowOffsetY=5;
  const g=ctx.createLinearGradient(-90,-40,90,110);g.addColorStop(0,'#ce7181');g.addColorStop(1,'#703844');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(-24,-6);ctx.bezierCurveTo(-74,-46,-128,-22,-132,24);ctx.bezierCurveTo(-82,28,-48,18,-20,7);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(24,-6);ctx.bezierCurveTo(74,-46,128,-22,132,24);ctx.bezierCurveTo(82,28,48,18,20,7);ctx.closePath();ctx.fill();
  ctx.fillStyle='#92515f';ctx.beginPath();ctx.moveTo(-20,10);ctx.lineTo(-84,118);ctx.lineTo(-22,86);ctx.lineTo(3,18);ctx.closePath();ctx.fill();
  ctx.fillStyle='#6f3b47';ctx.beginPath();ctx.moveTo(20,10);ctx.lineTo(84,118);ctx.lineTo(22,86);ctx.lineTo(-3,18);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ae6473';ctx.beginPath();ctx.ellipse(0,5,36,24,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(238,173,186,.45)';ctx.beginPath();ctx.ellipse(-6,0,14,7,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawShadow(time) {
  const p = easeOutCubic(segment(time, 2.1, 1.8));
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha=.30*p;
  ctx.translate(210,738);
  ctx.scale(lerp(.2,1,p),lerp(.2,1,p));
  const g=ctx.createRadialGradient(0,0,5,0,0,126);g.addColorStop(0,'rgba(0,0,0,.64)');g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,126,15,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawFrame(time) {
  resetTransformForCssPixels();
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0,0,rect.width,rect.height);
  ctx.save();
  const fitScale=Math.min(rect.width/420,rect.height/760);
  const scale=fitScale*1.06;
  const ox=(rect.width-420*scale)/2;
  const oy=(rect.height-760*scale)/2 + 18;
  ctx.translate(ox,oy);
  ctx.scale(scale,scale);

  const entrance=easeInOutCubic(segment(time,.75,4.9));
  ctx.translate(0,lerp(292,8,entrance));
  ctx.scale(lerp(.34,1,entrance),lerp(.34,1,entrance));
  ctx.globalAlpha=clamp(segment(time,.75,1.2));

  drawShadow(time);
  drawWrapBack(time);
  sprigs.forEach(s=>drawSprig(s,time));
  stems.forEach((stem,i)=>drawStem(stem,easeOutCubic(segment(time,1.88+i*.045,2.45))));
  leaves.forEach(leaf=>drawLeaf(leaf,segment(time,leaf.start,1.22)));
  fillers.forEach(f=>drawFiller(f,segment(time,f.start,1.0)));
  flowers.forEach(f=>drawFlower(f,time));
  hydrangeas.forEach(h=>drawHydrangea(h,time));
  drawWrapFront(time);
  drawRibbon(time);
  ctx.restore();
}

function loop(now) {
  if(!running)return;
  const t=Math.min((now-startTime)/1000,DURATION);
  drawFrame(t);
  if(t<DURATION)requestAnimationFrame(loop);else running=false;
}

function startAnimation(){
  running=true;
  startTime=performance.now();
  if(messageTimer) clearTimeout(messageTimer);
  document.body.classList.remove('show-message');
  messageTimer = window.setTimeout(() => {
    document.body.classList.add('show-message');
  }, (DURATION + 0.35) * 1000);
  requestAnimationFrame(loop);
}

function reveal(){
  if(document.body.classList.contains('is-opening')||document.body.classList.contains('is-revealed'))return;
  document.body.classList.add('is-opening');
  openButton.disabled=true;
  window.setTimeout(()=>{
    document.body.classList.add('is-revealed');
    scene.setAttribute('aria-hidden','false');
    startAnimation();
  },850);
}

openButton.addEventListener('click',reveal);
window.addEventListener('resize',resizeCanvas,{passive:true});

const params=new URLSearchParams(window.location.search);
if(params.has('preview')){
  document.body.classList.add('is-opening','is-revealed');
  scene.setAttribute('aria-hidden','false');
  fixedPreviewTime=Number(params.get('t')||DURATION);
  document.getElementById('intro').style.display='none';
  if(fixedPreviewTime >= DURATION){
    document.body.classList.add('show-message');
  }
}

requestAnimationFrame(()=>{resizeCanvas();if(fixedPreviewTime!==null)drawFrame(fixedPreviewTime);});
