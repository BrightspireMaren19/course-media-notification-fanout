import { z } from "zod";
import { infrai } from "./infrai.js";

const notification = z.object({ assetId: z.string().min(1), courseId: z.string().min(1), title: z.string().min(1), subscribers: z.array(z.string().min(1)).min(1) });
export type MediaReady = z.infer<typeof notification>;

export function fanoutMediaReady(input: unknown) {
  const event = notification.parse(input);
  return Promise.all(event.subscribers.map((subscriberId, index) => {
    const payload = { eventId: `${event.assetId}:ready:${index}`, type: "media.ready", assetId: event.assetId, courseId: event.courseId, title: event.title, subscriberId };
    return infrai.queue.publish({ payload });
  }));
}

export async function deliverOne() {
  const batch = await infrai.queue.consume(10, 30);
  for (const message of batch.messages ?? []) { console.log("delivered", message.payload); await infrai.queue.ack(message.message_id); }
  return batch.messages?.length ?? 0;
}

if (process.argv[1]?.endsWith("media_fanout.ts")) {
  const [assetId = "lesson-42-video", courseId = "course-101", title = "Fractions: visual practice"] = process.argv.slice(2);
  const subscribers = ["creator-alex", "creator-bea", "creator-chen"];
  await fanoutMediaReady({ assetId, courseId, title, subscribers });
  console.log(`queued ${subscribers.length} course notifications`);
}
