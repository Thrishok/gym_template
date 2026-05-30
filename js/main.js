/* ============================================================
   PULSE — main.js
   - Lenis smooth scroll synced to GSAP
   - GSAP ScrollTrigger reveals
   - Custom cursor
   - Loader sequence + hero intro
   - Stat counters (with suffix support)
   - Horizontal programs rail
   - Scroll progress bar
   - Theme toggle (persisted)
   ============================================================ */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover:none)').matches;

  /* =========================================================
     1. Lenis smooth scroll synced to GSAP
     ========================================================= */
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* anchor links go through lenis */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1){
        const target = document.querySelector(id);
        if (target){
          e.preventDefault();
          lenis.scrollTo(target, { offset: 0, duration: 1.3 });
          document.querySelector('.nav-links')?.classList.remove('open');
        }
      }
    });
  });

  /* =========================================================
     2. Split section titles into words (preserve <em>)
     ========================================================= */
  document.querySelectorAll('.reveal-text').forEach((el) => {
    const frags = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) frags.push({ type:'text', content:n.textContent });
      else if (n.nodeType === Node.ELEMENT_NODE) frags.push({ type:'el', content:n.textContent });
    });
    el.innerHTML = '';
    frags.forEach(f => {
      f.content.split(/(\s+)/).forEach(part => {
        if (/\s+/.test(part)){
          el.appendChild(document.createTextNode(part));
        } else if (part.length){
          const wrap = document.createElement('span');
          wrap.className = 'word';
          const inner = document.createElement(f.type === 'el' ? 'em' : 'span');
          inner.textContent = part;
          if (f.type === 'el'){
            const innerSpan = document.createElement('span');
            innerSpan.appendChild(inner);
            wrap.appendChild(innerSpan);
          } else {
            wrap.appendChild(inner);
          }
          el.appendChild(wrap);
        }
      });
    });
  });

  /* =========================================================
     3. Loader sequence
     ========================================================= */
  const loader        = document.querySelector('.loader');
  const loaderFill    = document.querySelector('.loader-fill');
  const loaderPercent = document.querySelector('.loader-percent span');

  function runLoader(onComplete){
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const fake = { v: 0 };
    tl.to(fake, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate(){
        const v = Math.round(fake.v);
        if (loaderPercent) loaderPercent.textContent = v;
        if (loaderFill)    loaderFill.style.right = (100 - v) + '%';
      }
    })
    .to('.loader-inner', { y: -20, opacity: 0, duration: .55, ease:'power3.in' }, '+=.12')
    .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut', onComplete }, '-=.2');
  }

  /* =========================================================
     4. Hero intro
     ========================================================= */
  function runHero(){
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.to('.hero-title .line > span', { yPercent: 0, duration: 1.05, stagger: .09 })
      .from('.hero-meta > *', { y: 16, opacity: 0, duration: .6, stagger: .06 }, '-=.65')
      .from('.hero-sub', { y: 20, opacity: 0, duration: .8 }, '-=.5')
      .from('.hero-actions > *', { y: 20, opacity: 0, duration: .6, stagger: .08 }, '-=.55')
      .from('.hero-quickstats .qstat', { y: 20, opacity: 0, duration: .6, stagger: .08 }, '-=.4')
      .from('.nav', { y: -30, opacity: 0, duration: .7 }, '-=1.1')
      .from('.hero-scroll', { opacity: 0, duration: .6 }, '-=.4');
  }

  /* =========================================================
     5. Reveals on scroll
     ========================================================= */
  function setupReveals(){
    document.querySelectorAll('.reveal-text').forEach(el => {
      const inners = el.querySelectorAll('.word > *');
      gsap.set(inners, { yPercent: 110 });
      gsap.to(inners, {
        yPercent: 0, duration: 1, ease: 'power3.out', stagger: .03,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    gsap.utils.toArray('.reveal-up').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });

    /* gallery mask pop-in */
    gsap.utils.toArray('.g-item').forEach((el, i) => {
      gsap.from(el, {
        clipPath: 'inset(18% 18% 18% 18%)', opacity: 0,
        duration: 1.1, ease: 'power3.out', delay: (i % 3) * .06,
        scrollTrigger: { trigger: el, start: 'top 90%' }
      });
    });
  }

  /* =========================================================
     6. Stat counters (supports data-suffix, e.g. "+", "/7", "k")
     ========================================================= */
  function setupStats(){
    document.querySelectorAll('[data-stat]').forEach(stat => {
      const target = +stat.dataset.target;
      const suffix = stat.dataset.suffix || '';
      const numEl  = stat.matches('.stat') ? stat.querySelector('.stat-num') : stat;
      const obj    = { v: 0 };
      ScrollTrigger.create({
        trigger: stat, start: 'top 92%', once: true,
        onEnter(){
          gsap.to(obj, {
            v: target, duration: 1.8, ease: 'power3.out',
            onUpdate(){ numEl.textContent = Math.round(obj.v).toLocaleString() + suffix; },
            onComplete(){ numEl.textContent = target.toLocaleString() + suffix; }
          });
        }
      });
    });
  }

  /* =========================================================
     7. Horizontal programs rail (vertical scroll -> horizontal)
     ========================================================= */
  function setupRail(){
    const rail  = document.querySelector('[data-rail]');
    const track = document.querySelector('[data-rail-track]');
    const fill  = document.querySelector('.prog-progress-fill');
    if (!rail || !track) return;

    if (window.innerWidth < 900){
      rail.style.overflowX = 'auto';
      track.style.paddingRight = '24px';
      return;
    }

    const getDistance = () => track.scrollWidth - window.innerWidth + 80;
    gsap.to(track, {
      x: () => -getDistance(), ease: 'none',
      scrollTrigger: {
        trigger: rail, pin: true, start: 'top 12%',
        end: () => '+=' + getDistance(), scrub: 0.6, invalidateOnRefresh: true,
        onUpdate(self){ if (fill) fill.style.width = (self.progress * 100) + '%'; }
      }
    });
    window.addEventListener('resize', () => ScrollTrigger.refresh());
  }

  /* =========================================================
     8. Scroll progress bar
     ========================================================= */
  function setupProgress(){
    const fill = document.querySelector('.scroll-progress-fill');
    if (!fill) return;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => { fill.style.width = (self.progress * 100) + '%'; }
    });
  }

  /* =========================================================
     9. Nav scrolled state
     ========================================================= */
  function setupNav(){
    const nav = document.querySelector('.nav');
    ScrollTrigger.create({
      start: 'top -10', end: 'max',
      onUpdate: (self) => nav.classList.toggle('scrolled', self.scroll() > 40)
    });
  }

  /* =========================================================
     10. Theme toggle (persisted)
     ========================================================= */
  function setupTheme(){
    const STORAGE = 'pulse-theme';
    const btn = document.querySelector('.nav-theme');
    let initial = localStorage.getItem(STORAGE);
    if (!initial) initial = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    if (initial === 'light') document.body.classList.add('light');
    notify();

    btn?.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light');
      localStorage.setItem(STORAGE, isLight ? 'light' : 'dark');
      notify();
    });
    function notify(){
      const t = document.body.classList.contains('light') ? 'light' : 'dark';
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: t } }));
    }
  }

  /* =========================================================
     11. Custom cursor
     ========================================================= */
  function setupCursor(){
    if (isTouch) return;
    const dot  = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    (function loop(){
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('[data-cursor="hover"], a, button, input, select').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
    document.addEventListener('mouseleave', () => { dot.style.opacity = ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { dot.style.opacity = ring.style.opacity = '1'; });
  }

  /* =========================================================
     12. Burger toggle (mobile)
     ========================================================= */
  const burger = document.querySelector('.nav-burger');
  burger?.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (!links) return;
    const isOpen = links.classList.toggle('open');
    Object.assign(links.style, isOpen
      ? { display:'flex', flexDirection:'column', position:'fixed', inset:'70px 0 auto 0',
          background:'rgba(10,11,13,.97)', padding:'34px var(--gut)', gap:'22px',
          backdropFilter:'blur(14px)', zIndex:'90', alignItems:'flex-start' }
      : { display:'' });
  });

  /* =========================================================
     13. Boot
     ========================================================= */
  gsap.set('.hero-title .line > span', { yPercent: 110 });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('js-ready');
    setupTheme();
    setupCursor();
    setupNav();
    setupProgress();

    if (reduced){
      loader.style.display = 'none';
      gsap.set('.hero-title .line > span', { yPercent: 0 });
      gsap.set('.reveal-up', { opacity: 1, y: 0 });
      setupReveals(); setupStats(); setupRail();
      return;
    }

    runLoader(() => {
      loader.style.display = 'none';
      runHero();
      setupReveals(); setupStats(); setupRail();
      ScrollTrigger.refresh();
    });
  });
})();
