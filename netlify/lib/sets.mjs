// 세트(slug별 앱 목록) 도메인 로직.
// 저장소는 인자로 주입받는다 — Netlify Blobs Store와 같은 모양(getWithMetadata, setJSON)이면 된다.
// HTTP를 모르는 순수 로직이라 로컬에서 가짜 저장소로 검증할 수 있다.

import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

export const LIMITS = { minApps: 1, maxApps: 12, nameMax: 40, urlMax: 2048 };
export const LOCK = { maxFails: 5, lockMs: 10 * 60 * 1000 };

// 3~32자, 소문자·숫자·하이픈, 하이픈으로 시작/끝나지 않음
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
const PIN_RE = /^\d{6,12}$/;

// 정적 파일·기능 경로와 겹치거나 오해를 부를 수 있는 주소는 발급하지 않는다.
export const RESERVED = new Set([
  "api", "admin", "launcher", "index", "archive", "apply", "about", "privacy",
  "terms", "help", "support", "www", "static", "assets", "public", "new", "edit",
  "login", "signup", "settings", "workset", "netlify", "404"
]);

const MAX_WRITE_RETRIES = 3;

export class SetError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra || {};
  }
}

/* ---------- 검증 ---------- */

export function isValidSlug(slug) {
  return typeof slug === "string" && SLUG_RE.test(slug);
}

export function checkNewSlug(slug) {
  if (!isValidSlug(slug)) {
    throw new SetError(400, "주소는 소문자·숫자·하이픈 3~32자로, 하이픈으로 시작하거나 끝날 수 없어요.");
  }
  if (RESERVED.has(slug)) throw new SetError(400, "이 주소는 쓸 수 없어요.");
}

export function checkPinFormat(pin) {
  if (typeof pin !== "string" || !PIN_RE.test(pin)) {
    throw new SetError(400, "PIN은 숫자 6~12자리여야 해요.");
  }
}

// 저장된 URL은 그대로 <a href>가 된다 — http/https 외 스킴(javascript: 등)은 받지 않는다.
export function validateApps(input) {
  if (!Array.isArray(input)) throw new SetError(400, "앱 목록 형식이 올바르지 않아요.");
  if (input.length < LIMITS.minApps) throw new SetError(400, "앱을 1개 이상 넣어주세요.");
  if (input.length > LIMITS.maxApps) throw new SetError(400, `앱은 최대 ${LIMITS.maxApps}개까지 넣을 수 있어요.`);

  return input.map(function (item, i) {
    const n = i + 1;
    const name = typeof item?.name === "string" ? item.name.trim() : "";
    const raw = typeof item?.url === "string" ? item.url.trim() : "";
    if (!name) throw new SetError(400, `${n}번째 앱의 이름이 비어 있어요.`);
    if (name.length > LIMITS.nameMax) throw new SetError(400, `${n}번째 앱 이름은 ${LIMITS.nameMax}자 이하여야 해요.`);
    if (!raw || raw.length > LIMITS.urlMax) throw new SetError(400, `${n}번째 앱의 주소가 올바르지 않아요.`);

    let url;
    try { url = new URL(raw); } catch (err) {
      throw new SetError(400, `${n}번째 앱의 주소가 올바르지 않아요.`);
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new SetError(400, `${n}번째 앱의 주소는 http:// 또는 https://로 시작해야 해요.`);
    }
    return { name, url: url.href };
  });
}

/* ---------- PIN ---------- */

export function hashPin(pin) {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 32);
  return { alg: "scrypt", salt: salt.toString("hex"), hash: hash.toString("hex") };
}

