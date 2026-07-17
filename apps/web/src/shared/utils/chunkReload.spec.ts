import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installStaleChunkReloadListener, reloadForStaleChunk } from "./chunkReload";

const GUARD_KEY = "boilerplate:chunk-reload";
const originalLocation = window.location;
let reloadSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  window.sessionStorage.clear();
  reloadSpy = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, reload: reloadSpy },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  vi.restoreAllMocks();
});

describe("reloadForStaleChunk", () => {
  it("reloads and records a timestamp when there is no recent reload", () => {
    const did = reloadForStaleChunk();

    expect(did).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    expect(Number(window.sessionStorage.getItem(GUARD_KEY))).toBeGreaterThan(0);
  });

  it("suppresses a second reload inside the debounce window", () => {
    window.sessionStorage.setItem(GUARD_KEY, String(Date.now()));

    const did = reloadForStaleChunk();

    expect(did).toBe(false);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("reloads again once the debounce window has passed", () => {
    window.sessionStorage.setItem(GUARD_KEY, String(Date.now() - 60_000));

    const did = reloadForStaleChunk();

    expect(did).toBe(true);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});

describe("installStaleChunkReloadListener", () => {
  it("reloads when a vite:preloadError event fires, and tears down cleanly", () => {
    const teardown = installStaleChunkReloadListener();

    const event = new Event("vite:preloadError", { cancelable: true });
    window.dispatchEvent(event);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
    // We reloaded, so the original error is swallowed (Vite won't rethrow).
    expect(event.defaultPrevented).toBe(true);

    teardown();
    window.sessionStorage.clear();
    window.dispatchEvent(new Event("vite:preloadError", { cancelable: true }));
    // No second reload after teardown.
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT swallow the event when the reload is debounce-suppressed", () => {
    // If we preventDefault here, Vite's preload helper resolves the import with
    // `undefined` and the app crashes later with a non-chunk-looking error.
    window.sessionStorage.setItem(GUARD_KEY, String(Date.now()));
    const teardown = installStaleChunkReloadListener();

    const event = new Event("vite:preloadError", { cancelable: true });
    window.dispatchEvent(event);

    expect(reloadSpy).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    teardown();
  });
});
