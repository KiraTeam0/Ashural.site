/*
 * أشورال — حركات رسومية للصفحة الرئيسية.
 * لا مكتبات خارجية. كل حركة تتوقف إذا الزائر اختار «تقليل الحركة»،
 * والرسم المستمر يتوقف إذا القسم خارج الشاشة أو التبويب بالخلفية.
 */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------- شريط تقدّم القراءة */
  function progressBar() {
    if (reduced) return;
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(scrollY / max, 1) : 0) + ")";
      ticking = false;
    }
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------- شبكة نقاط متصلة تتحرّك خلف البطل */
  function heroNetwork() {
    var hero = document.querySelector(".hero");
    if (!hero || reduced) return;
    ["o1", "o2"].forEach(function (c) {
      var o = document.createElement("span");
      o.className = "hero-orb " + c;
      o.setAttribute("aria-hidden", "true");
      hero.insertBefore(o, hero.firstChild);
    });
    var cv = document.createElement("canvas");
    cv.className = "hero-net";
    cv.setAttribute("aria-hidden", "true");
    hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], mouse = { x: -9999, y: -9999 };
    var LINK = 130;

    function resize() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(26, (W * H) / 16000)));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
          r: Math.random() * 1.6 + .8,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        // المؤشّر يجذب النقاط القريبة قليلاً
        var mdx = mouse.x - p.x, mdy = mouse.y - p.y, md = Math.hypot(mdx, mdy);
        if (md < 160 && md > 1) { p.x += mdx / md * .35; p.y += mdy / md * .35; }
      }
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y, d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = "rgba(76,217,168," + (0.22 * (1 - d / LINK)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = "rgba(140,255,210,.75)";
      for (var k = 0; k < pts.length; k++) {
        ctx.beginPath(); ctx.arc(pts[k].x, pts[k].y, pts[k].r, 0, Math.PI * 2); ctx.fill();
      }
    }

    var running = false, visible = true, raf = 0;
    function loop() { if (!running) return; frame(); raf = requestAnimationFrame(loop); }
    function sync() {
      var should = visible && !document.hidden;
      if (should && !running) { running = true; loop(); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(hero);
    }
    document.addEventListener("visibilitychange", sync);
    if (finePointer) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
    }
    var rt = 0;
    addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });
    resize();
    sync();
  }

  /* ---------------------------------------- نبضة ضوء تجري على خط النبض */
  function pulseBlip() {
    var wrap = document.querySelector(".pulse-wrap");
    var path = wrap && wrap.querySelector(".pulse-line");
    var svg = wrap && wrap.querySelector("svg");
    if (!path || !svg || reduced || !path.getTotalLength) return;
    var dot = document.createElement("span");
    dot.className = "pulse-blip";
    dot.setAttribute("aria-hidden", "true");
    wrap.appendChild(dot);
    var len = path.getTotalLength();
    var vb = svg.viewBox.baseVal;
    var t0 = 0, DUR = 3600;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = ((ts - t0) % DUR) / DUR;
      var pt = path.getPointAtLength(k * len);
      var r = svg.getBoundingClientRect();
      dot.style.left = (pt.x / vb.width) * r.width + "px";
      dot.style.top = (pt.y / vb.height) * r.height + "px";
      requestAnimationFrame(step);
    }
    // يبدأ بعد ما ينرسم الخط (٢٫٦ ثانية في الـCSS)
    setTimeout(function () { dot.classList.add("on"); requestAnimationFrame(step); }, 2700);
  }

  /* ------------------------------------ بقعة ضوء تتبع المؤشّر على البطاقات */
  function spotlights() {
    if (reduced || !finePointer) return;
    document.querySelectorAll(".pillar, .step, .next-project, .contact-form").forEach(function (el) {
      el.classList.add("spot");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ----------------------------------------------- موجة عند ضغط الأزرار */
  function ripples() {
    if (reduced) return;
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".btn-primary, .btn-ghost, .form-submit");
      if (!b) return;
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
      var w = document.createElement("span");
      w.className = "ripple";
      w.style.width = w.style.height = s + "px";
      w.style.left = e.clientX - r.left - s / 2 + "px";
      w.style.top = e.clientY - r.top - s / 2 + "px";
      b.appendChild(w);
      setTimeout(function () { w.remove(); }, 700);
    });
  }

  progressBar();
  heroNetwork();
  pulseBlip();
  spotlights();
  ripples();
})();
