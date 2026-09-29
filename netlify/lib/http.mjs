import { getStore, getDeployStore } from "@netlify/blobs";
import { SetError } from "./sets.mjs";

const MAX_BODY = 20000;

// 운영(workset.my) 데이터는 전역 스토어, 그 외(배포 미리보기·브랜치 배포·로컬)는 배포별 스토어.
// 미리보기에서 테스트하다 실제 세트를 덮어쓰지 않게 하려는 것이다.
export function setsStore(context) {
  const deployContext = context?.deploy?.context ?? globalThis.Netlify?.context?.deploy?.context;
  const opts = { name: "sets", consistency: "strong" };
  return deployContext === "production" ? getStore(opts) : getDeployStore(opts);
}

export function json(status, body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...(extraHeaders || {}) }
  });
}

export async function readJson(req) {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new SetError(413, "요청이 너무 커요.");
  try { return text ? JSON.parse(text) : {}; } catch (err) {
    throw new SetError(400, "요청 형식이 올바르지 않아요.");
  }
}

export function methodNotAllowed(allowed) {
  return json(405, { error: "지원하지 않는 요청이에요." }, { allow: allowed.join(", ") });
}

// 예상한 오류는 메시지를 그대로, 예상 못 한 오류는 로그만 남기고 일반 메시지로.
export function handleError(err) {
  if (err instanceof SetError) {
    const headers = err.extra.retryAfterSec ? { "retry-after": String(err.extra.retryAfterSec) } : undefined;
    return json(err.status, { error: err.message, ...err.extra }, headers);
  }
  console.error(err);
  return json(500, { error: "서버에서 문제가 생겼어요. 잠시 후 다시 시도해주세요." });
}
