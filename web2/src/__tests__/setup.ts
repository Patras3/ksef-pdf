// Vitest setup: provide WebCrypto where jsdom doesn't.
// jsdom 22+ exposes crypto.subtle, but older versions or strict envs may not.

import { webcrypto } from "node:crypto";

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    configurable: true,
  });
}
