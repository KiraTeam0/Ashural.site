/*
 * رعايتي — حركات الصفحة ورابط الاستمارة.
 *
 * كل شي هنا تحسيني: لو انطفأ الجافاسكربت أو اختار الزائر «تقليل الحركة»،
 * الصفحة تبقى كاملة ومقروءة — العناصر تظهر بمكانها بدون أي حركة.
 */

/* ===== رابط استمارة التسجيل — مكان واحد يتغيّر منه كل أزرار «سجّل». ===== */
const FORM_URL = "https://forms.gle/1p4sUfF9d8Pf1s6Y8";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------ الاستمارة */
function wireFormLinks() {
  document.querySelectorAll("[data-form-link]").forEach((b) => {
    if (FORM_URL) {
      b.href = FORM_URL;
      b.target = "_blank";
      b.rel = "noopener";
      return;
    }
    b.removeAttribute("href");
    b.setAttribute("aria-disabled", "true");
  });
}

/* --------------------------------------------- الظهور التدريجي عند التمرير */
function wireReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  // تأخير متدرّج داخل كل مجموعة، فالبطاقات تطلع وحدة ورا الثانية.
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    [...group.querySelectorAll("[data-reveal]")].forEach((n, i) => {
      n.style.setProperty("--d", i * 90 + "ms");
    });
  });
  items.forEach((n) => io.observe(n));
}

/* ------------------------------------------------------- الرأس عند التمرير */
function wireTopbar() {
  const bar = document.querySelector(".topbar");
  if (!bar) return;
  const onScroll = () => bar.classList.toggle("stuck", window.scrollY > 12);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
}

/* ------------------------------------- الخلفية الملوّنة تتحرّك مع التمرير */
function wireAurora() {
  const blobs = document.querySelectorAll(".aurora span");
  if (!blobs.length || reduced) return;
  let ticking = false;
  const speeds = [0.06, -0.04, 0.03];
  const apply = () => {
    const y = window.scrollY;
    blobs.forEach((b, i) => {
      b.style.transform = "translate3d(0," + (y * (speeds[i] ?? 0.04)).toFixed(1) + "px,0)";
    });
    ticking = false;
  };
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    },
    { passive: true },
  );
  apply();
}

/* --------------------------------------- خط الخطوات ينرسم مع نزول الزائر */
function wireSteps() {
  const box = document.querySelector(".steps");
  if (!box) return;
  const line = box.querySelector(".line");
  const steps = [...box.querySelectorAll(".step")];
  if (!line) return;
  if (reduced) {
    line.style.height = "100%";
    steps.forEach((s) => s.classList.add("in"));
    return;
  }
  const draw = () => {
    const r = box.getBoundingClientRect();
    const h = innerHeight * 0.62;
    const done = Math.min(Math.max(h - r.top, 0), r.height);
    line.style.height = done + "px";
    steps.forEach((s) => {
      const sr = s.getBoundingClientRect();
      s.classList.toggle("in", sr.top < h);
    });
  };
  let ticking = false;
  addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        draw();
        ticking = false;
      });
    },
    { passive: true },
  );
  addEventListener("resize", draw, { passive: true });
  draw();
}

/* --------------------------------- ميلان خفيف للبطاقة تحت مؤشّر الفأرة */
function wireTilt() {
  if (reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  document.querySelectorAll("[data-tilt]").forEach((c) => {
    const reset = () => (c.style.transform = "");
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform =
        "perspective(900px) translateY(-5px) rotateX(" + (-dy * 5).toFixed(2) +
        "deg) rotateY(" + (dx * 5).toFixed(2) + "deg)";
    });
    c.addEventListener("pointerleave", reset);
    c.addEventListener("blur", reset, true);
  });
}

/* ----------------------------------------------- تمرير ناعم لروابط الصفحة */
function wireAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", id);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireFormLinks();
  wireReveal();
  wireTopbar();
  wireAurora();
  wireSteps();
  wireTilt();
  wireAnchors();
});
