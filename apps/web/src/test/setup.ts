/// <reference types="@testing-library/jest-dom" />
import { afterEach, beforeAll, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// Augment Vitest's Assertion interface so TS knows about jest-dom matchers
// (toBeInTheDocument, toBeDisabled, …). Done in the setup file so it's only
// active in test compilation contexts, not production code.
declare module "vitest" {
  // Matches the signatures published by @testing-library/jest-dom/types/vitest.d.ts;
  // diverging type parameters here would conflict at type-check time.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<any, any> {}
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// jest-dom v6 ships a Vitest entrypoint that, on Vitest 1.6+, tries to mutate
// a frozen TaskMeta object and explodes the whole suite. Manually wiring the
// matchers via `expect.extend` keeps us on the stable contract.
expect.extend(matchers);

// Force pt-BR so test assertions match the canonical locale (the project's
// fallbackLng). Without this, i18next would pick navigator language ("en")
// inside jsdom and tests would be locale-dependent.
beforeAll(async () => {
  const i18n = (await import("@/shared/i18n")).default;
  if (i18n.language !== "pt-BR") {
    await i18n.changeLanguage("pt-BR");
  }
});

afterEach(() => {
  cleanup();
  // Reset web-storage between tests so feature flags / "first paint" markers
  // (e.g. the onboarding intro reveal) don't leak across cases.
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.clear();
      window.localStorage.clear();
    } catch {
      // jsdom edge cases — swallow.
    }
  }
});

// jsdom doesn't implement these — Chakra/Framer Motion read both during render.
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }

  // Element.scrollIntoView — used by the chat auto-scroll effect.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }

  // Required by some Chakra components that call into the IntersectionObserver
  // / ResizeObserver browser APIs at mount.
  class StubObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): unknown[] {
      return [];
    }
  }
  const globalRef = window as unknown as Record<string, unknown>;
  if (!globalRef.IntersectionObserver) globalRef.IntersectionObserver = StubObserver;
  if (!globalRef.ResizeObserver) globalRef.ResizeObserver = StubObserver;
}
