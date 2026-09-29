// GET  /api/sets/:slug  — 공개 목록 조회 (런처가 부름)
// PUT  /api/sets/:slug  — 목록 저장 { pin, apps }
import { getPublicSet, saveApps } from "../lib/sets.mjs";
import { setsStore, json, readJson, methodNotAllowed, handleError } from "../lib/http.mjs";

export default async (req, context) => {
  const slug = String(context.params.slug || "").toLowerCase();
  try {
    if (req.method === "GET") {
      return json(200, await getPublicSet(setsStore(context), slug));
    }
    if (req.method === "PUT") {
      const body = await readJson(req);
      return json(200, await saveApps(setsStore(context), slug, body.pin, body.apps));
    }
    return methodNotAllowed(["GET", "PUT"]);
  } catch (err) {
    return handleError(err);
  }
};

export const config = { path: "/api/sets/:slug" };
