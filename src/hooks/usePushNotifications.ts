"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// Standard VAPID-key conversion: the browser's pushManager.subscribe() wants
// the public key as a raw Uint8Array, not the base64url string the server
// hands out.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function getSubscriptionStatus(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  return Boolean(existing) && Notification.permission === "granted";
}

/** Tracks whether this browser currently has an active push subscription + granted permission. */
export function usePushSubscriptionStatus() {
  const [supported] = useState(isPushSupported);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Exposed so callers (the Settings toggle) can re-check after subscribing/
  // unsubscribing - not called directly from the mount effect below, which
  // instead runs its own inline async check (the pattern eslint's
  // react-hooks/set-state-in-effect rule expects for effect-triggered
  // fetches - see RecurringMissedReasonDialog.tsx for the same lesson).
  const refresh = useCallback(async () => {
    setLoading(true);
    const status = await getSubscriptionStatus().catch(() => false);
    setSubscribed(status);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSubscriptionStatus()
      .catch(() => false)
      .then((status) => {
        if (cancelled) return;
        setSubscribed(status);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { supported, subscribed, loading, refresh };
}

export function useSubscribeToPush() {
  return useMutation({
    mutationFn: async () => {
      if (!isPushSupported()) throw new Error("Push notifications aren't supported in this browser");

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push notifications aren't configured for this app yet");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission was denied");

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const json = subscription.toJSON();
      await fetchJson("/api/me/push-subscription", {
        method: "POST",
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
    },
    onSuccess: () => toast.success("Push notifications enabled"),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUnsubscribeFromPush() {
  return useMutation({
    mutationFn: async () => {
      if (!isPushSupported()) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await fetchJson("/api/me/push-subscription", {
        method: "DELETE",
        body: JSON.stringify({ endpoint }),
      });
    },
    onSuccess: () => toast.success("Push notifications turned off"),
    onError: (error: Error) => toast.error(error.message),
  });
}
