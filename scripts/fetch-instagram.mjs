/**
 * رعايتي — يجلب آخر منشورات إنستغرام ويكتبها بـ reayati/posts.json.
 *
 * يشتغل داخل GitHub Actions فقط (انظر .github/workflows/instagram.yml).
 * السرّان يجيان من GitHub Secrets ولا ينكتبان بأي ملف:
 *   IG_USER_ID       معرّف حساب إنستغرام للأعمال (رقم)
 *   IG_ACCESS_TOKEN  توكن طويل الأمد
 *
 * لا يفشل البناء عند خطأ: يترك الملف القديم مكانه حتى تبقى الصفحة شغّالة.
 */
import { writeFile, readFile } from "node:fs/promises";

const OUT = new URL("../reayati/posts.json", import.meta.url);
// «Instagram API with Instagram Login»: المضيف graph.instagram.com والتوكن يصدر
// من لوحة Meta مباشرة بلا صفحة فيسبوك. من يستعمل مسار «Facebook Login»
// يضبط IG_GRAPH_BASE=https://graph.facebook.com/v26.0 بمتغيّرات المستودع.
const GRAPH = (process.env.IG_GRAPH_BASE || "https://graph.instagram.com/v26.0").trim().replace(/\/+$/, "");
const FIELDS = "id,permalink,caption,media_type,media_url,thumbnail_url,timestamp";
const LIMIT = 6;

const userId = (process.env.IG_USER_ID || "").trim();
const token = (process.env.IG_ACCESS_TOKEN || "").trim();

function bail(reason) {
  console.log("skipped:", reason, "— the existing posts.json is left as it is.");
  process.exit(0);
}

if (!userId || !token) bail("IG_USER_ID or IG_ACCESS_TOKEN is not set");

const url =
  `${GRAPH}/${encodeURIComponent(userId)}/media` +
  `?fields=${encodeURIComponent(FIELDS)}&limit=${LIMIT}` +
  `&access_token=${encodeURIComponent(token)}`;

let res;
try {
  res = await fetch(url, { signal: AbortSignal.timeout(15000) });
} catch (e) {
  bail("network: " + e.message);
}

if (!res.ok) {
  // لا نطبع نص الرد: ممكن يحمل تفاصيل التوكن.
  bail("graph returned " + res.status);
}

const data = await res.json().catch(() => null);
if (!data || !Array.isArray(data.data)) bail("unexpected response shape");

const posts = data.data
  .filter((m) => m && m.permalink)
  .map((m) => ({
    id: String(m.id || ""),
    url: String(m.permalink),
    caption: String(m.caption || "").replace(/\s+/g, " ").trim().slice(0, 300),
    image: String(m.media_type === "VIDEO" ? m.thumbnail_url || "" : m.media_url || ""),
    isVideo: m.media_type === "VIDEO",
    at: String(m.timestamp || ""),
  }))
  .slice(0, LIMIT);

if (!posts.length) bail("no posts returned");

const next = JSON.stringify({ updatedAt: new Date().toISOString(), posts }, null, 2) + "\n";

// لا نكتب إذا المنشورات نفسها: كتابة بلا تغيير = كومت فاضي كل نصف ساعة.
const prev = await readFile(OUT, "utf8").catch(() => "");
const same =
  prev &&
  JSON.stringify(JSON.parse(prev).posts ?? null) === JSON.stringify(posts);
if (same) {
  console.log("unchanged: same", posts.length, "posts.");
  process.exit(0);
}

await writeFile(OUT, next, "utf8");
console.log("wrote", posts.length, "posts.");
