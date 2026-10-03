import assert from "node:assert/strict";
import { fanoutMediaReady } from "./media_fanout.js";

const originalFetch = globalThis.fetch;
const calls: unknown[] = [];
globalThis.fetch = (async (_url, init) => { calls.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify({ ok: true, data: { message_id: "m-1" }, metadata: {} }), { status: 200, headers: { "content-type": "application/json" } }); }) as typeof fetch;

await fanoutMediaReady({ assetId: "asset-7", courseId: "course-2", title: "Reading aloud", subscribers: ["teacher-1", "teacher-2"] });
assert.equal(calls.length, 2);
assert.equal((calls[0] as { payload: { type: string } }).payload.type, "media.ready");
assert.equal((calls[1] as { payload: { subscriberId: string } }).payload.subscriberId, "teacher-2");
globalThis.fetch = originalFetch;
console.log("fanout decision test passed");
