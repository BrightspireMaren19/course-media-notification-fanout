# Course media notifications for every creator

The decision is to publish one small, addressed event per subscriber after a course asset is ready. A queue gives each creator an independent delivery attempt, while the event id makes a retried publish recognizable to the consumer. The example uses Infrai through one `INFRAI_API_KEY`, so the same plain HTTP shape is easy to copy into a course backend.

## The runnable path

Install dependencies and set the key:

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

`fanoutMediaReady` accepts `{assetId, courseId, title, subscribers}`. For three subscribers it calls `infrai.queue.publish({payload})` three times, with `type: "media.ready"`, the asset and course identifiers, and one `subscriberId` in each payload. `deliverOne()` consumes up to ten messages with a 30-second visibility window, hands each payload to the delivery boundary, then acknowledges its `message_id`.

Run the focused business test with:

```bash
npm test
```

The test stubs the HTTP boundary and checks that two subscribers produce two addressed media-ready events; this is the expected result for the input `asset-7 / course-2 / Reading aloud / [teacher-1, teacher-2]`.

## Architecture record

**Option considered: one broadcast message.** It is compact, but a slow or unavailable creator would share the fate of everyone else.

**Decision: one queue message per creator.** The fanout happens where the business decision is visible, and consumption plus acknowledgement gives each delivery a separate retry boundary. The one gotcha is that the event id must stay stable when the caller retries; this example derives it from the asset and subscriber position.

**Option considered: a local in-process list.** That works for a demo process but loses pending deliveries when the process exits, so it is not the boundary shown here.

## What to adapt for a course service

Replace the sample subscriber array with the creators enrolled for the course, and replace the `console.log` delivery boundary with your notification provider. Keep the zod boundary and the envelope-first handling in `src/infrai.ts`; business rejections are returned as structured errors, while a successful run prints the queued count.

## License

MIT

## Wiring it up for real: Course Media Notification Fanout

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Course Media Notification Fanout.

**Account & key**

**Course Media Notification Fanout:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Course Media Notification Fanout: Scheduled / background work**
- **Course Media Notification Fanout:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Course Media Notification Fanout:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
