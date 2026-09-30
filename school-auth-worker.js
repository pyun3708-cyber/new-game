/**
 * 反媚黑高校 · school-auth Worker（完整可替换）
 * 绑定：D1 变量名必须为 DB
 * Secret：JWT_SECRET（必填）
 *
 * 部署：复制本文件全部内容到 Cloudflare Worker 编辑器 → Save and Deploy
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ADMIN_NAMES = ["草莓酱", "strawberry", "admin"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function b64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlStr(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hashPassword(password, saltB64) {
  const salt = fromB64url(saltB64);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256
  );
  return b64url(bits);
}

function randomSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return b64url(a);
}

function uid() {
  return crypto.randomUUID().replace(/-/g, "");
}

function nowISO() {
  return new Date().toISOString();
}

function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const yearStart = new Date(Date.UTC(y, 0, 1));
  const w = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return y + "-W" + String(w).padStart(2, "0");
}

async function signJwt(payload, secret) {
  const header = b64urlStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64urlStr(JSON.stringify(payload));
  const data = header + "." + body;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return data + "." + b64url(sig);
}

async function verifyJwt(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const data = header + "." + body;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    fromB64url(sig),
    new TextEncoder().encode(data)
  );
  if (!ok) return null;
  try {
    const jsonStr = new TextDecoder().decode(fromB64url(body));
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

async function requireUser(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload || !payload.sub) return null;
  return payload;
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    display_name: row.display_name || row.username,
    role: row.role || "student",
    gender: row.gender || "",
    bio: row.bio || "",
    birthday: row.birthday || "",
    avatar: row.avatar || "",
    bg_image: row.bg_image || "",
    teacher_cert_no: row.teacher_cert_no || "",
    created_at: row.created_at || "",
  };
}

function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const n = (user.username || "").trim();
  const d = (user.display_name || "").trim();
  return ADMIN_NAMES.includes(n) || ADMIN_NAMES.includes(d);
}

async function ensureTables(env) {
  // 尽量兼容已有表；新表用 IF NOT EXISTS
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      salt TEXT,
      display_name TEXT,
      role TEXT DEFAULT 'student',
      gender TEXT,
      bio TEXT,
      birthday TEXT,
      avatar TEXT,
      bg_image TEXT,
      teacher_cert_no TEXT,
      created_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS wall_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      content TEXT,
      anonymous INTEGER DEFAULT 0,
      created_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS wall_likes (
      message_id TEXT,
      user_id TEXT,
      PRIMARY KEY (message_id, user_id)
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS teacher_cert_seq (
      year TEXT PRIMARY KEY,
      seq INTEGER NOT NULL DEFAULT 0
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS teacher_certificates (
      cert_no TEXT PRIMARY KEY,
      user_id TEXT,
      holder_name TEXT,
      gender TEXT,
      course TEXT,
      exam_note TEXT,
      created_at TEXT
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS teacher_public (
      cert_no TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT,
      display_name TEXT,
      course TEXT,
      cert_image TEXT,
      public_display INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS teacher_cert_comments (
      id TEXT PRIMARY KEY,
      cert_no TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS teacher_cert_drawings (
      cert_no TEXT PRIMARY KEY,
      image TEXT,
      week_key TEXT,
      updated_at TEXT NOT NULL
    )`),
  ]);
}

async function nextTeacherId(env) {
  const year = String(new Date().getFullYear());
  await env.DB.prepare(
    "INSERT INTO teacher_cert_seq (year, seq) VALUES (?, 0) ON CONFLICT(year) DO NOTHING"
  )
    .bind(year)
    .run();
  await env.DB.prepare("UPDATE teacher_cert_seq SET seq = seq + 1 WHERE year = ?")
    .bind(year)
    .run();
  const row = await env.DB.prepare("SELECT seq FROM teacher_cert_seq WHERE year = ?")
    .bind(year)
    .first();
  const seq = row ? row.seq : 1;
  return year + String(seq).padStart(5, "0");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    if (!env.DB) return json({ error: "DB not bound" }, 500);
    if (!env.JWT_SECRET) return json({ error: "JWT_SECRET missing" }, 500);

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      await ensureTables(env);

      // ========== 注册 ==========
      if (path === "/auth/register" && request.method === "POST") {
        const body = await request.json();
        const username = String(body.username || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        if (!username || username.length < 2 || username.length > 20)
          return json({ error: "用户名长度 2–20" }, 400);
        if (!email || !email.includes("@")) return json({ error: "邮箱无效" }, 400);
        if (!password || password.length < 6) return json({ error: "密码至少 6 位" }, 400);

        const exists = await env.DB.prepare(
          "SELECT id FROM users WHERE username = ? OR email = ?"
        )
          .bind(username, email)
          .first();
        if (exists) return json({ error: "用户名或邮箱已存在" }, 409);

        const id = uid();
        const salt = randomSalt();
        const password_hash = await hashPassword(password, salt);
        const created_at = nowISO();
        await env.DB.prepare(
          `INSERT INTO users (id, username, email, password_hash, salt, display_name, role, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'student', ?)`
        )
          .bind(id, username, email, password_hash, salt, username, created_at)
          .run();

        const token = await signJwt(
          { sub: id, username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
          env.JWT_SECRET
        );
        const user = publicUser({
          id,
          username,
          email,
          display_name: username,
          role: "student",
          created_at,
        });
        return json({ ok: true, token, user });
      }

      // ========== 登录 ==========
      if (path === "/auth/login" && request.method === "POST") {
        const body = await request.json();
        const account = String(body.username || body.email || body.account || "").trim();
        const password = String(body.password || "");
        if (!account || !password) return json({ error: "请输入账号和密码" }, 400);

        const row = await env.DB.prepare(
          "SELECT * FROM users WHERE username = ? OR email = ?"
        )
          .bind(account, account.toLowerCase())
          .first();
        if (!row) return json({ error: "账号或密码错误" }, 401);
        const hash = await hashPassword(password, row.salt);
        if (hash !== row.password_hash) return json({ error: "账号或密码错误" }, 401);

        const token = await signJwt(
          {
            sub: row.id,
            username: row.username,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
          },
          env.JWT_SECRET
        );
        return json({ ok: true, token, user: publicUser(row) });
      }

      // ========== 当前用户 ==========
      if (path === "/auth/me" && request.method === "GET") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        if (!row) return json({ error: "用户不存在" }, 404);
        return json({ user: publicUser(row) });
      }

      // ========== 个人主页 ==========
      if (path === "/profile/me" && request.method === "GET") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        if (!row) return json({ error: "用户不存在" }, 404);
        return json({ profile: publicUser(row) });
      }

      if (path.startsWith("/profile/") && request.method === "GET") {
        const id = decodeURIComponent(path.slice("/profile/".length));
        if (!id || id === "update") return json({ error: "无效 id" }, 400);
        const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(id)
          .first();
        if (!row) return json({ error: "用户不存在" }, 404);
        return json({ profile: publicUser(row) });
      }

      if (path === "/profile/update" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const display_name = String(body.display_name ?? "").trim().slice(0, 20);
        const gender = String(body.gender ?? "").slice(0, 20);
        const bio = String(body.bio ?? "").slice(0, 500);
        const birthday = String(body.birthday ?? "").slice(0, 20);
        const avatar = String(body.avatar ?? "");
        const bg_image = String(body.bg_image ?? "");

        await env.DB.prepare(
          `UPDATE users SET display_name = COALESCE(?, display_name),
           gender = COALESCE(?, gender), bio = COALESCE(?, bio),
           birthday = COALESCE(?, birthday),
           avatar = CASE WHEN ? != '' THEN ? ELSE avatar END,
           bg_image = CASE WHEN ? != '' THEN ? ELSE bg_image END
           WHERE id = ?`
        )
          .bind(
            display_name || null,
            gender || null,
            bio || null,
            birthday || null,
            avatar,
            avatar,
            bg_image,
            bg_image,
            payload.sub
          )
          .run();

        const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        return json({ ok: true, profile: publicUser(row) });
      }

      // ========== 留言墙 ==========
      if (path === "/wall/messages" && request.method === "GET") {
        const rows = await env.DB.prepare(
          `SELECT m.*, (SELECT COUNT(*) FROM wall_likes l WHERE l.message_id = m.id) AS likes
           FROM wall_messages m ORDER BY m.created_at DESC LIMIT 100`
        ).all();
        return json({ items: rows.results || [] });
      }

      if (path === "/wall/messages" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const content = String(body.content || "").trim().slice(0, 500);
        if (!content) return json({ error: "内容不能为空" }, 400);
        const anonymous = body.anonymous ? 1 : 0;
        const user = await env.DB.prepare("SELECT username FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        const id = uid();
        await env.DB.prepare(
          `INSERT INTO wall_messages (id, user_id, username, content, anonymous, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            payload.sub,
            anonymous ? "匿名" : user?.username || "用户",
            content,
            anonymous,
            nowISO()
          )
          .run();
        return json({ ok: true, id });
      }

      if (path === "/wall/like" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const messageId = String(body.messageId || "");
        const exists = await env.DB.prepare(
          "SELECT 1 FROM wall_likes WHERE message_id = ? AND user_id = ?"
        )
          .bind(messageId, payload.sub)
          .first();
        if (exists) {
          await env.DB.prepare(
            "DELETE FROM wall_likes WHERE message_id = ? AND user_id = ?"
          )
            .bind(messageId, payload.sub)
            .run();
        } else {
          await env.DB.prepare(
            "INSERT INTO wall_likes (message_id, user_id) VALUES (?, ?)"
          )
            .bind(messageId, payload.sub)
            .run();
        }
        return json({ ok: true });
      }

      if (path === "/wall/delete" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const messageId = String(body.messageId || "");
        const msg = await env.DB.prepare(
          "SELECT user_id FROM wall_messages WHERE id = ?"
        )
          .bind(messageId)
          .first();
        if (!msg) return json({ error: "留言不存在" }, 404);
        const meRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        if (msg.user_id !== payload.sub && !isAdminUser(meRow)) {
          return json({ error: "只能删除自己的留言" }, 403);
        }
        await env.DB.batch([
          env.DB.prepare("DELETE FROM wall_likes WHERE message_id = ?").bind(messageId),
          env.DB.prepare("DELETE FROM wall_messages WHERE id = ?").bind(messageId),
        ]);
        return json({ ok: true });
      }

      // ========== 教师资格证发号 ==========
      if (path === "/teacher/cert/issue" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const course = String(body.course || "").trim().slice(0, 40);
        const public_display = body.public_display ? 1 : 0;
        const cert_image = String(body.cert_image || body.photo || "").slice(0, 900000);
        const name = String(body.name || "").slice(0, 40);
        const gender = String(body.gender || "").slice(0, 20);

        const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        if (!user) return json({ error: "用户不存在" }, 404);

        let teacherId = user.teacher_cert_no;
        if (!teacherId) {
          teacherId = await nextTeacherId(env);
          await env.DB.prepare(
            "UPDATE users SET teacher_cert_no = ?, role = CASE WHEN role = 'admin' THEN role ELSE 'teacher' END WHERE id = ?"
          )
            .bind(teacherId, payload.sub)
            .run();
          await env.DB.prepare(
            `INSERT OR REPLACE INTO teacher_certificates (cert_no, user_id, holder_name, gender, course, exam_note, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              teacherId,
              payload.sub,
              name || user.display_name || user.username,
              gender || user.gender || "",
              course,
              JSON.stringify(body.scores || {}),
              nowISO()
            )
            .run();
        }

        const ts = nowISO();
        await env.DB.prepare(
          `INSERT INTO teacher_public (cert_no, user_id, username, display_name, course, cert_image, public_display, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(cert_no) DO UPDATE SET
             course = excluded.course,
             cert_image = CASE WHEN excluded.cert_image != '' THEN excluded.cert_image ELSE teacher_public.cert_image END,
             public_display = excluded.public_display,
             updated_at = excluded.updated_at`
        )
          .bind(
            teacherId,
            payload.sub,
            user.username,
            user.display_name || user.username,
            course,
            cert_image,
            public_display,
            ts,
            ts
          )
          .run();

        return json({ ok: true, teacher_id: teacherId });
      }

      // ========== 老师介绍：公开列表 ==========
      if (path === "/teachers/public" && request.method === "GET") {
        const certNo = url.searchParams.get("cert_no");
        let rows;
        if (certNo) {
          rows = await env.DB.prepare(
            `SELECT p.*, d.image AS drawing, d.week_key AS draw_week
             FROM teacher_public p
             LEFT JOIN teacher_cert_drawings d ON d.cert_no = p.cert_no
             WHERE p.cert_no = ? AND p.public_display = 1`
          )
            .bind(certNo)
            .all();
        } else {
          rows = await env.DB.prepare(
            `SELECT p.*, d.image AS drawing, d.week_key AS draw_week
             FROM teacher_public p
             LEFT JOIN teacher_cert_drawings d ON d.cert_no = p.cert_no
             WHERE p.public_display = 1
             ORDER BY p.cert_no ASC`
          ).all();
        }
        const wk = weekKey();
        const items = (rows.results || []).map((r) => ({
          cert_no: r.cert_no,
          user_id: r.user_id,
          username: r.username,
          display_name: r.display_name,
          course: r.course,
          cert_image: r.cert_image || "",
          created_at: r.created_at,
          drawing: r.draw_week === wk ? r.drawing || "" : "",
        }));
        return json({ items });
      }

      // ========== 评论 ==========
      if (path === "/teachers/comments" && request.method === "GET") {
        const certNo = url.searchParams.get("cert_no");
        if (!certNo) return json({ error: "缺少 cert_no" }, 400);
        const rows = await env.DB.prepare(
          `SELECT id, cert_no, user_id, username, content, created_at
           FROM teacher_cert_comments WHERE cert_no = ?
           ORDER BY created_at DESC LIMIT 100`
        )
          .bind(certNo)
          .all();
        return json({ items: rows.results || [] });
      }

      if (path === "/teachers/comment" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const cert_no = String(body.cert_no || "");
        const content = String(body.content || "").trim().slice(0, 200);
        if (!cert_no || !content) return json({ error: "参数不完整" }, 400);
        const pub = await env.DB.prepare(
          "SELECT cert_no FROM teacher_public WHERE cert_no = ? AND public_display = 1"
        )
          .bind(cert_no)
          .first();
        if (!pub) return json({ error: "资格证不存在或未公开" }, 404);
        const user = await env.DB.prepare("SELECT username, display_name FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        const id = uid();
        await env.DB.prepare(
          `INSERT INTO teacher_cert_comments (id, cert_no, user_id, username, content, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
          .bind(
            id,
            cert_no,
            payload.sub,
            user?.display_name || user?.username || "用户",
            content,
            nowISO()
          )
          .run();
        return json({ ok: true, id });
      }

      // ========== 涂鸦 ==========
      if (path === "/teachers/draw" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const cert_no = String(body.cert_no || "");
        const image = String(body.image || "");
        if (!cert_no || !image) return json({ error: "参数不完整" }, 400);
        if (image.length > 900000) return json({ error: "涂鸦过大" }, 400);
        const wk = weekKey();
        await env.DB.prepare(
          `INSERT INTO teacher_cert_drawings (cert_no, image, week_key, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(cert_no) DO UPDATE SET image = excluded.image, week_key = excluded.week_key, updated_at = excluded.updated_at`
        )
          .bind(cert_no, image, wk, nowISO())
          .run();
        return json({ ok: true });
      }

      // ========== 切换是否公开展示 ==========
      if (path === "/teachers/toggle-public" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const body = await request.json();
        const public_display = body.public_display ? 1 : 0;
        const user = await env.DB.prepare("SELECT teacher_cert_no FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        if (!user?.teacher_cert_no) return json({ error: "你还没有教师资格编号" }, 400);
        await env.DB.prepare(
          `UPDATE teacher_public SET public_display = ?, updated_at = ? WHERE cert_no = ? AND user_id = ?`
        )
          .bind(public_display, nowISO(), user.teacher_cert_no, payload.sub)
          .run();
        return json({ ok: true, public_display: !!public_display });
      }

      // ========== 管理员下架 ==========
      if (path === "/teachers/unpublish" && request.method === "POST") {
        const payload = await requireUser(request, env);
        if (!payload) return json({ error: "请先登录" }, 401);
        const meRow = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
          .bind(payload.sub)
          .first();
        if (!isAdminUser(meRow)) return json({ error: "无权限" }, 403);
        const body = await request.json();
        const cert_no = String(body.cert_no || "");
        await env.DB.prepare(
          "UPDATE teacher_public SET public_display = 0, updated_at = ? WHERE cert_no = ?"
        )
          .bind(nowISO(), cert_no)
          .run();
        return json({ ok: true });
      }

      // ========== 弹幕池：最近评论 ==========
      if (path === "/teachers/danmaku" && request.method === "GET") {
        const rows = await env.DB.prepare(
          `SELECT content, username, cert_no, created_at FROM teacher_cert_comments
           ORDER BY created_at DESC LIMIT 80`
        ).all();
        return json({ items: rows.results || [] });
      }

      return json({ error: "Not found", path }, 404);
    } catch (e) {
      return json({ error: e.message || "服务器错误" }, 500);
    }
  },
};
