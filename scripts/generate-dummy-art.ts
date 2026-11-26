/**
 * Generates elegant SVG placeholder art for every dummy product:
 *   public/dummy/<slug>/{front,back,detail-1,detail-2,hanger}.svg
 * plus lookbook tiles and the default OG image.
 *
 * Run: pnpm art
 * Replace with real photography from the admin panel when ready.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEMO_PALETTES } from "../lib/demo/catalog";

type Pal = { base: string; deep: string; accent: string; name: string; colour: string; embroidery: string };

const OUT = join(process.cwd(), "public", "dummy");

/* ---------------------------------- motifs --------------------------------- */

/** A paisley (buta) shape, centred around 0,0, ~ 24 x 40. */
const paisley = (stroke: string, fill = "none", w = 1.2) =>
  `<path d="M0 18 C-12 14 -13 -4 -4 -14 C2 -21 12 -19 11 -10 C10 -4 3 -3 2 -8 C6 -2 12 6 6 14 C4 17 2 18 0 18 Z" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>` +
  `<circle cx="-3" cy="4" r="2.2" fill="${stroke}"/>`;

/** A small six-petal flower. */
const flower = (c: string, r = 6) => {
  let s = "";
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    s += `<ellipse cx="${(x / 2).toFixed(2)}" cy="${(y / 2).toFixed(2)}" rx="${(r / 2).toFixed(2)}" ry="${(r / 4.5).toFixed(2)}" transform="rotate(${(i * 60).toFixed(0)} ${(x / 2).toFixed(2)} ${(y / 2).toFixed(2)})" fill="${c}" opacity="0.9"/>`;
  }
  return s + `<circle r="${(r / 3.5).toFixed(2)}" fill="${c}"/>`;
};

