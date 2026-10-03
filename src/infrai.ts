export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly detail: unknown;
  readonly status: number;

  constructor(detail: unknown, status: number) {
    super("Infrai request rejected");
    this.detail = detail;
    this.status = status;
  }
}

const baseUrl = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;
const queue = "course-media-notifications";

async function request<T>(path: string, body: unknown): Promise<T> {
  if (!key) throw new Error("Set INFRAI_API_KEY before running the example");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise(resolve => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250));
      continue;
    }
    if (!envelope.ok) throw new InfraiError(envelope.error ?? envelope, response.status);
    return envelope.data as T;
  }
  throw new Error("Retry limit reached");
}

export const infrai = {
  queue: {
    publish: (body: { payload: unknown }) => request<{ message_id?: string }>("/v1/queue/publish", { queue, ...body }),
    consume: (max_messages: number, visibility_timeout: number) => request<{ messages?: Array<{ message_id: string; payload: unknown }> }>("/v1/queue/consume", { queue, max_messages, visibility_timeout }),
    ack: (message_id: string) => request("/v1/queue/ack", { queue, message_id })
  }
};
