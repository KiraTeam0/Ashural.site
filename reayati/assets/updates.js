/*
 * رعايتي — «آخر التحديثات».
 *
 * يقرأ posts.json، وهو ملف يكتبه GitHub Actions تلقائياً كل نصف ساعة من
 * Instagram Graph API (انظر .github/workflows/instagram.yml). ما اكو توكن
 * هنا ولا شي يُحدَّث يدوياً: المنشور الجديد يطلع بالصفحة خلال نصف ساعة.
 *
 * إذا الملف فاضي أو ما انجلب — يُعرض رابط الحساب بهدوء بدل خطأ للزائر.
 */

const SOURCE = "posts.json";
const INSTAGRAM = "https://www.instagram.com/reayati.iq/";

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function note(box, text) {
  box.innerHTML = "";
  const w = el("div", "feed-note");
  w.appendChild(el("p", null, text));
  const a = el("a", "btn btn-ghost", "إنستغرام ‎@reayati.iq");
  a.href = INSTAGRAM;
  a.target = "_blank";
  a.rel = "noopener";
  w.appendChild(a);
  box.appendChild(w);
}

function arabicDate(iso) {
  try {
    return new Intl.DateTimeFormat("ar-IQ-u-nu-latn", { dateStyle: "long", timeZone: "Asia/Baghdad" })
      .format(new Date(iso));
  } catch {
    return "";
  }
}

function card(p, i) {
  const a = el("a", "post-card");
  a.href = p.url;
  a.target = "_blank";
  a.rel = "noopener";
  a.setAttribute("data-reveal", "");
  a.style.setProperty("--d", i * 90 + "ms");

  if (p.image) {
    const img = el("img", "post-img");
    img.src = p.image;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    a.appendChild(img);
    if (p.isVideo) a.appendChild(el("span", "post-play", "▶"));
  }

  const body = el("div", "post-body");
  if (p.at) body.appendChild(el("time", "post-date", arabicDate(p.at)));
  if (p.caption) body.appendChild(el("p", "post-caption", p.caption));
  body.appendChild(el("span", "post-more", "عرض المنشور ←"));
  a.appendChild(body);
  return a;
}

document.addEventListener("DOMContentLoaded", async () => {
  const box = document.getElementById("updates-feed");
  if (!box) return;
  note(box, "جاري تحميل آخر المنشورات…");

  let data = null;
  try {
    const r = await fetch(SOURCE, { headers: { accept: "application/json" }, cache: "no-cache" });
    if (r.ok) data = await r.json();
  } catch {
    /* ما وصل الملف — نكمّل للبديل. */
  }

  const posts = data && Array.isArray(data.posts) ? data.posts : [];
  if (!posts.length) {
    note(box, "تابع آخر أخبار رعايتي أولاً بأول على حساباتنا الرسمية.");
    return;
  }

  box.innerHTML = "";
  posts.forEach((p, i) => box.appendChild(card(p, i)));

  // البطاقات انضافت بعد تشغيل مراقب الظهور، فنشغّلها هنا.
  if (!("IntersectionObserver" in window)) {
    box.querySelectorAll("[data-reveal]").forEach((n) => n.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }),
    { threshold: 0.1 },
  );
  box.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
});