function defs(id: string, p: Pal) {
  return `
  <defs>
    <linearGradient id="${id}-fabric" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="${p.deep}"/>
      <stop offset="0.22" stop-color="${p.base}"/>
      <stop offset="0.55" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.deep}"/>
    </linearGradient>
    <linearGradient id="${id}-dupatta" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${p.base}" stop-opacity="0.78"/>
      <stop offset="1" stop-color="${p.deep}" stop-opacity="0.62"/>
    </linearGradient>
    <linearGradient id="${id}-trouser" x1="0" x2="1">
      <stop offset="0" stop-color="${p.deep}"/>
      <stop offset="0.5" stop-color="${p.base}"/>
      <stop offset="1" stop-color="${p.deep}"/>
    </linearGradient>
    <pattern id="${id}-border" width="36" height="40" patternUnits="userSpaceOnUse">
      <g transform="translate(18 20) scale(0.62)">${paisley(p.accent, "none", 1.6)}</g>
      <g transform="translate(0 6)">${flower(p.accent, 4)}</g>
      <g transform="translate(36 6)">${flower(p.accent, 4)}</g>
      <line x1="0" y1="0.6" x2="36" y2="0.6" stroke="${p.accent}" stroke-width="1.2"/>
      <line x1="0" y1="39.4" x2="36" y2="39.4" stroke="${p.accent}" stroke-width="1.2"/>
    </pattern>
    <pattern id="${id}-butti" width="46" height="54" patternUnits="userSpaceOnUse">
      <g transform="translate(12 14) scale(0.32)" opacity="0.85">${flower(p.accent, 10)}</g>
      <g transform="translate(35 41) scale(0.32)" opacity="0.85">${flower(p.accent, 10)}</g>
    </pattern>
    <filter id="${id}-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
      <feOffset dy="14"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

/** The garment, drawn in a 600 x 800 coordinate space. */
function garment(id: string, p: Pal, view: "front" | "back") {
  const shirt =
    "M246 166 L210 176 C188 184 176 196 170 214 L130 402 C128 412 136 418 146 416 L176 410 L182 300 L170 628 C222 650 378 650 430 628 L418 300 L424 410 L454 416 C464 418 472 412 470 402 L430 214 C424 196 412 184 390 176 L354 166 C340 182 322 190 300 190 C278 190 260 182 246 166 Z";
  const trouserL = "M232 632 L226 760 C226 766 270 766 272 760 L296 640 Z";
  const trouserR = "M368 632 L374 760 C374 766 330 766 328 760 L304 640 Z";
  const neck =
    view === "front"
      ? `<path d="M246 166 C260 182 278 190 300 190 C322 190 340 182 354 166 L330 168 C322 178 312 254 300 262 C288 254 278 178 270 168 Z" fill="${p.deep}" opacity="0.55"/>
         <path d="M262 170 C276 196 290 240 300 262 C310 240 324 196 338 170" fill="none" stroke="${p.accent}" stroke-width="3"/>
         <path d="M252 168 C270 200 288 250 300 278 C312 250 330 200 348 168" fill="none" stroke="${p.accent}" stroke-width="1.2" stroke-dasharray="2 5"/>
         ${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${268 + i * 0} ${196 + i * 18}) translate(${i * 6} 0) scale(0.42) rotate(-20)">${paisley(p.accent, p.accent)}</g>`).join("")}
         ${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${332 - i * 6} ${196 + i * 18}) scale(-0.42 0.42) rotate(-20)">${paisley(p.accent, p.accent)}</g>`).join("")}
         <g transform="translate(300 300) scale(1.1)">${flower(p.accent, 12)}</g>
         <path d="M300 318 L300 380" stroke="${p.accent}" stroke-width="1" stroke-dasharray="1 6"/>`
      : `<path d="M250 168 C266 180 284 186 300 186 C316 186 334 180 350 168" fill="none" stroke="${p.accent}" stroke-width="2"/>
         <g transform="translate(300 232) scale(0.9)">${flower(p.accent, 12)}</g>`;

  return `
  <g filter="url(#${id}-soft)">
    <path d="${trouserL}" fill="url(#${id}-trouser)"/>
    <path d="${trouserR}" fill="url(#${id}-trouser)"/>
    <path d="M228 742 L274 742" stroke="${p.accent}" stroke-width="5" opacity="0.9"/>
    <path d="M326 742 L372 742" stroke="${p.accent}" stroke-width="5" opacity="0.9"/>
    <path d="${shirt}" fill="url(#${id}-fabric)"/>
    <path d="${shirt}" fill="url(#${id}-butti)" opacity="${view === "front" ? 0.55 : 0.35}"/>
    <!-- side folds -->
    <path d="M232 330 C226 430 214 540 204 630" stroke="${p.deep}" stroke-width="2" opacity="0.35" fill="none"/>
    <path d="M368 330 C374 430 386 540 396 630" stroke="${p.deep}" stroke-width="2" opacity="0.35" fill="none"/>
    <path d="M300 400 C302 480 300 560 300 640" stroke="${p.deep}" stroke-width="1.4" opacity="0.2" fill="none"/>
    <!-- daaman border -->
    <path d="M172 574 C224 592 376 592 428 574 L430 628 C378 650 222 650 170 628 Z" fill="url(#${id}-border)"/>
    <path d="M172 574 C224 592 376 592 428 574" fill="none" stroke="${p.accent}" stroke-width="1.5"/>
    <!-- cuffs -->
    <path d="M139 372 L175 366 L176 410 L146 416 C136 418 128 412 130 402 Z" fill="url(#${id}-border)"/>
    <path d="M461 372 L425 366 L424 410 L454 416 C464 418 472 412 470 402 Z" fill="url(#${id}-border)"/>
    ${neck}
  </g>`;
}

function dupattaFront(id: string, p: Pal) {
  const d =
    "M352 168 C404 176 440 220 452 300 C470 420 486 560 500 720 L456 730 C440 590 420 450 392 330 C380 280 360 230 330 200 Z";
  return `
  <g opacity="0.92">
    <path d="${d}" fill="url(#${id}-dupatta)"/>
    <path d="${d}" fill="url(#${id}-butti)" opacity="0.5"/>
    <path d="M500 720 L456 730 L452 700 L496 690 Z" fill="url(#${id}-border)"/>
    <path d="M330 200 C360 230 380 280 392 330 C420 450 440 590 456 730" fill="none" stroke="${p.accent}" stroke-width="1.4" opacity="0.8"/>
  </g>`;
}

function backdrop(id: string) {
  return `
  <defs>
    <radialGradient id="${id}-bg" cx="50%" cy="38%" r="75%">
      <stop offset="0" stop-color="#FBF8F2"/>
      <stop offset="0.7" stop-color="#EFE7DA"/>
      <stop offset="1" stop-color="#E5DACA"/>
    </radialGradient>
  </defs>
  <rect width="600" height="800" fill="url(#${id}-bg)"/>
  <path d="M90 790 L90 260 C90 120 190 40 300 40 C410 40 510 120 510 260 L510 790" fill="none" stroke="#B08D57" stroke-opacity="0.35" stroke-width="1"/>
  <path d="M104 790 L104 262 C104 134 196 54 300 54 C404 54 496 134 496 262 L496 790" fill="none" stroke="#B08D57" stroke-opacity="0.18" stroke-width="1"/>
  <ellipse cx="300" cy="772" rx="170" ry="10" fill="#1C1A17" opacity="0.08"/>`;
}

function label(p: Pal) {
  return `<text x="300" y="792" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="4" fill="#6F655A">${p.name.toUpperCase()} · PLACEHOLDER</text>`;
}

function front(slug: string, p: Pal) {
  const id = `${slug}-f`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="1200" height="1600">
  ${backdrop(id)}${defs(id, p)}
  ${garment(id, p, "front")}
  ${dupattaFront(id, p)}
  ${label(p)}
</svg>`;
}

