/* =========================================================
   Quadreria Studio — site interactions
   ========================================================= */

/* ---------- Settings you may want to change ---------- */
window.QS_CONFIG = Object.assign({
  // Booking link (TopMate)
  bookingUrl: "https://topmate.io/ayushisingla/2372223?utm_source=public_profile&utm_campaign=ayushisingla",
  // Where guide-download emails are sent. Paste your Google Apps Script
  // Web App URL here (see README.md › "Collecting guide emails").
  // Left empty, the download still works; emails just aren't recorded.
  guideFormEndpoint: "",
  // Liquid background
  bg: { speed: 0.10, grain: 0.075, grainSize: 1.6, glow: 0.62 }
}, window.QS_CONFIG || {});

(function () {
  "use strict";
  const CFG = window.QS_CONFIG;
  const PROJECTS = window.QS_PROJECTS || [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none), (pointer: coarse)").matches;
  const root = document.documentElement;
  const body = document.body;

  /* ---------- Frame loop ---------- */
  const frameFns = [];
  const onFrame = fn => frameFns.push(fn);
  let vh = innerHeight, vw = innerWidth;
  addEventListener("resize", () => { vh = innerHeight; vw = innerWidth; });

  /* ---------- Smooth scrolling (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.095, smoothWheel: true, wheelMultiplier: 0.95 });
  }
  const scrollLock = { count: 0 };
  function lockScroll() { scrollLock.count++; if (lenis) lenis.stop(); else root.style.overflow = "hidden"; }
  function unlockScroll() {
    scrollLock.count = Math.max(0, scrollLock.count - 1);
    if (scrollLock.count) return;
    if (lenis) lenis.start(); else root.style.overflow = "";
  }
  function scrollToY(y, immediate) {
    if (lenis) lenis.scrollTo(y, { immediate: !!immediate, duration: 1.4 });
    else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }
  function scrollByY(dy) {
    if (lenis) lenis.scrollTo(lenis.targetScroll + dy, { immediate: true });
    else window.scrollBy(0, dy);
  }

  let lastY = scrollY, scrollVel = 0;
  function loop(t) {
    if (lenis) lenis.raf(t);
    const y = scrollY;
    scrollVel = lerp(scrollVel, y - lastY, 0.2);
    lastY = y;
    for (const fn of frameFns) fn(t, y);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* =========================================================
     Liquid background (from your quadreria-liquid-background.html)
     + interactive: a soft black glow follows the cursor and
       gently pulls the liquid toward it.
     ========================================================= */
  (function background() {
    const canvas = $("#bg");
    if (!canvas) return;
    if (/[?&]nobg\b/.test(location.search)) { canvas.remove(); return; } // testing switch
    const gl = canvas.getContext("webgl", { antialias: false, powerPreference: "low-power", premultipliedAlpha: false });
    if (!gl) { canvas.remove(); return; }
    const vert = "attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }";
    const frag = `
precision highp float;
uniform vec2 res; uniform float t; uniform float grain; uniform float gsize;
uniform vec2 mouse; uniform float mstr; uniform float glow;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(h12(i),h12(i+vec2(1,0)),u.x), mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),u.x), u.y);
}
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.02; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / res.y;
  vec2 m = mouse / res.y;
  float d = distance(uv, m);
  float g = exp(-d*d*7.0) * mstr;
  uv += (m - uv) * g * 0.10;                 // liquid leans toward the cursor

  vec2 q = vec2(fbm(uv*1.2 + t*.6), fbm(uv*1.2 - t*.4 + 3.1));
  vec2 r = vec2(fbm(uv*1.4 + 2.*q + vec2(1.7,9.2) + t*.3), fbm(uv*1.4 + 2.*q + vec2(8.3,2.8) - t*.25));
  float f = fbm(uv*1.1 + 2.5*r);

  vec3 base   = vec3(0.141, 0.0, 0.0);   // #240000
  vec3 shadow = vec3(0.035, 0.0, 0.0);   // near-black
  vec3 sheen  = vec3(0.22, 0.03, 0.04);  // faint deeper burgundy
  vec3 col = mix(shadow, base, smoothstep(.25, .75, f));
  col = mix(col, sheen, smoothstep(.68, 1.0, f*length(r)) * .5);
  col *= 1.0 - glow * exp(-d*d*4.0) * mstr; // black glow around the cursor

  vec2 gp = gl_FragCoord.xy / gsize;
  float n = noise(gp) * .6 + h12(floor(gl_FragCoord.xy)) * .4 - .5;
  col += n * grain * (0.55 + 3.0 * dot(col, vec3(.7,.2,.1)));
  gl_FragColor = vec4(max(col, 0.), 1.);
}`;
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    const uRes = U("res"), uT = U("t"), uG = U("grain"), uGs = U("gsize"), uM = U("mouse"), uMs = U("mstr"), uGlow = U("glow");
    let dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    addEventListener("resize", resize); resize();

    const mouse = { x: innerWidth * 0.62, y: innerHeight * 0.4, tx: innerWidth * 0.62, ty: innerHeight * 0.4, s: 0, ts: 0.35, last: 0 };
    const move = (x, y) => { mouse.tx = x; mouse.ty = y; mouse.ts = 1; mouse.last = performance.now(); };
    addEventListener("pointermove", e => move(e.clientX, e.clientY), { passive: true });
    addEventListener("touchmove", e => { const p = e.touches[0]; if (p) move(p.clientX, p.clientY); }, { passive: true });
    document.addEventListener("pointerleave", () => { mouse.ts = 0.2; });

    let time = 0, prev = performance.now(), visible = true;
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
    onFrame(now => {
      if (!visible) return;
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      if (!reduce) time += dt * CFG.bg.speed * (1 + Math.min(4, Math.abs(scrollVel) * 0.05));
      if (now - mouse.last > 1800) mouse.ts = 0.4;
      mouse.x = lerp(mouse.x, mouse.tx, 0.06); mouse.y = lerp(mouse.y, mouse.ty, 0.06); mouse.s = lerp(mouse.s, mouse.ts, 0.03);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, time);
      gl.uniform1f(uG, CFG.bg.grain); gl.uniform1f(uGs, CFG.bg.grainSize * dpr);
      gl.uniform2f(uM, mouse.x * dpr, (innerHeight - mouse.y) * dpr);
      gl.uniform1f(uMs, mouse.s); gl.uniform1f(uGlow, CFG.bg.glow);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  })();

  /* ---------- Page ready + transitions ---------- */
  function ready() { requestAnimationFrame(() => body.classList.add("is-ready")); }
  if (document.readyState === "complete") ready(); else addEventListener("load", ready);
  setTimeout(ready, 1600); // never wait too long for images
  addEventListener("pageshow", e => { if (e.persisted) { body.classList.remove("is-leaving"); body.classList.add("is-ready"); } });

  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || /^(mailto|tel):/.test(a.href)) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    body.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, 420);
  });

  /* ---------- Header state ---------- */
  onFrame((t, y) => { body.classList.toggle("scrolled", y > 30); });

  /* ---------- Clock (India time) ---------- */
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
    const tick = () => { const s = fmt.format(new Date()).toUpperCase(); clocks.forEach(c => c.textContent = s); };
    tick(); setInterval(tick, 15000);
  }

  /* ---------- Menu ---------- */
  (function menu() {
    const btn = $(".menu-toggle"), menu = $(".menu");
    if (!btn || !menu) return;
    let open = false;
    const set = v => {
      open = v; body.classList.toggle("menu-open", v); btn.setAttribute("aria-expanded", v);
      menu.setAttribute("aria-hidden", !v);
      v ? lockScroll() : unlockScroll();
    };
    btn.addEventListener("click", () => set(!open));
    addEventListener("keydown", e => { if (e.key === "Escape" && open) set(false); });
    const imgs = $$(".menu__frame img", menu), num = $(".menu__num-now", menu), name = $(".menu__name-now", menu);
    const links = $$(".menu__link", menu);
    const show = i => {
      imgs.forEach((im, j) => im.classList.toggle("on", j === i));
      if (num) num.textContent = String(i + 1).padStart(2, "0") + " / " + String(links.length).padStart(2, "0");
      if (name) name.textContent = links[i].dataset.name;
    };
    const cur = Math.max(0, links.findIndex(l => l.classList.contains("is-current")));
    show(cur);
    links.forEach((l, i) => l.addEventListener("mouseenter", () => show(i)));
    $(".menu__list", menu).addEventListener("mouseleave", () => show(cur));
  })();

  /* ---------- Custom cursor ---------- */
  const cursor = (function () {
    const el = $(".cursor");
    if (!el || touch) return { set() {} };
    const label = $(".cursor__label", el);
    let x = -100, y = -100, cx = -100, cy = -100, forced = null, seen = false;
    el.classList.add("is-hidden");
    addEventListener("pointermove", e => {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; cx = x; cy = y; el.classList.remove("is-hidden"); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => el.classList.add("is-hidden"));
    document.addEventListener("pointerenter", () => el.classList.remove("is-hidden"));
    const apply = target => {
      if (forced !== null) return;
      const c = target && target.closest && target.closest("[data-cursor]");
      const txt = c ? c.dataset.cursor : "";
      if (txt) { label.textContent = txt; el.classList.add("has-label"); } else el.classList.remove("has-label");
      el.classList.toggle("is-link", !txt && !!(target && target.closest && target.closest("a,button,[role=button]")));
    };
    document.addEventListener("pointerover", e => apply(e.target));
    onFrame(() => {
      cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      el.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    });
    return {
      set(txt) {
        forced = txt;
        if (txt) { label.textContent = txt; el.classList.add("has-label"); }
        else { el.classList.remove("has-label"); forced = null; }
      },
      refresh() { const t = document.elementFromPoint(x, y); apply(t); }
    };
  })();

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal], .lines").forEach(el => io.observe(el));

  /* ---------- Footer wordmark ripple (from your footer preview) ---------- */
  (function footer() {
    const mark = $(".footer-mark");
    if (!mark) return;
    const disp = $("#disp", mark), offT = $("#offT", mark), offG = $("#offG", mark), turb = $("#turb", mark);
    const fades = [$("#fringeFade feFuncA", mark), $("#fringeFade2 feFuncA", mark)];
    if (!disp) return;
    const FRINGE = 12, DURATION = 2200, START = 150;
    const setFringe = k => {
      offT.setAttribute("dx", (FRINGE * k).toFixed(2)); offT.setAttribute("dy", (2 * k).toFixed(2));
      offG.setAttribute("dx", (-FRINGE * k).toFixed(2)); offG.setAttribute("dy", (-2 * k).toFixed(2));
      fades.forEach(f => f && f.setAttribute("slope", Math.min(1, k * 1.6).toFixed(3)));
    };
    let raf;
    const play = () => {
      cancelAnimationFrame(raf);
      if (reduce) { disp.setAttribute("scale", 0); setFringe(0); return; }
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / DURATION, 1), ease = 1 - Math.pow(1 - p, 3);
        disp.setAttribute("scale", (START * (1 - ease)).toFixed(2)); setFringe(1 - ease);
        turb.setAttribute("baseFrequency", `${(0.0022 + 0.0011 * Math.sin(now / 700)).toFixed(5)} 0.010`);
        if (p < 1) raf = requestAnimationFrame(step);
      })(t0);
    };
    disp.setAttribute("scale", START); setFringe(1);
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) play(); else { disp.setAttribute("scale", START); setFringe(1); }
    }), { threshold: 0.35 }).observe(mark);
    mark.addEventListener("pointerenter", play);
  })();

  /* =========================================================
     Project viewer — opens a project as a horizontal gallery
     ========================================================= */
  const viewer = (function () {
    const el = $(".viewer");
    if (!el || !PROJECTS.length) return null;
    const track = $(".viewer__track", el), bar = $(".viewer__progress .bar i", el), pct = $(".viewer__progress .pct", el);
    const hint = $(".viewer__hint", el);
    let index = 0, x = 0, target = 0, max = 0, isOpen = false, over = 0, switching = false;

    const src = (p, f) => p.folder + f;
    function build(i) {
      const p = PROJECTS[i], n = PROJECTS[(i + 1) % PROJECTS.length];
      const pad = String(i + 1).padStart(2, "0");
      track.innerHTML = `
        <div class="viewer__info">
          <span class="label label--dim stagger">Concept ${pad} / ${String(PROJECTS.length).padStart(2, "0")}</span>
          <h2 class="stagger">${p.title}</h2>
          <p class="stagger">${p.description}</p>
          <dl class="label stagger">
            <dt>Category</dt><dd>${p.category}</dd>
            <dt>Year</dt><dd>${p.year}</dd>
            <dt>Scope</dt><dd>${p.deliverables}</dd>
          </dl>
        </div>
        <figure class="viewer__fig viewer__fig--cover" style="aspect-ratio:1"><img src="${src(p, "cover.jpg")}" alt="${p.title} — cover" style="width:100%;object-fit:cover"></figure>
        ${p.gallery.map((g, k) => `<figure class="viewer__fig stagger"><img src="${src(p, g)}" alt="${p.title} — image ${k + 1}" loading="eager"></figure>`).join("")}
        <div class="viewer__next stagger" data-cursor="Next project">
          <span class="label label--dim">Next project</span>
          <div class="thumb"><img src="${src(n, "cover.jpg")}" alt=""></div>
          <h3>${n.title}</h3>
          <span class="label">${n.category}</span>
        </div>`;
      $(".viewer__next", track).addEventListener("click", () => go(1));
      $$("img", track).forEach(im => im.addEventListener("load", measure));
      x = target = 0; over = 0;
      measure();
      history.replaceState(null, "", "#" + p.id);
    }
    function measure() { max = Math.max(0, track.scrollWidth - innerWidth); }
    addEventListener("resize", () => isOpen && measure());

    function fly(a, done) {
      const cover = $(".viewer__fig--cover", track);
      if (!a || !a.width || reduce) { done(); return; }
      const b = cover.getBoundingClientRect();
      const img = new Image(); img.src = $("img", cover).src; img.className = "viewer__fly";
      Object.assign(img.style, { left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px" });
      document.body.appendChild(img);
      cover.style.visibility = "hidden";
      const sx = a.width / b.width, sy = a.height / b.height;
      const anim = img.animate([
        { transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(${sx},${sy})`, transformOrigin: "0 0", filter: "blur(0px)" },
        { transform: "none", transformOrigin: "0 0" }
      ], { duration: 1050, easing: "cubic-bezier(.7,0,.2,1)" });
      anim.onfinish = () => { cover.style.visibility = ""; img.remove(); done(); };
    }

    function open(i, fromEl) {
      if (isOpen) return;
      const fromRect = fromEl ? fromEl.getBoundingClientRect() : null;
      index = (i + PROJECTS.length) % PROJECTS.length;
      isOpen = true;
      build(index);
      body.classList.add("viewer-open");
      lockScroll();
      el.classList.add("open"); el.setAttribute("aria-hidden", "false");
      cursor.set(null);
      requestAnimationFrame(() => { measure(); fly(fromRect, () => el.classList.add("shown")); });
    }
    function close() {
      if (!isOpen) return;
      isOpen = false;
      el.classList.remove("shown", "open"); el.setAttribute("aria-hidden", "true");
      body.classList.remove("viewer-open");
      unlockScroll();
      history.replaceState(null, "", location.pathname + location.search);
    }
    function go(dir) {
      if (switching) return;
      switching = true;
      el.classList.remove("shown");
      track.style.transition = "opacity .45s";
      track.style.opacity = "0";
      setTimeout(() => {
        index = (index + dir + PROJECTS.length) % PROJECTS.length;
        build(index);
        track.style.opacity = "1";
        requestAnimationFrame(() => el.classList.add("shown"));
        setTimeout(() => { switching = false; track.style.transition = ""; }, 500);
      }, 450);
    }
    function push(delta) {
      if (switching) return;
      const nt = target + delta;
      if (nt > max) { over += nt - max; target = max; if (over > 420) go(1); }
      else if (nt < 0) { over += nt; target = 0; if (over < -420) go(-1); }
      else { over = 0; target = nt; }
    }
    el.addEventListener("wheel", e => {
      e.preventDefault();
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      push(d * (e.deltaMode === 1 ? 32 : 1));
    }, { passive: false });
    let tx = 0, ty = 0, vel = 0;
    el.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; vel = 0; }, { passive: true });
    el.addEventListener("touchmove", e => {
      const t = e.touches[0], d = (tx - t.clientX) + (ty - t.clientY) * 0.8;
      tx = t.clientX; ty = t.clientY; vel = d; push(d * 1.4);
    }, { passive: true });
    el.addEventListener("touchend", () => { push(vel * 10); });
    addEventListener("keydown", e => {
      if (!isOpen) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") push(innerWidth * 0.4);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") push(-innerWidth * 0.4);
    });
    $(".viewer__close", el).addEventListener("click", close);

    onFrame(() => {
      if (!isOpen) return;
      x = lerp(x, target, 0.085);
      track.style.transform = `translate3d(${-x}px,0,0)`;
      const p = max ? x / max : 0;
      bar.style.transform = `scaleX(${p})`;
      pct.textContent = Math.round(p * 100) + "%";
      hint.textContent = p > 0.97 ? "Scroll down to next project" : (p < 0.02 ? "Scroll up to previous project" : "");
      $$(".viewer__fig", track).forEach(f => {
        const r = f.getBoundingClientRect();
        const enter = clamp((innerWidth - r.left) / (innerWidth * 0.45));
        const im = f.firstElementChild;
        const par = (r.left + r.width / 2 - innerWidth / 2) * -0.05;
        im.style.transform = `translate3d(${par}px,0,0) scale(${1.12 - 0.04 * enter})`;
        im.style.filter = enter < 1 ? `blur(${(1 - enter) * 14}px)` : "none";
      });
    });

    if (location.hash) {
      const i = PROJECTS.findIndex(p => "#" + p.id === location.hash);
      if (i > -1) setTimeout(() => open(i), 500);
    }
    return { open, close };
  })();
  window.QS = { viewer, scrollToY };

  /* =========================================================
     HOME
     ========================================================= */
  (function hero() {
    const hero = $(".hero");
    if (!hero) return;
    const top = $(".hero__top", hero), mid = $(".hero__mid", hero), mark = $(".hero__mark", hero);
    onFrame((t, y) => {
      if (y > vh * 1.4) { body.classList.add("header-logo"); return; }
      const k = clamp(y / (vh * 0.55));
      top.style.opacity = 1 - k; top.style.transform = `translate3d(0,${-y * 0.25}px,0)`;
      mid.style.opacity = 1 - clamp(y / (vh * 0.35)); mid.style.transform = `translate3d(0,${-y * 0.15}px,0)`;
      mark.style.transform = `translate3d(0,${-y * 0.38}px,0)`;
      body.classList.toggle("header-logo", y > vh * 0.62);
    });
  })();

  (function showcase() {
    const sec = $(".showcase");
    if (!sec || !PROJECTS.length) return;
    const ring = $(".showcase__ring", sec);
    const N = PROJECTS.length;
    ring.innerHTML = PROJECTS.map((p, i) => `
      <div class="card" data-i="${i}">
        <div class="card__img"><img src="${p.folder}cover.jpg" alt="${p.title}" draggable="false"></div>
        <div class="card__shade"></div>
      </div>`).join("");
    const cards = $$(".card", ring).map(el => ({ el, img: $("img", el), shade: $(".card__shade", el) }));
    const tTitle = $(".showcase__title h3", sec), tCat = $(".showcase__title .label", sec), tCount = $(".showcase__count", sec);
    let cur = 0, target = 0, size = 300, active = -1, startTop = 0, span = 1;
    const measure = () => {
      size = cards[0].el.offsetWidth;
      startTop = sec.getBoundingClientRect().top + scrollY;
      span = (sec.offsetHeight - innerHeight) / Math.max(1, N - 1);
    };
    measure(); addEventListener("resize", measure); addEventListener("load", measure);
    const toCard = i => scrollToY(startTop + clamp(i, 0, N - 1) * span + 2);

    // drag
    let down = false, sx = 0, moved = 0, lastX = 0;
    ring.addEventListener("pointerdown", e => { down = true; sx = lastX = e.clientX; moved = 0; ring.setPointerCapture(e.pointerId); });
    ring.addEventListener("pointermove", e => {
      if (!down) return;
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      if (moved > 4) ring.classList.add("dragging");
      scrollByY(-dx * span / (size * 1.08));
    });
    const up = e => {
      if (!down) return; down = false; ring.classList.remove("dragging");
      if (moved < 6) {
        const c = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList && n.classList.contains("card"));
        if (c) {
          const i = +c.dataset.i;
          if (i === Math.round(cur)) viewer && viewer.open(i, $(".card__img", c)); else toCard(i);
        }
      } else toCard(Math.round(target));
    };
    ring.addEventListener("pointerup", up); ring.addEventListener("pointercancel", up);
    $$(".showcase__nav button", sec).forEach(b => b.addEventListener("click", () => toCard(Math.round(cur) + (+b.dataset.dir))));

    onFrame((t, y) => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = clamp(-r.top / (sec.offsetHeight - vh));
      target = p * (N - 1);
      cur = lerp(cur, target, 0.11);
      const step = size * (vw < 900 ? 0.98 : 1.08);
      cards.forEach((c, i) => {
        const d = i - cur, ad = Math.abs(d), s = Math.sign(d);
        const x = s * (ad <= 1 ? ad * step : step + (ad - 1) * step * 0.6);
        const rot = -s * Math.min(ad, 1.4) * 40;
        const z = -Math.min(ad, 2.6) * size * 0.6;
        c.el.style.transform = `translate3d(${x}px,0,${z}px) rotateY(${rot}deg)`;
        c.el.style.opacity = clamp(1 - (ad - 2.1) * 1.6);
        c.el.style.zIndex = 100 - Math.round(ad * 10);
        c.shade.style.opacity = Math.min(ad * 0.38, 0.62);
        c.img.style.transform = `translate3d(${-d * 6}%,0,0)`;
      });
      const a = clamp(Math.round(cur), 0, N - 1);
      if (a !== active) {
        active = a;
        const p2 = PROJECTS[a];
        tTitle.textContent = p2.title; tCat.textContent = p2.category + " · " + p2.year;
        tCount.textContent = String(a + 1).padStart(2, "0") + " / " + String(N).padStart(2, "0");
        cards.forEach((c, i) => c.el.dataset.cursor = i === a ? "Open project" : "View");
        cursor.refresh && cursor.refresh();
      }
    });
  })();

  (function cuboid() {
    const sec = $(".cuboid");
    if (!sec) return;
    const scene = $(".cuboid__scene", sec), prism = $(".prism", sec), faces = $$(".face", sec);
    const tabs = $$(".cuboid__tabs button", sec), meta = $(".cuboid__count", sec);
    const scale = $(".cuboid__scale", sec);
    const F = faces.length;
    scale.innerHTML = "<i></i>".repeat(44);
    const ticks = $$("i", scale);
    let h = 300, active = -1, ang = 0;
    const place = () => {
      h = scene.offsetHeight;
      faces.forEach((f, i) => f.style.transform = `rotateX(${i * -90}deg) translateZ(${h / 2}px)`);
    };
    place(); addEventListener("resize", place);
    const smooth = t => t * t * (3 - 2 * t);
    tabs.forEach((b, i) => b.addEventListener("click", () => {
      const top = sec.getBoundingClientRect().top + scrollY, len = sec.offsetHeight - innerHeight;
      scrollToY(top + len * (0.06 + 0.88 * (i / (F - 1))) + 2);
    }));
    onFrame(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = clamp(-r.top / (sec.offsetHeight - vh));
      const seg = clamp((p - 0.06) / 0.88) * (F - 1);
      const k = Math.min(F - 2, Math.floor(seg)), tt = seg - k;
      const e = smooth(clamp((tt - 0.18) / 0.64));
      const want = (k + e) * 90;
      ang = lerp(ang, want, 0.14);
      prism.style.transform = `translateZ(${-h / 2}px) rotateX(${ang}deg)`;
      const a = clamp(Math.round(ang / 90), 0, F - 1);
      if (a !== active) {
        active = a;
        tabs.forEach((b, i) => b.classList.toggle("on", i === a));
        meta.textContent = String(a + 1).padStart(2, "0") + " / " + String(F).padStart(2, "0");
      }
      ticks.forEach((tk, j) => {
        const d = j / (ticks.length - 1) - p, g = Math.exp(-(d * d) / 0.006);
        tk.style.width = (8 + 34 * g) + "px"; tk.style.opacity = 0.3 + 0.7 * g;
      });
    });
  })();

  (function highlights() {
    const wrap = $(".hl");
    if (!wrap) return;
    wrap.innerHTML = PROJECTS.map((p, i) => `
      <article class="hl__panel" data-i="${i}" data-cursor="View highlights">
        <div class="hl__media"><img src="${p.folder}highlight.jpg" alt="${p.title}" loading="lazy"></div>
        <div class="hl__veil"></div>
        <div class="hl__meta label"><span>Concept collection</span><span>${p.category}</span><span>${p.year}</span></div>
        <h3 class="hl__title">${p.title}</h3>
        <span class="hl__cta label dot">View highlights</span>
        <div class="hl__dim" style="position:absolute;inset:0;background:#0d0000;opacity:0;pointer-events:none"></div>
      </article>`).join("");
    const panels = $$(".hl__panel", wrap).map(el => ({ el, media: $(".hl__media", el), title: $(".hl__title", el), dim: $(".hl__dim", el) }));
    panels.forEach((p, i) => p.el.addEventListener("click", () => viewer && viewer.open(i, p.media)));
    onFrame((t, y) => {
      const top = wrap.getBoundingClientRect().top + y;
      panels.forEach((p, i) => {
        const start = top + i * vh - vh;           // panel starts entering
        const q = clamp((y - start) / (vh * 2));    // 0 → entering, .5 → full, 1 → covered
        if (q <= 0 || q >= 1) return;
        p.title.style.transform = `translate3d(0,calc(-50% + ${(0.5 - q) * 70}vh),0)`;
        p.media.style.transform = `scale(${1.12 - 0.12 * clamp(q * 2)})`;
        p.dim.style.opacity = i < panels.length - 1 ? clamp((q - 0.5) * 2) * 0.7 : 0;
      });
    });
  })();

  /* =========================================================
     WORK
     ========================================================= */
  (function works() {
    const list = $(".works__list");
    if (!list) return;
    list.innerHTML = PROJECTS.map((p, i) => `
      <article class="work" data-i="${i}" data-cursor="Open project">
        <div class="work__left">
          <div><h2>${p.title}</h2><span class="label label--dim">${p.tags}</span></div>
          <span class="label label--dim">${p.year}</span>
        </div>
        <div class="work__img"><img src="${p.folder}cover.jpg" alt="${p.title}" loading="lazy"></div>
        <div class="work__right">
          <span class="label">Concept collection<br><span class="label--dim">(${String(i + 1).padStart(2, "0")})</span></span>
          <span class="label label--dim">${p.category}</span>
        </div>
      </article>`).join("");
    const rows = $$(".work", list);
    rows.forEach((r, i) => r.addEventListener("click", () => viewer && viewer.open(i, $(".work__img", r))));
    let active = -1;
    onFrame(() => {
      let best = 0, bd = Infinity;
      rows.forEach((r, i) => { const b = r.getBoundingClientRect(); const d = Math.abs(b.top + b.height / 2 - vh / 2); if (d < bd) { bd = d; best = i; } });
      if (best !== active) { active = best; rows.forEach((r, i) => r.classList.toggle("active", i === best)); }
    });
  })();

  /* =========================================================
     SERVICES — FAQ accordion
     ========================================================= */
  $$(".faq__item").forEach(item => {
    const q = $(".faq__q", item);
    q.addEventListener("click", () => {
      const open = !item.classList.contains("open");
      item.classList.toggle("open", open); q.setAttribute("aria-expanded", open);
    });
  });

  /* =========================================================
     GUIDES — email popup, then download
     ========================================================= */
  (function guides() {
    const modal = $(".modal");
    if (!modal) return;
    const input = $("input[type=email]", modal), dl = $(".modal__download", modal), again = $(".modal__again", modal);
    const t = { no: $(".modal__no", modal), title: $(".modal__title", modal), cover: $(".modal__cover img", modal) };
    const valid = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
    let current = null;
    try { input.value = localStorage.getItem("qs_email") || ""; } catch (e) {}
    const sync = () => dl.setAttribute("aria-disabled", !valid(input.value));
    input.addEventListener("input", sync);
    function open(g) {
      current = g;
      t.no.textContent = g.dataset.no; t.title.textContent = g.dataset.title;
      t.cover.src = g.dataset.cover; t.cover.alt = g.dataset.title;
      dl.href = g.dataset.pdf; dl.setAttribute("download", g.dataset.pdf.split("/").pop());
      again.href = g.dataset.pdf;
      modal.classList.remove("done"); modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
      lockScroll(); sync();
      setTimeout(() => input.focus({ preventScroll: true }), 300);
    }
    function close() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); unlockScroll(); }
    $$("[data-guide]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); open(b.closest(".guide")); }));
    $$(".modal__close, .modal__bg", modal).forEach(b => b.addEventListener("click", close));
    addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) close(); });
    $(".modal__form", modal).addEventListener("submit", e => { e.preventDefault(); if (valid(input.value)) dl.click(); });
    dl.addEventListener("click", e => {
      if (!valid(input.value)) { e.preventDefault(); input.focus(); return; }
      const email = input.value.trim();
      try { localStorage.setItem("qs_email", email); } catch (err) {}
      if (CFG.guideFormEndpoint) {
        const fd = new FormData();
        fd.append("email", email); fd.append("guide", current ? current.dataset.title : ""); fd.append("page", location.href);
        fetch(CFG.guideFormEndpoint, { method: "POST", mode: "no-cors", body: fd }).catch(() => {});
      }
      setTimeout(() => modal.classList.add("done"), 250);
    });
  })();

  /* =========================================================
     ABOUT — icon draws itself while the story scrolls
     ========================================================= */
  (function story() {
    const sec = $(".story");
    if (!sec) return;
    const path = $(".story__icon path", sec), items = $$(".story__item", sec), count = $(".story__count", sec);
    const L = path.getTotalLength();
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    let active = -1, draw = 0;
    onFrame(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = clamp(-r.top / (sec.offsetHeight - vh));
      draw = lerp(draw, clamp(p / 0.86), 0.1);
      path.style.strokeDashoffset = L * (1 - draw);
      path.style.fillOpacity = clamp((p - 0.86) / 0.1);
      const a = Math.min(items.length - 1, Math.floor(p * items.length * 0.999));
      if (a !== active) {
        active = a;
        items.forEach((it, i) => { it.classList.toggle("on", i === a); it.classList.toggle("past", i === a - 1); });
        count.textContent = String(a + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0") + " — " + $("h3", items[a]).textContent;
      }
    });
  })();

  /* Booking links pick up the configured URL */
  $$("[data-booking]").forEach(a => { a.href = CFG.bookingUrl; a.target = "_blank"; a.rel = "noopener"; });
})();
