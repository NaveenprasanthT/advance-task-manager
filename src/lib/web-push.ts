import webpush from "web-push";

let configured = false;

function getClient() {
  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      process.env.VAPID_PUBLIC_KEY ?? "",
      process.env.VAPID_PRIVATE_KEY ?? "",
    );
    configured = true;
  }
  return webpush;
}

export { getClient as getWebPushClient };
export type { PushSubscription as WebPushSubscription } from "web-push";
