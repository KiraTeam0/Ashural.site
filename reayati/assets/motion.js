/*
 * رعايتي — حركات رسومية: أيقونات طبية تطفو، خط نبض القلب، شريط التقدّم،
 * وموجة الأزرار. تحسيني بالكامل: بلا جافاسكربت أو مع «تقليل الحركة»
 * الصفحة تبقى كاملة.
 */
(function () {
  "use strict";
  // الحركة تشتغل دائماً بقرار صاحب الموقع، حتى لو الهاتف مفعّل عليه «تقليل الحركة».
var reduced = false;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var ICONS = {
    heart: '<svg viewBox="0 0 48 48"><path fill="#ef4f5f" d="M24 41s-15-9.2-15-20.4C9 14.5 13.3 10 18.6 10c2.5 0 4.4 1.2 5.4 3 1-1.8 2.9-3 5.4-3C34.7 10 39 14.5 39 20.6 39 31.8 24 41 24 41z"/></svg>',
    plus: '<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="11" fill="#14b8a6"/><path d="M24 15v18M15 24h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',
    pill: '<svg viewBox="0 0 48 48"><g transform="rotate(-40 24 24)"><rect x="6" y="16" width="36" height="16" rx="8" fill="#f6b93b"/><path d="M24 16h10a8 8 0 0 1 0 16H24z" fill="#fff" stroke="#f6b93b" stroke-width="2"/></g></svg>',
    drop: '<svg viewBox="0 0 48 48"><path fill="#8b8cf0" d="M24 6s13 14.6 13 23.4A13 13 0 0 1 11 29.4C11 20.6 24 6 24 6z"/><path d="M18 30a6 6 0 0 0 6 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    steth: '<svg viewBox="0 0 48 48" fill="none" stroke="#0f766e" stroke-width="3.4" stroke-linecap="round"><path d="M13 7v12a9 9 0 0 0 18 0V7"/><path d="M22 28v4a8 8 0 0 0 16 0v-3"/><circle cx="38" cy="25" r="4.2" fill="#e8f7f5"/></svg>',
    shield: '<svg viewBox="0 0 48 48"><path fill="#14b8a6" d="M24 5l15 6v11c0 10.2-6.4 17.6-15 21-8.6-3.4-15-10.8-15-21V11z"/><path d="M17 24l5 5 9-10" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    syringe: '<svg viewBox="0 0 48 48" fill="none" stroke="#0a5450" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M33 8l7 7M36.5 11.5L17 31l-6-6L30.5 5.5z"/><path d="M14 28l-6 6M20 19l3 3M24 15l3 3"/></svg>',
  };

  // المكان نسبة من البطل، الحجم، مدة الطفو، الدوران، الظهور، الشفافية
  var LAYOUT = [
    // العنصر العاشر: مكانه على الهاتف [يسار٪، أعلى٪] — بجانب الأزرار حيث الفراغ.
    ["heart", 8, 18, 46, 7, 10, 0.2, 0.9, "", [5, 56]],
    ["plus", 86, 14, 50, 8, -9, 0.35, 0.85, "", [86, 60]],
    ["pill", 15, 70, 42, 9, 14, 0.5, 0.8, "", [7, 73]],
    ["drop", 90, 64, 38, 7.5, -12, 0.65, 0.75, "", [88, 77]],
    ["steth", 4, 44, 44, 10, 8, 0.8, 0.7, "hide-sm"],
    ["shield", 94, 38, 40, 8.5, -6, 0.95, 0.75, "hide-sm"],
    ["syringe", 78, 86, 36, 9.5, 10, 1.1, 0.65, "hide-sm"],
    ["heart", 24, 90, 28, 6.5, -10, 1.25, 0.55, "hide-sm"],
  ];

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
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function floaties() {
    var hero = document.querySelector(".hero");
    if (!hero || reduced) return;
    var box = document.createElement("div");
    box.className = "floaties";
    box.setAttribute("aria-hidden", "true");
    LAYOUT.forEach(function (f) {
      var el = document.createElement("span");
      el.className = "floaty" + (f[8] ? " " + f[8] : "");
      el.style.left = f[1] + "%";
      el.style.top = f[2] + "%";
      el.style.setProperty("--s", f[3] + "px");
      el.style.setProperty("--dur", f[4] + "s");
      el.style.setProperty("--rot", f[5] + "deg");
      el.style.setProperty("--in", f[6] + "s");
      el.style.setProperty("--op", f[7]);
      el.dataset.depth = (f[3] / 50).toFixed(2);
      if (f[9]) {
        el.classList.add("has-sm");
        el.style.setProperty("--ml", f[9][0] + "%");
        el.style.setProperty("--mt", f[9][1] + "%");
      }
      el.innerHTML = ICONS[f[0]];
      box.appendChild(el);
    });
    hero.insertBefore(box, hero.firstChild);

    // ميلان خفيف مع حركة الفأرة: الأكبر يتحرّك أكثر، فيبان العمق
    if (!finePointer) return;
    var items = box.querySelectorAll(".floaty");
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      items.forEach(function (it) {
        var k = Number(it.dataset.depth) * 26;
        var svg = it.firstChild;
        svg.style.setProperty("--px", (-dx * k).toFixed(1) + "px");
        svg.style.setProperty("--py", (-dy * k).toFixed(1) + "px");
      });
    });
    hero.addEventListener("pointerleave", function () {
      items.forEach(function (it) { it.firstChild.style.setProperty("--px", "0px"); it.firstChild.style.setProperty("--py", "0px"); });
    });
  }

  function heartbeatLine() {
    var hero = document.querySelector(".hero .wrap");
    if (!hero) return;
    // نبضة متكرّرة على عرض ١٢٠٠ — preserveAspectRatio=none مع خط ثابت السماكة
    var d = "M0,40 L150,40 L170,40 L185,28 L200,40 L215,40 L230,6 L248,72 L262,30 L275,40 L420,40 " +
            "L570,40 L590,40 L605,28 L620,40 L635,40 L650,6 L668,72 L682,30 L695,40 L840,40 " +
            "L990,40 L1010,40 L1025,28 L1040,40 L1055,40 L1070,6 L1088,72 L1102,30 L1115,40 L1200,40";
    var wrap = document.createElement("div");
    wrap.className = "ekg";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<svg viewBox="0 0 1200 80" preserveAspectRatio="none">' +
      '<path class="base" d="' + d + '"/>' +
      '<path class="beat" pathLength="1200" d="' + d + '"/></svg>' +
      '<span class="heart">' + ICONS.heart + "</span>";
    hero.appendChild(wrap);
  }

  function ripples() {
    if (reduced) return;
    document.addEventListener("pointerdown", function (e) {
      var b = e.target.closest && e.target.closest(".btn");
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
  floaties();
  heartbeatLine();
  ripples();
})();