function back(slug: string, p: Pal) {
  const id = `${slug}-b`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="1200" height="1600">
  ${backdrop(id)}${defs(id, p)}
  ${garment(id, p, "back")}
  ${label(p)}
</svg>`;
}

function detail(slug: string, p: Pal, variant: 1 | 2) {
  const id = `${slug}-d${variant}`;
  const tiles: string[] = [];
  if (variant === 1) {
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 7; x++) {
        const cx = 40 + x * 88 + (y % 2) * 44;
        const cy = 40 + y * 92;
        tiles.push(
          `<g transform="translate(${cx} ${cy}) scale(1.5) rotate(${(x + y) % 2 ? 18 : -18})">${paisley(p.accent, "none", 1.1)}</g>`,
          `<g transform="translate(${cx + 44} ${cy + 46})">${flower(p.accent, 9)}</g>`,
        );
      }
  } else {
    for (let y = 0; y < 8; y++) {
      const yy = 60 + y * 96;
      tiles.push(`<rect x="0" y="${yy - 30}" width="600" height="60" fill="url(#${id}-border)" transform="scale(1) "/>`);
      tiles.push(
        `<path d="M0 ${yy} C100 ${yy - 30} 200 ${yy + 30} 300 ${yy} C400 ${yy - 30} 500 ${yy + 30} 600 ${yy}" fill="none" stroke="${p.accent}" stroke-width="2.2"/>`,
      );
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="1200" height="1600">
  ${defs(id, p)}
  <rect width="600" height="800" fill="url(#${id}-fabric)"/>
  <rect width="600" height="800" fill="${p.deep}" opacity="0.15"/>
  ${tiles.join("")}
  <rect width="600" height="800" fill="none" stroke="${p.accent}" stroke-opacity="0.25" stroke-width="16"/>
  <text x="300" y="784" text-anchor="middle" font-family="Georgia, serif" font-size="11" letter-spacing="4" fill="${p.accent}">${p.embroidery.toUpperCase()} · DETAIL</text>
</svg>`;
}

