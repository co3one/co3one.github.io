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
      t += 0.014;
      ctx.clearRect(0, 0, size, size);

      // Pulse — ~3s cycle, more visible intensity shift
      const pulse = 0.75 + Math.sin(t * 0.55) * 0.25;

      // Outer glow (pulse modulates radius and alpha)
      const glowR = baseR * (1.7 + Math.sin(t * 0.55) * 0.25);
      const glow = ctx.createRadialGradient(cx, cy, baseR * 0.5, cx, cy, glowR);
      glow.addColorStop(0, `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${0.14 * pulse})`);
      glow.addColorStop(0.5, `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${0.05 * pulse})`);
      glow.addColorStop(1, 'rgba(8, 8, 15, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // Organic orb shape via layered circles
      const layers = 5;
      for (let i = layers; i >= 0; i--) {
        const frac = i / layers;
        const r = baseR * (0.4 + frac * 0.6) * (0.94 + pulse * 0.06);

        // More pronounced wobble
        const offsetX = Math.sin(t + i * 1.2) * baseR * 0.09;
        const offsetY = Math.cos(t * 0.8 + i * 0.9) * baseR * 0.09;

        const alpha = lerp(0.55, 0.1, frac) * pulse;
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
      const coreAlpha = (0.4 + Math.sin(t * 1.8) * 0.15) * pulse;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.25);
      coreGrad.addColorStop(0, `rgba(255, 240, 210, ${coreAlpha})`);
      coreGrad.addColorStop(1, 'rgba(196, 162, 101, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Breathing ring (pulse modulates opacity and size more)
      const ringR = baseR * (0.82 + Math.sin(t * 0.7) * 0.12);
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD.r}, ${GOLD.g}, ${GOLD.b}, ${(0.12 + Math.sin(t) * 0.07) * pulse})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      requestAnimationFrame(draw);
    }

    draw();
  }

  // Init orbs (hero + mini only; nav uses static brand logomark)
  const heroOrb = document.getElementById('hero-orb');
  if (heroOrb) createOrb(heroOrb, 180);

  // Mini orbs on sub-pages
  document.querySelectorAll('.mini-orb').forEach((c) => createOrb(c, 90));


  /* ==========================================================
     2b. SHARE CARD GRADIENTS (4 mood cards, lazy init)
     ========================================================== */
  let shareCardsStarted = false;

  // Mood palettes: [blob1, blob2, blob3]
  const moodPalettes = {
    low:  { c1: [90, 60, 100],  c2: [50, 50, 80],   c3: [70, 40, 60]  },
    mid:  { c1: [120, 120, 80], c2: [80, 100, 120],  c3: [100, 80, 90] },
    good: { c1: [196, 152, 80], c2: [60, 140, 160],  c3: [140, 70, 90] },
    high: { c1: [210, 180, 80], c2: [80, 180, 140],  c3: [200, 140, 60] }
  };

  function initShareCards() {
    if (shareCardsStarted) return;
    const cards = document.querySelectorAll('.share-card-mini');
    if (!cards.length) return;
    shareCardsStarted = true;

    const dpr = window.devicePixelRatio || 1;

    cards.forEach((card) => {
      const canvas = card.querySelector('.share-card-canvas-mini');
      if (!canvas) return;

      const mood = card.getAttribute('data-mood') || 'good';
      const pal = moodPalettes[mood] || moodPalettes.good;
      const sw = 180, sh = 240;

      canvas.width = sw * dpr;
      canvas.height = sh * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      let t = rand(0, 1000);

      /* Randomized orb params per card */
      const cx1 = rand(0.15, 0.55), cy1 = rand(0.1, 0.45);
      const cx2 = rand(0.45, 0.85), cy2 = rand(0.55, 0.9);
      const r1 = rand(0.45, 0.8), r2 = rand(0.35, 0.7);
      const drift1 = rand(0.12, 0.28), drift2 = rand(0.12, 0.28);
      const spd1 = rand(0.25, 0.5), spd2 = rand(0.2, 0.45);

      function draw() {
        t += 0.004;

        const x1 = sw * (cx1 + Math.sin(t * spd1) * drift1);
        const y1 = sh * (cy1 + Math.sin(t * (spd1 * 0.75)) * (drift1 * 0.75));
        const x2 = sw * (cx2 + Math.cos(t * spd2) * drift2);
        const y2 = sh * (cy2 + Math.cos(t * (spd2 * 0.7)) * (drift2 * 0.75));
        const x3 = sw * (0.5 + Math.sin(t * 0.2 + 2) * 0.3);
        const y3 = sh * (0.5 + Math.cos(t * 0.15 + 1) * 0.3);

        ctx.fillStyle = '#08080F';
        ctx.fillRect(0, 0, sw, sh);

        const a1 = 0.28 + Math.sin(t * 0.5) * 0.08;
        const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, sw * r1);
        g1.addColorStop(0, `rgba(${pal.c1[0]}, ${pal.c1[1]}, ${pal.c1[2]}, ${a1})`);
        g1.addColorStop(1, 'rgba(8, 8, 15, 0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, sw, sh);

        const a2 = 0.2 + Math.cos(t * 0.45) * 0.06;
        const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, sw * r2);
        g2.addColorStop(0, `rgba(${pal.c2[0]}, ${pal.c2[1]}, ${pal.c2[2]}, ${a2})`);
        g2.addColorStop(1, 'rgba(8, 8, 15, 0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, sw, sh);

        const a3 = 0.12 + Math.sin(t * 0.6 + 3) * 0.04;
        const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, sw * 0.5);
        g3.addColorStop(0, `rgba(${pal.c3[0]}, ${pal.c3[1]}, ${pal.c3[2]}, ${a3})`);
        g3.addColorStop(1, 'rgba(8, 8, 15, 0)');
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, sw, sh);

        requestAnimationFrame(draw);
      }

      draw();
    });
  }


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
  let transitioning = false;

  function showPage(id) {
    const current = document.querySelector('.page.active');
    const target  = document.getElementById('page-' + id);
    if (!target || target === current || transitioning) return;

    // Close mobile menu
    document.querySelector('.nav')?.classList.remove('open');

    // Update active nav link immediately
    navLinksA.forEach((a) => {
      a.classList.toggle('active', a.getAttribute('data-page') === id);
    });

    transitioning = true;

    // Phase 1: Fade out current page content
    if (current) current.classList.add('fading');

    setTimeout(() => {
      // Phase 2: Switch pages while faded
      pages.forEach((p) => { p.classList.remove('active', 'entered', 'fading'); });

      // Reset animations on target so they replay
      target.querySelectorAll('.mini-orb-wrap, .mini-line1, .mini-line2, .page-hero .statement, .block').forEach((el) => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });

      target.classList.add('active');
      window.scrollTo({ top: 0 });

      // Init share card canvases when your-score page first becomes visible
      if (id === 'your-score') initShareCards();

      // Phase 3: Trigger content entrance (background + particles stay visible throughout)
      requestAnimationFrame(() => {
        target.classList.add('entered');
        transitioning = false;
      });
    }, 300);
  }

  pageLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.getAttribute('data-page'));
    });
  });

  // Mark home page as entered on load
  const homePage = document.getElementById('page-home');
  if (homePage) homePage.classList.add('entered');


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


  /* ==========================================================
     6. SCROLL HINT — HIDE ON SCROLL
     ========================================================== */
  const scrollHint = document.getElementById('scroll-hint');
  if (scrollHint) {
    let hidden = false;
    window.addEventListener('scroll', () => {
      if (!hidden && window.scrollY > 60) {
        scrollHint.classList.add('hidden');
        hidden = true;
      }
    }, { passive: true });
  }


  /* ==========================================================
     7. WAITLIST OVERLAY
     ========================================================== */
  const overlay  = document.getElementById('waitlist-overlay');
  const wlForm   = document.getElementById('waitlist-form');
  const wlClose  = document.getElementById('waitlist-close');
  const wlSuccess = document.getElementById('waitlist-success');
  const wlEmail  = document.getElementById('waitlist-email');

  if (overlay) {
    // Open
    document.querySelectorAll('.waitlist-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('active');
        document.querySelector('.nav')?.classList.remove('open');
        setTimeout(() => wlEmail?.focus(), 350);
      });
    });

    // Close
    wlClose?.addEventListener('click', () => {
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
      }
    });

    // Submit
    wlForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = wlEmail?.value;
      if (!email) return;

      fetch('https://formsubmit.co/ajax/waitlist@co3.one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: email,
          _subject: 'miji Waitlist Signup'
        })
      }).catch(() => {});

      // Show success state
      wlForm.classList.add('hidden');
      wlSuccess.classList.add('show');

      // Auto-close after delay
      setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
          wlForm.classList.remove('hidden');
          wlSuccess.classList.remove('show');
          wlEmail.value = '';
        }, 400);
      }, 2200);
    });
  }


  /* ==========================================================
     8. CONTACT FORM
     ========================================================== */
  const contactOverlay = document.getElementById('contact-overlay');
  const contactForm    = document.getElementById('contact-form');
  const contactClose   = document.getElementById('contact-close');
  const contactSuccess = document.getElementById('contact-success');

  if (contactOverlay) {
    // Open
    document.querySelectorAll('.contact-trigger').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        contactOverlay.classList.add('active');
        document.querySelector('.nav')?.classList.remove('open');
      });
    });

    // Close
    contactClose?.addEventListener('click', () => {
      contactOverlay.classList.remove('active');
    });

    contactOverlay.addEventListener('click', (e) => {
      if (e.target === contactOverlay) contactOverlay.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && contactOverlay.classList.contains('active')) {
        contactOverlay.classList.remove('active');
      }
    });

    // Submit
    contactForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name    = document.getElementById('contact-name')?.value || '';
      const email   = document.getElementById('contact-email')?.value || '';
      const topic   = document.getElementById('contact-topic')?.value || 'General Inquiry';
      const message = document.getElementById('contact-message')?.value || '';

      fetch('https://formsubmit.co/ajax/support@co3.one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          _subject: 'miji Contact: ' + topic,
          message: message
        })
      }).catch(() => {});

      // Show success
      contactForm.classList.add('hidden');
      contactSuccess.classList.add('show');

      // Auto-close
      setTimeout(() => {
        contactOverlay.classList.remove('active');
        setTimeout(() => {
          contactForm.classList.remove('hidden');
          contactSuccess.classList.remove('show');
          contactForm.reset();
        }, 400);
      }, 2200);
    });
  }

})();
