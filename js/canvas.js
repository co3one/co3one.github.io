/* ============================================================
   miji — canvas animations
   Background particles, nav orb, hero orb, scroll fades,
   and page navigation
   ============================================================ */

(function () {
  'use strict';

  // ---------- Color Palette ----------
  const GOLD = { r: 196, g: 162, b: 101 };
  const BG   = { r: 8,   g: 8,   b: 15  };

  // ---------- Utility ----------
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function dist(x1, y1, x2, y2) {
    const dx = x1 - x2, dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }


  /* ==========================================================
     1. BACKGROUND PARTICLES
     ========================================================== */
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) {
    const ctx = bgCanvas.getContext('2d');
    let particles = [];
    let w, h;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 140;

    function resizeBg() {
      w = bgCanvas.width  = window.innerWidth;
      h = bgCanvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x:  rand(0, w),
          y:  rand(0, h),
          vx: rand(-0.25, 0.25),
          vy: rand(-0.25, 0.25),
          r:  rand(1, 2.2),
          a:  rand(0.08, 0.25),
        });
      }
    }

    function drawBg() {
      ctx.clearRect(0, 0, w, h);

      // Subtle radial gradient overlay
      const grad = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, w * 0.7);
      grad.addColorStop(0, 'rgba(196, 162, 101, 0.02)');
      grad.addColorStop(1, 'rgba(8, 8, 15, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const d = dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.06;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${p.a})`;
        ctx.fill();
      }

      requestAnimationFrame(drawBg);
    }

    resizeBg();
    createParticles();
    drawBg();
    window.addEventListener('resize', () => { resizeBg(); createParticles(); });
  }


  /* ==========================================================
     2. ORB RENDERER (shared by nav + hero)
     ========================================================== */
  function createOrb(canvas, size) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.34;
    let t = rand(0, 1000);

    function draw() {
      t += 0.008;
      ctx.clearRect(0, 0, size, size);

      // Slow pulse — ~4s cycle, subtle intensity shift
      const pulse = 0.85 + Math.sin(t * 0.4) * 0.15;

      // Outer glow (pulse modulates radius and alpha)
      const glowR = baseR * (1.7 + Math.sin(t * 0.4) * 0.15);
      const glow = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${0.12 * pulse})`);
      glow.addColorStop(0.5, `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${0.04 * pulse})`);
      glow.addColorStop(1, 'rgba(8, 8, 15, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Organic orb shape via layered circles
      const layers = 5;
      for (let i = layers; i >= 0; i--) {
        const frac = i / layers;
        const r = baseR * (0.4 + frac * 0.6) * (0.97 + pulse * 0.03);

        // Slight wobble
        const offsetX = Math.sin(t + i * 1.2) * baseR * 0.04;
        const offsetY = Math.cos(t * 0.7 + i * 0.9) * baseR * 0.04;

        const alpha = lerp(0.5, 0.08, frac) * pulse;
        const colorR = Math.round(lerp(GOLD.r, GOLD.r * 0.6, frac));
        const colorG = Math.round(lerp(GOLD.g, GOLD.g * 0.5, frac));
        const colorB = Math.round(lerp(GOLD.b, GOLD.b * 0.4, frac));

        const grad = ctx.createRadialGradient(
          cx + offsetX, cy + offsetY, 0,
          cx + offsetX, cy + offsetY, r
        );
        grad.addColorStop(0, `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha})`);
        grad.addColorStop(1, `rgba(${colorR}, ${colorG}, ${colorB}, 0)`);

        ctx.beginPath();
        ctx.arc(cx + offsetX, cy + offsetY, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Core highlight (pulse modulates peak brightness)
      const coreAlpha = (0.35 + Math.sin(t * 1.5) * 0.1) * pulse;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.25);
      coreGrad.addColorStop(0, `rgba(255, 240, 210, ${coreAlpha})`);
      coreGrad.addColorStop(1, 'rgba(196, 162, 101, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Breathing ring (pulse modulates opacity)
      const ringR = baseR * (0.85 + Math.sin(t * 0.6) * 0.08);
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${(0.1 + Math.sin(t) * 0.05) * pulse})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      requestAnimationFrame(draw);
    }

    draw();
  }

  // Init orbs
  const navOrb = document.getElementById('nav-orb');
  if (navOrb) createOrb(navOrb, 36);

  const heroOrb = document.getElementById('hero-orb');
  if (heroOrb) createOrb(heroOrb, 180);


  /* ==========================================================
     3. SCROLL FADE-IN (IntersectionObserver)
     ========================================================== */
  const fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach((el) => obs.observe(el));
  }


  /* ==========================================================
     4. PAGE NAVIGATION (SPA-style)
     ========================================================== */
  const pageLinks = document.querySelectorAll('[data-page]');
  const pages     = document.querySelectorAll('.page');
  const navLinksA = document.querySelectorAll('.nav-links a');

  function showPage(id) {
    pages.forEach((p) => p.classList.remove('active'));
    const target = document.getElementById('page-' + id);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Re-observe new fade-ins
      target.querySelectorAll('.fade-in:not(.visible)').forEach((el) => {
        if ('IntersectionObserver' in window) {
          const obs = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('visible');
                  obs.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
          );
          obs.observe(el);
        }
      });
    }

    // Update active nav link
    navLinksA.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-page') === id);
    });

    // Close mobile menu
    document.querySelector('.nav')?.classList.remove('open');
  }

  pageLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.getAttribute('data-page'));
    });
  });


  /* ==========================================================
     5. MOBILE NAV TOGGLE
     ========================================================== */
  const navToggle = document.querySelector('.nav-toggle');
  const nav       = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

})();
