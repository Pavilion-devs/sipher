import { Buffer as BrowserBuffer } from "buffer";

type BufferGlobal = typeof globalThis & {
  Buffer?: typeof BrowserBuffer;
};

const runtime = globalThis as BufferGlobal;

// Cloak's browser bundle uses Node Buffer APIs while building direct deposits.
// Some browser shims expose Buffer.from without readBigInt64LE, so pin the
// runtime to the full feross/buffer implementation before SDK calls execute.
if (typeof runtime.Buffer === "undefined") {
  runtime.Buffer = BrowserBuffer;
} else if (
  typeof runtime.Buffer.from(new Uint8Array(8)).readBigInt64LE !== "function"
) {
  runtime.Buffer = BrowserBuffer;
}
