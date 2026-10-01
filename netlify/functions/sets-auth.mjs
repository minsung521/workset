// POST /api/sets/:slug/auth  — 편집 모드 진입 전 PIN 확인 { pin }
import { checkPin } from "../lib/sets.mjs";
import { setsStore, json, readJson, methodNotAllowed, handleError } from "../lib/http.mjs";

export default async (req, context) => {
  if (req.method !== "POST") return methodNotAllowed(["POST"]);
  const slug = String(context.params.slug || "").toLowerCase();
  try {
    const body = await readJson(req);
    return json(200, await checkPin(setsStore(context), slug, body.pin));
  } catch (err) {
    return handleError(err);
  }
};

export const config = { path: "/api/sets/:slug/auth" };
