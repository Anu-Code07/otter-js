import type { IpcMainEvent, WebContents } from 'electron';

type CleanupFn = () => void;

const subscriptions = new WeakMap<WebContents, Map<string, CleanupFn>>();

function getSenderSubscriptions(sender: WebContents): Map<string, CleanupFn> {
  let map = subscriptions.get(sender);
  if (!map) {
    map = new Map();
    subscriptions.set(sender, map);
    sender.setMaxListeners(25);
    sender.once('destroyed', () => {
      for (const cleanup of map!.values()) {
        cleanup();
      }
      subscriptions.delete(sender);
    });
  }
  return map;
}

/**
 * Registers an IPC push subscription once per renderer + key.
 * Re-subscribing (e.g. React Strict Mode) replaces the previous listener.
 */
export function manageIpcSubscription<T>(
  event: IpcMainEvent,
  key: string,
  sendChannel: string,
  register: (emit: (payload: T) => void) => CleanupFn,
): void {
  const map = getSenderSubscriptions(event.sender);
  const existing = map.get(key);
  if (existing) existing();

  const cleanup = register((payload) => {
    if (!event.sender.isDestroyed()) {
      event.sender.send(sendChannel, payload);
    }
  });

  map.set(key, cleanup);
}
