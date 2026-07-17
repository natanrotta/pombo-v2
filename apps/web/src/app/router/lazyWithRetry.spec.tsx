import { Component, Suspense, type ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lazyWithRetry } from "./lazyWithRetry";

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

function Loaded() {
  return <div>loaded</div>;
}

/** Minimal boundary so a propagated (non-chunk) error doesn't fail the run. */
class Catch extends Component<{ children: ReactNode }, { caught: boolean }> {
  state = { caught: false };
  static getDerivedStateFromError() {
    return { caught: true };
  }
  render() {
    return this.state.caught ? <div>caught</div> : this.props.children;
  }
}

const chunkError = () =>
  Promise.reject(new Error("Failed to fetch dynamically imported module: /assets/Page-x.js"));

describe("lazyWithRetry", () => {
  it("renders the component when the import succeeds, without reloading", async () => {
    const Comp = lazyWithRetry(() => Promise.resolve({ default: Loaded }));

    render(
      <Suspense fallback={<div>loading</div>}>
        <Comp />
      </Suspense>
    );

    expect(await screen.findByText("loaded")).toBeInTheDocument();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("reloads exactly once on a stale-chunk import failure", async () => {
    const Comp = lazyWithRetry(chunkError);

    render(
      <Catch>
        <Suspense fallback={<div>loading</div>}>
          <Comp />
        </Suspense>
      </Catch>
    );

    await waitFor(() => expect(reloadSpy).toHaveBeenCalledTimes(1));
    // The never-resolving promise must hold Suspense until the reload navigates
    // away — the error screen must NOT flash before the refresh.
    expect(screen.queryByText("caught")).not.toBeInTheDocument();
    expect(screen.getByText("loading")).toBeInTheDocument();
  });

  it("does NOT reload again within the debounce window after the first reload", async () => {
    // Guard holds a RECENT reload timestamp → a prior reload didn't recover →
    // surface the error instead of looping.
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.sessionStorage.setItem("boilerplate:chunk-reload", String(Date.now()));
    const Comp = lazyWithRetry(chunkError);

    render(
      <Catch>
        <Suspense fallback={<div>loading</div>}>
          <Comp />
        </Suspense>
      </Catch>
    );

    expect(await screen.findByText("caught")).toBeInTheDocument();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("reloads again for a fresh stale-chunk event once the debounce window has passed", async () => {
    // An old reload timestamp (well beyond the 10s window) must not block a new
    // recovery — otherwise a later, unrelated re-optimization would be stuck.
    window.sessionStorage.setItem("boilerplate:chunk-reload", String(Date.now() - 60_000));
    const Comp = lazyWithRetry(chunkError);

    render(
      <Catch>
        <Suspense fallback={<div>loading</div>}>
          <Comp />
        </Suspense>
      </Catch>
    );

    await waitFor(() => expect(reloadSpy).toHaveBeenCalledTimes(1));
  });

  it("does NOT reload on a non-chunk error and lets it surface", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const Comp = lazyWithRetry(() => Promise.reject(new Error("a genuine runtime bug")));

    render(
      <Catch>
        <Suspense fallback={<div>loading</div>}>
          <Comp />
        </Suspense>
      </Catch>
    );

    expect(await screen.findByText("caught")).toBeInTheDocument();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
