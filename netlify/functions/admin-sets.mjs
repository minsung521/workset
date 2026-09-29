// POST /api/admin/sets  — 관리자 전용. 헤더 x-admin-key 필요.
//   { action: "create", slug, pin, apps }  새 주소 발급
//   { action: "reset-pin", slug, pin }     PIN 재설정 (잠금도 풀림)
import { createSet, resetPin, safeEqualString, SetError } from "../lib/sets.mjs";
import { setsStore, json, readJson, methodNotAllowed, handleError } from "../lib/http.mjs";

const MIN_KEY_LENGTH = 24;

export default async (req, context) => {
  if (req.method !== "POST") return methodNotAllowed(["POST"]);

  const expected = globalThis.Netlify?.env?.get("ADMIN_KEY") ?? process.env.ADMIN_KEY;
  if (!expected || expected.length < MIN_KEY_LENGTH) {
    return json(503, { error: "관리자 키가 설정되지 않았어요 (Netlify 환경변수 ADMIN_KEY)." });
  }
  if (!safeEqualString(req.headers.get("x-admin-key") || "", expected)) {
    return json(401, { error: "관리자 키가 맞지 않아요." });
  }

  try {
    const body = await readJson(req);
    const slug = String(body.slug || "").trim().toLowerCase();
    const store = setsStore(context);
    if (body.action === "create") {
      return json(201, await createSet(store, { slug, pin: body.pin, apps: body.apps }));
    }
    if (body.action === "reset-pin") {
      return json(200, await resetPin(store, { slug, pin: body.pin }));
    }
    throw new SetError(400, "action은 create 또는 reset-pin이어야 해요.");
  } catch (err) {
    return handleError(err);
  }
};

export const config = { path: "/api/admin/sets" };