/** Transparent hanger image (tightly cropped so the garment fills the frame). */
function hanger(slug: string, p: Pal) {
  const id = `${slug}-h`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="62 4 276 668" width="552" height="1336">
  ${defs(id, p)}
  <defs>
    <linearGradient id="${id}-wood" x1="0" x2="1">
      <stop offset="0" stop-color="#6B4A2B"/><stop offset="0.5" stop-color="#9A7048"/><stop offset="1" stop-color="#6B4A2B"/>
    </linearGradient>
  </defs>
  <!-- hook -->
  <path d="M200 64 L200 40 C200 22 214 12 228 18 C240 24 238 40 226 42" fill="none" stroke="#B08D57" stroke-width="4" stroke-linecap="round"/>
  <g transform="translate(-100 -64)">
    <g filter="url(#${id}-soft)">
      <!-- shirt hanging -->
      <path d="M246 166 L196 182 C184 188 178 198 176 212 L170 460 C170 470 178 474 188 472 L204 468 L206 300 L190 690 C240 712 360 712 410 690 L394 300 L396 468 L412 472 C422 474 430 470 430 460 L424 212 C422 198 416 188 404 182 L354 166 C340 182 322 190 300 190 C278 190 260 182 246 166 Z" fill="url(#${id}-fabric)"/>
      <path d="M246 166 L196 182 C184 188 178 198 176 212 L170 460 C170 470 178 474 188 472 L204 468 L206 300 L190 690 C240 712 360 712 410 690 L394 300 L396 468 L412 472 C422 474 430 470 430 460 L424 212 C422 198 416 188 404 182 L354 166 Z" fill="url(#${id}-butti)" opacity="0.5"/>
      <path d="M192 636 C240 652 360 652 408 636 L410 690 C360 712 240 712 190 690 Z" fill="url(#${id}-border)"/>
      <path d="M172 420 L204 418 L204 468 L188 472 C178 474 170 470 170 460 Z" fill="url(#${id}-border)"/>
      <path d="M428 420 L396 418 L396 468 L412 472 C422 474 430 470 430 460 Z" fill="url(#${id}-border)"/>
      <path d="M262 170 C276 196 290 240 300 262 C310 240 324 196 338 170" fill="none" stroke="${p.accent}" stroke-width="3"/>
      <g transform="translate(300 300)">${flower(p.accent, 12)}</g>
      <!-- dupatta folded over the bar -->
      <path d="M318 150 L364 150 C372 260 380 420 376 600 L334 612 C340 440 330 280 318 150 Z" fill="url(#${id}-dupatta)"/>
      <path d="M376 600 L334 612 L333 584 L376 574 Z" fill="url(#${id}-border)"/>
    </g>
    <!-- hanger bar -->
    <path d="M300 128 L190 176 C182 180 184 188 192 188 L408 188 C416 188 418 180 410 176 Z" fill="url(#${id}-wood)"/>
    <path d="M300 128 L300 112" stroke="#B08D57" stroke-width="4"/>
  </g>
</svg>`;
}

function lookbook(i: number, slug: string, p: Pal) {
  const id = `lb-${i}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="1200" height="1500">
  <defs>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.deep}"/><stop offset="1" stop-color="#1C1A17"/>
    </linearGradient>
  </defs>
  <rect width="600" height="750" fill="url(#${id}-g)"/>
  <g transform="translate(60 0) scale(0.8)">
    ${defs(`${id}x`, p)}${garment(`${id}x`, p, "front")}${dupattaFront(`${id}x`, p)}
  </g>
  <rect x="24" y="24" width="552" height="702" fill="none" stroke="#D9C4A0" stroke-opacity="0.35"/>
  <text x="300" y="712" text-anchor="middle" font-family="Georgia, serif" font-size="12" letter-spacing="5" fill="#D9C4A0">${p.name.toUpperCase()}</text>
</svg>`;
}

function og() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#1C1A17"/>
  <path d="M420 630 L420 260 C420 140 500 70 600 70 C700 70 780 140 780 260 L780 630" fill="none" stroke="#B08D57" stroke-opacity="0.5"/>
  <text x="600" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="84" letter-spacing="22" fill="#F7F3EC">TANZAIB</text>
  <text x="600" y="400" text-anchor="middle" font-family="Georgia, serif" font-size="22" letter-spacing="8" fill="#D9C4A0">HAND-EMBROIDERED HEIRLOOMS</text>
</svg>`;
}

mkdirSync(OUT, { recursive: true });
const entries = Object.entries(DEMO_PALETTES);
for (const [slug, p] of entries) {
  const dir = join(OUT, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "front.svg"), front(slug, p));
  writeFileSync(join(dir, "back.svg"), back(slug, p));
  writeFileSync(join(dir, "detail-1.svg"), detail(slug, p, 1));
  writeFileSync(join(dir, "detail-2.svg"), detail(slug, p, 2));
  writeFileSync(join(dir, "hanger.svg"), hanger(slug, p));
}
mkdirSync(join(OUT, "lookbook"), { recursive: true });
entries.slice(0, 8).forEach(([slug, p], i) => {
  writeFileSync(join(OUT, "lookbook", `look-${i + 1}.svg`), lookbook(i, slug, p));
});
writeFileSync(join(OUT, "og-default.svg"), og());
console.log(`Generated art for ${entries.length} products in ${OUT}`);
