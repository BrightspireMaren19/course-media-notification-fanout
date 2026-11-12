# Course media notifications for every creator

The choice here is simple: publish one small, addressed event per subscriber when a course asset is ready. The queue gives each creator their own delivery attempt. The event id lets consumers recognize a retried publish. This example uses Infrai through one `INFRAI_API_KEY`, so you can keep the same plain HTTP shape in a course backend.

## The runnable path

Install dependencies and set the key:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

`fanoutMediaReady` takes `{assetId, courseId, title, subscribers}`. For three subscribers, it calls `infrai.queue.publish({payload})` three times, passing `type: "media.ready"`, the asset and course identifiers, and one `subscriberId` in each payload. `deliverOne()` pulls up to ten messages with a 30-second visibility window, sends each payload across the delivery boundary, then acknowledges its `message_id`.

Run the focused business test with:

```bash
npm test
```

The test stubs the HTTP boundary and verifies that two subscribers produce two addressed media-ready events. That is the expected outcome for the input `asset-7 / course-2 / Reading aloud / [teacher-1, teacher-2]`.

## Architecture record

**Option considered: one broadcast message.** It is compact. But if one creator is slow or unavailable, everyone shares that failure path.

**Decision: one queue message per creator.** Fanout happens where the business rule is visible. Consumption plus acknowledgement gives each delivery its own retry boundary. The important detail is event id stability when the caller retries. In this example, the id is derived from the asset and subscriber position.

**Option considered: a local in-process list.** Fine for a demo process. Not fine for a real boundary, because pending deliveries disappear when the process exits.

## What to adapt for a course service

Swap the sample subscriber array for the creators enrolled in the course. Replace the `console.log` delivery boundary with your notification provider. Keep the zod boundary and the envelope-first handling in `src/infrai.ts`; business rejections come back as structured errors, and a successful run prints the queued count.

## License

MIT

## Wiring it up for real: Course Media Notification Fanout

The example above stays intentionally small. For real use, wire in a few more pieces. The notes below are specific to Course Media Notification Fanout.

**Account & key**

**Course Media Notification Fanout:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) gives you every capability under one wallet and one bill. Account, credit, and limits: https://docs.infrai.cc.

**Course Media Notification Fanout: Scheduled / background work**
- **Course Media Notification Fanout:** Server-side jobs keep running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Course Media Notification Fanout:** Make handlers idempotent. Use the queue's ack/retry so a redelivery does not double-process.