/**
 * Koda Backend — Full API Test Script
 * Tests every endpoint from backend.md
 * Run: node test.js
 */

const BASE = "http://localhost:5000/api";
let TOKEN = "";
let USER_ID = "";
let USER2_TOKEN = "";
let USER2_ID = "";
let SUBJECT_ID = "";
let CHAPTER_ID = "";
let SESSION_ID = "";
let DOUBT_ID = "";
let REPLY_ID = "";

const ts = String(Date.now()).slice(-6); // 6 digits → usernames well under 20 chars
const TEST_USER = {
  name: "Test User",
  username: `tst${ts}`,
  email: `test${ts}@koda.com`,
  password: "password123",
  institution: "Koda University",
  year: "2",
};
const TEST_USER2 = {
  name: "Second User",
  username: `usr2${ts}`,
  email: `user2${ts}@koda.com`,
  password: "password123",
  institution: "Koda College",
  year: "3",
};

let passed = 0;
let failed = 0;

async function req(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

async function run() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║   KODA BACKEND — FULL API TEST SUITE     ║");
  console.log("╚══════════════════════════════════════════╝\n");

  // ─── HEALTH ────────────────────────────────────────────────────────────────
  console.log("── HEALTH ──────────────────────────────────");
  {
    const { status, json } = await req("GET", "/health");
    assert("GET /health → 200", status === 200);
    assert("health.success = true", json.success === true);
  }

  // ─── AUTH ──────────────────────────────────────────────────────────────────
  console.log("\n── AUTH ─────────────────────────────────────");

  // Register
  {
    const { status, json } = await req("POST", "/auth/register", TEST_USER);
    assert("POST /auth/register → 201", status === 201, JSON.stringify(json));
    assert("register returns token", !!json?.data?.token);
    assert("register returns user._id", !!json?.data?.user?._id);
    assert("password NOT in response", !json?.data?.user?.password);
    TOKEN = json?.data?.token;
    USER_ID = json?.data?.user?._id;
  }

  // Register duplicate email
  {
    const { status, json } = await req("POST", "/auth/register", TEST_USER);
    assert("Duplicate email → 409", status === 409, json.message);
  }

  // Register validation (short username)
  {
    const { status } = await req("POST", "/auth/register", { ...TEST_USER, username: "ab", email: "x@y.com" });
    assert("Short username Zod error → 400", status === 400);
  }

  // Login
  {
    const { status, json } = await req("POST", "/auth/login", { email: TEST_USER.email, password: TEST_USER.password });
    assert("POST /auth/login → 200", status === 200, JSON.stringify(json));
    assert("login returns token", !!json?.data?.token);
    assert("login returns streak fields", json?.data?.user?.currentStreak !== undefined);
  }

  // Login wrong password
  {
    const { status } = await req("POST", "/auth/login", { email: TEST_USER.email, password: "wrongpass" });
    assert("Wrong password → 401", status === 401);
  }

  // Register second user
  {
    const { status, json } = await req("POST", "/auth/register", TEST_USER2);
    assert("Register user2 → 201", status === 201);
    USER2_TOKEN = json?.data?.token;
    USER2_ID = json?.data?.user?._id;
  }

  // ─── USERS ─────────────────────────────────────────────────────────────────
  console.log("\n── USERS ────────────────────────────────────");

  // GET /me without token → 401
  {
    const { status } = await req("GET", "/users/me");
    assert("GET /users/me without token → 401", status === 401);
  }

  // GET /me
  {
    const { status, json } = await req("GET", "/users/me", null, TOKEN);
    assert("GET /users/me → 200", status === 200, JSON.stringify(json));
    assert("/me returns username", json?.data?.username === TEST_USER.username);
    assert("/me no password field", !json?.data?.password);
  }

  // PUT /users/update
  {
    const { status, json } = await req("PUT", "/users/update", { bio: "Study hard!" }, TOKEN);
    assert("PUT /users/update → 200", status === 200);
    assert("bio updated", json?.data?.bio === "Study hard!");
  }

  // PUT update with too long bio → 400
  {
    const { status } = await req("PUT", "/users/update", { bio: "x".repeat(201) }, TOKEN);
    assert("Bio > 200 chars Zod → 400", status === 400);
  }

  // GET /users/search — no token
  {
    const { status } = await req("GET", "/users/search?query=test");
    assert("GET /users/search without token → 401", status === 401);
  }

  // GET /users/search — query too short (1 char)
  {
    const { status } = await req("GET", "/users/search?query=a", null, TOKEN);
    assert("Search query < 2 chars → 400", status === 400);
  }

  // GET /users/search — valid
  {
    const q = TEST_USER2.username.slice(0, 5);
    const { status, json } = await req("GET", `/users/search?query=${q}`, null, TOKEN);
    assert("GET /users/search → 200", status === 200, JSON.stringify(json));
    assert("search returns users array", Array.isArray(json?.users));
    assert("search excludes current user", !json?.users?.some((u) => u._id === USER_ID));
    const u = json?.users?.[0];
    assert("search only safe fields (_id,username,name,avatar,bio)", u && Object.keys(u).every(k => ["_id","username","name","avatar","bio","__v"].includes(k)));
  }

  // GET /users/:id
  {
    const { status, json } = await req("GET", `/users/${USER2_ID}`, null, TOKEN);
    assert("GET /users/:id → 200", status === 200);
    assert("getUserById no password", !json?.data?.password);
  }

  // Follow / Unfollow
  {
    const { status: s1 } = await req("POST", `/users/${USER2_ID}/follow`, null, TOKEN);
    assert("POST /users/:id/follow → 200", s1 === 200);

    const { status: s2 } = await req("POST", `/users/${USER2_ID}/follow`, null, TOKEN);
    assert("Follow again → 409 (no duplicate)", s2 === 409);

    const { status: s3 } = await req("POST", `/users/${USER2_ID}/unfollow`, null, TOKEN);
    assert("POST /users/:id/unfollow → 200", s3 === 200);
  }

  // Self-follow prevention
  {
    const { status } = await req("POST", `/users/${USER_ID}/follow`, null, TOKEN);
    assert("Cannot follow self → 400", status === 400);
  }

  // ─── SUBJECTS ──────────────────────────────────────────────────────────────
  console.log("\n── SUBJECTS ─────────────────────────────────");

  {
    const { status, json } = await req("POST", "/subjects", { title: "Mathematics", color: "#FF5733" }, TOKEN);
    assert("POST /subjects → 201", status === 201, JSON.stringify(json));
    SUBJECT_ID = json?.data?._id;
  }

  // Invalid color
  {
    const { status } = await req("POST", "/subjects", { title: "Art", color: "red" }, TOKEN);
    assert("Invalid hex color → 400", status === 400);
  }

  {
    const { status, json } = await req("GET", "/subjects", null, TOKEN);
    assert("GET /subjects → 200", status === 200);
    assert("subjects list not empty", json?.data?.length >= 1);
  }

  {
    const { status } = await req("PUT", `/subjects/${SUBJECT_ID}`, { title: "Advanced Math" }, TOKEN);
    assert("PUT /subjects/:id → 200", status === 200);
  }

  // ─── CHAPTERS ──────────────────────────────────────────────────────────────
  console.log("\n── CHAPTERS ─────────────────────────────────");

  {
    const { status, json } = await req("POST", "/chapters", { subjectId: SUBJECT_ID, title: "Chapter 1 — Algebra" }, TOKEN);
    assert("POST /chapters → 201", status === 201, JSON.stringify(json));
    CHAPTER_ID = json?.data?._id;
  }

  {
    const { status, json } = await req("GET", `/chapters/${SUBJECT_ID}`, null, TOKEN);
    assert("GET /chapters/:subjectId → 200", status === 200);
    assert("chapters list returned", Array.isArray(json?.data));
  }

  {
    const { status, json } = await req("PUT", `/chapters/${CHAPTER_ID}`, { isCompleted: true }, TOKEN);
    assert("PUT /chapters/:id (mark complete) → 200", status === 200);
    assert("chapter isCompleted = true", json?.data?.isCompleted === true);
  }

  // ─── SESSIONS ──────────────────────────────────────────────────────────────
  console.log("\n── SESSIONS ─────────────────────────────────");

  {
    const { status, json } = await req("POST", "/sessions", { subjectId: SUBJECT_ID, chapterId: CHAPTER_ID, duration: 45 }, TOKEN);
    assert("POST /sessions → 201", status === 201, JSON.stringify(json));
    SESSION_ID = json?.data?._id;
  }

  // Duration < 1 min → 400
  {
    const { status } = await req("POST", "/sessions", { subjectId: SUBJECT_ID, duration: 0 }, TOKEN);
    assert("Duration 0 → 400 Zod error", status === 400);
  }

  {
    const { status, json } = await req("GET", "/sessions", null, TOKEN);
    assert("GET /sessions → 200", status === 200);
    assert("sessions list returned", Array.isArray(json?.data));
  }

  {
    const { status, json } = await req("GET", "/sessions/analytics", null, TOKEN);
    assert("GET /sessions/analytics → 200", status === 200, JSON.stringify(json));
    assert("analytics has totalMinutes", json?.data?.totalMinutes !== undefined);
    assert("analytics has weekly array", Array.isArray(json?.data?.weekly));
    assert("analytics has bySubject array", Array.isArray(json?.data?.bySubject));
    assert("analytics has streak", json?.data?.currentStreak !== undefined);
  }

  // ─── POINTS & STREAK ───────────────────────────────────────────────────────
  console.log("\n── POINTS & STREAK ──────────────────────────");

  {
    const { json } = await req("GET", "/users/me", null, TOKEN);
    const pts = json?.data?.totalPoints;
    // +5 session + +10 chapter_complete = 15 minimum
    assert(`totalPoints >= 15 after session+chapter (got ${pts})`, pts >= 15);
    assert("streak updated (currentStreak >= 1)", json?.data?.currentStreak >= 1);
    assert("level set (not undefined)", !!json?.data?.level);
  }

  // ─── DOUBTS & REPLIES ──────────────────────────────────────────────────────
  console.log("\n── DOUBTS & REPLIES ─────────────────────────");

  {
    const { status, json } = await req(
      "POST", "/doubts",
      { subjectId: SUBJECT_ID, title: "Why does x+1=2?", description: "I cannot understand this basic equation at all." },
      TOKEN
    );
    assert("POST /doubts → 201", status === 201, JSON.stringify(json));
    DOUBT_ID = json?.data?._id;
  }

  // Short description → 400
  {
    const { status } = await req("POST", "/doubts", { subjectId: SUBJECT_ID, title: "Short", description: "too short" }, TOKEN);
    assert("Short description < 10 chars → 400", status === 400);
  }

  {
    const { status, json } = await req("GET", "/doubts", null, TOKEN);
    assert("GET /doubts → 200", status === 200);
    assert("doubts list returned", Array.isArray(json?.data));
  }

  // Reply from user2
  {
    const { status, json } = await req("POST", "/doubts/replies", { doubtId: DOUBT_ID, text: "Because x = 1, substitute it." }, USER2_TOKEN);
    assert("POST /doubts/replies → 201", status === 201, JSON.stringify(json));
    REPLY_ID = json?.data?._id;
  }

  // Upvote reply
  {
    const { status, json } = await req("PUT", `/doubts/replies/${REPLY_ID}/upvote`, null, TOKEN);
    assert("PUT /replies/:id/upvote → 200", status === 200, JSON.stringify(json));
    assert("upvote count = 1", json?.data?.upvotes === 1);
  }

  // Toggle upvote (remove)
  {
    const { status, json } = await req("PUT", `/doubts/replies/${REPLY_ID}/upvote`, null, TOKEN);
    assert("Toggle upvote off → 200, count = 0", status === 200 && json?.data?.upvotes === 0);
  }

  // Accept reply
  {
    const { status } = await req("PUT", `/doubts/replies/${REPLY_ID}/accept`, null, TOKEN);
    assert("PUT /replies/:id/accept → 200", status === 200);
  }

  // Non-owner cannot accept
  {
    const { status } = await req("PUT", `/doubts/replies/${REPLY_ID}/accept`, null, USER2_TOKEN);
    assert("Non-owner accept reply → 403", status === 403);
  }

  // ─── LEADERBOARD ───────────────────────────────────────────────────────────
  console.log("\n── LEADERBOARD ──────────────────────────────");

  {
    const { status, json } = await req("GET", "/leaderboard", null, TOKEN);
    assert("GET /leaderboard → 200", status === 200, JSON.stringify(json));
    assert("leaderboard sorted by points (first >= last)", () => {
      const d = json?.data;
      return d?.length < 2 || d[0].totalPoints >= d[d.length - 1].totalPoints;
    });
  }

  {
    const { status, json } = await req("GET", "/leaderboard/weekly", null, TOKEN);
    assert("GET /leaderboard/weekly → 200", status === 200, JSON.stringify(json));
    assert("weekly leaderboard is array", Array.isArray(json?.data));
  }

  // ─── SECURITY CHECKS ───────────────────────────────────────────────────────
  console.log("\n── SECURITY CHECKS ──────────────────────────");
  {
    const { status } = await req("GET", "/subjects");
    assert("Protected route without token → 401", status === 401);
  }
  {
    const { status } = await req("GET", "/users/me", null, "bad.token.here");
    assert("Invalid JWT → 401", status === 401);
  }
  {
    const { status } = await req("GET", "/nonexistent");
    assert("Unknown route → 404", status === 404);
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log("\n╔══════════════════════════════════════════╗");
  console.log(`║  RESULTS: ${passed}/${total} passed  ${failed > 0 ? "❌ " + failed + " failed" : "🎉 All passed!"}${" ".repeat(Math.max(0, 12 - String(passed + "/" + total).length - (failed > 0 ? String(failed).length + 8 : 12)))}║`);
  console.log("╚══════════════════════════════════════════╝\n");

  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
