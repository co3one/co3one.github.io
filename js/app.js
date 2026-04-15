/* ═══════════════════════════════════════════════════════════
   CO3 ONE v8 — App Controller
   Logo fade, tagline reposition, navigation
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

const pages = ['home','research','product','contact'];
let cur = 0, locked = false;
const LOCK = 2000;
const tagline = document.querySelector('.tagline');
const heroLogo = document.querySelector('.hero-logo');
const brandLine = document.getElementById('brandLine');
const swipeHint = document.getElementById('swipeHint');

function go(idx) {
  if (locked || idx === cur || idx < 0 || idx >= pages.length) return;
  locked = true;
  const name = pages[idx];
  const isHome = name === 'home';

  // Hide swipe hint on first navigation
  if (swipeHint) swipeHint.classList.add('hidden');

  // Deactivate current page
  const prevEl = document.getElementById(pages[cur]);
  if (prevEl) prevEl.classList.remove('active');

  // Transition flash
  const flash = document.querySelector('.transition-flash');
  if (flash) { flash.classList.add('active'); setTimeout(() => flash.classList.remove('active'), 250); }

  // Camera + color
  if (window.co3Scene) window.co3Scene.setState(name);

  // Logo: visible on home, fades on everything else
  if (heroLogo) heroLogo.classList.toggle('visible', isHome);

  // Tagline (centered): visible on home only
  if (tagline) tagline.classList.toggle('visible', isHome);

  // Brand line (top-left): visible on non-home pages
  if (brandLine) brandLine.classList.toggle('visible', !isHome);

  // Nav active
  document.querySelectorAll('nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.page === name)
  );

  // Activate page content — after old page has fully cleared
  cur = idx;
  setTimeout(() => {
    const el = document.getElementById(name);
    if (el) el.classList.add('active');
  }, name === 'home' ? 300 : 500);

  // URL
  history.replaceState(null, null, name === 'home' ? '#' : '#' + name);

  setTimeout(() => { locked = false; }, LOCK);
}

// Nav clicks
document.querySelectorAll('nav a[data-page]').forEach(a =>
  a.addEventListener('click', e => {
    e.preventDefault();
    const i = pages.indexOf(a.dataset.page);
    if (i >= 0) go(i);
  })
);

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(cur + 1);
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(cur - 1);
  else if (e.key === 'Escape') go(0);
});

// Wheel
let wA = 0;
document.addEventListener('wheel', e => {
  e.preventDefault();
  wA += e.deltaY;
  if (Math.abs(wA) > 80) { go(cur + (wA > 0 ? 1 : -1)); wA = 0; }
}, { passive: false });

// Touch
let tx = 0, ty = 0;
document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 60) go(cur + (dy < 0 ? 1 : -1));
  else if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1));
}, { passive: true });

// Select helper
document.querySelectorAll('.c-field select').forEach(sel =>
  sel.addEventListener('change', () => sel.classList.toggle('has-value', sel.value !== ''))
);

// Init
function init() {
  const h = location.hash.replace('#', '');
  const i = pages.indexOf(h);
  if (i > 0) {
    cur = i;
    if (window.co3Scene) window.co3Scene.setState(pages[i]);
    document.getElementById(pages[i]).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.dataset.page === pages[i]));
    if (tagline) tagline.classList.remove('visible');
    if (heroLogo) heroLogo.classList.remove('visible');
    if (brandLine) brandLine.classList.add('visible');
    if (swipeHint) swipeHint.classList.add('hidden');
  } else {
    document.getElementById('home').classList.add('active');
    document.querySelector('nav a[data-page="home"]').classList.add('active');
    if (tagline) tagline.classList.add('visible');
  }
}

if (document.readyState === 'complete') init();
else window.addEventListener('load', init);

})();