export function verifyPin(pin, stored) {
  if (typeof pin !== "string" || !stored || stored.alg !== "scrypt") return false;
  const expected = Buffer.from(stored.hash, "hex");
  const actual = scryptSync(pin, Buffer.from(stored.salt, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// 길이가 달라도 비교 시간이 새지 않도록 해시끼리 비교한다.
export function safeEqualString(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/* ---------- 저장소 접근 ---------- */

async function load(store, slug) {
  const res = await store.getWithMetadata(slug, { type: "json" });
  if (!res || !res.data) return null;
  return { rec: res.data, etag: res.etag };
}

// 읽고-고치고-조건부로 쓰기. 그 사이 다른 쓰기가 끼면 처음부터 다시 한다 (Blobs는 last-write-wins).
// mutate는 { next, result } 를 돌려준다. next가 null이면 쓰지 않는다.
async function update(store, slug, mutate) {
  for (let attempt = 0; attempt < MAX_WRITE_RETRIES; attempt++) {
    const cur = await load(store, slug);
    if (!cur) throw new SetError(404, "이 주소로 발급된 세트가 없어요.");
    const { next, result } = mutate(cur.rec);
    if (!next) return result;
    const write = await store.setJSON(slug, next, { onlyIfMatch: cur.etag });
    if (write && write.modified === false) continue; // 경합 — 다시 읽는다
    return result;
  }
  throw new SetError(409, "동시에 다른 변경이 있었어요. 다시 시도해주세요.");
}

// PIN 확인과 실패 횟수·잠금 상태 갱신을 한 번에 계산한다. 결과는 { next, ok, error }.
function authorize(rec, pin, now) {
  if (rec.lockedUntil && rec.lockedUntil > now) {
    const retryAfterSec = Math.ceil((rec.lockedUntil - now) / 1000);
    return { next: null, ok: false, error: new SetError(423, "PIN을 여러 번 틀려 잠시 잠겼어요.", { retryAfterSec }) };
  }

  if (verifyPin(pin, rec.pin)) {
    const dirty = rec.fails || rec.lockedUntil;
    return { next: dirty ? { ...rec, fails: 0, lockedUntil: 0 } : null, ok: true };
  }

  const fails = (rec.fails || 0) + 1;
  if (fails >= LOCK.maxFails) {
    const lockedUntil = now + LOCK.lockMs;
    return {
      next: { ...rec, fails: 0, lockedUntil },
      ok: false,
      error: new SetError(423, "PIN을 여러 번 틀려 잠시 잠겼어요.", { retryAfterSec: Math.ceil(LOCK.lockMs / 1000) })
    };
  }
  return {
    next: { ...rec, fails, lockedUntil: 0 },
    ok: false,
    error: new SetError(401, "PIN이 맞지 않아요.", { remaining: LOCK.maxFails - fails })
  };
}

/* ---------- 유스케이스 ---------- */

export async function getPublicSet(store, slug) {
  if (!isValidSlug(slug)) throw new SetError(404, "이 주소로 발급된 세트가 없어요.");
  const cur = await load(store, slug);
  if (!cur) throw new SetError(404, "이 주소로 발급된 세트가 없어요.");
  return { slug, apps: cur.rec.apps }; // PIN·잠금 정보는 절대 내보내지 않는다
}

export async function checkPin(store, slug, pin, now = Date.now()) {
  if (!isValidSlug(slug)) throw new SetError(404, "이 주소로 발급된 세트가 없어요.");
  if (typeof pin !== "string" || !pin) throw new SetError(400, "PIN을 입력해주세요.");
  const outcome = await update(store, slug, function (rec) {
    const auth = authorize(rec, pin, now);
    return { next: auth.next, result: auth };
  });
  if (!outcome.ok) throw outcome.error;
  return { ok: true };
}

export async function saveApps(store, slug, pin, appsInput, now = Date.now()) {
  if (!isValidSlug(slug)) throw new SetError(404, "이 주소로 발급된 세트가 없어요.");
  if (typeof pin !== "string" || !pin) throw new SetError(400, "PIN을 입력해주세요.");
  const apps = validateApps(appsInput);

  const outcome = await update(store, slug, function (rec) {
    const auth = authorize(rec, pin, now);
    if (!auth.ok) return { next: auth.next, result: auth };
    const base = auth.next || rec;
    return { next: { ...base, apps, updatedAt: new Date(now).toISOString() }, result: auth };
  });
  if (!outcome.ok) throw outcome.error;
  return { slug, apps };
}

export async function createSet(store, { slug, pin, apps }, now = Date.now()) {
  checkNewSlug(slug);
  checkPinFormat(pin);
  const cleanApps = validateApps(apps);
  const iso = new Date(now).toISOString();
  const rec = { slug, apps: cleanApps, pin: hashPin(pin), fails: 0, lockedUntil: 0, createdAt: iso, updatedAt: iso };
  const write = await store.setJSON(slug, rec, { onlyIfNew: true });
  if (write && write.modified === false) throw new SetError(409, "이미 발급된 주소예요.");
  return { slug, apps: cleanApps };
}

export async function resetPin(store, { slug, pin }, now = Date.now()) {
  if (!isValidSlug(slug)) throw new SetError(404, "이 주소로 발급된 세트가 없어요.");
  checkPinFormat(pin);
  await update(store, slug, function (rec) {
    return {
      next: { ...rec, pin: hashPin(pin), fails: 0, lockedUntil: 0, updatedAt: new Date(now).toISOString() },
      result: null
    };
  });
  return { slug };
}
