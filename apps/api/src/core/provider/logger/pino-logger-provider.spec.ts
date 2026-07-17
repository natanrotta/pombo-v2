import "reflect-metadata";

const { mockLogger, mockLeaveBreadcrumb } = vi.hoisted(() => ({
  mockLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  mockLeaveBreadcrumb: vi.fn(),
}));

vi.mock("@core/http/logger", () => ({
  logger: mockLogger,
}));

vi.mock("@core/service/error-reporter", () => ({
  errorReporter: { leaveBreadcrumb: mockLeaveBreadcrumb },
}));

import { PinoLoggerProvider } from "./pino-logger-provider";

describe("PinoLoggerProvider", () => {
  let sut: PinoLoggerProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new PinoLoggerProvider();
  });

  const ctx = { userId: "u1" };

  it("info should forward to logger and leave an info breadcrumb", () => {
    sut.info(ctx, "hello");

    expect(mockLogger.info).toHaveBeenCalledWith(ctx, "hello");
    expect(mockLeaveBreadcrumb).toHaveBeenCalledWith("hello", {
      level: "info",
      ...ctx,
    });
  });

  it("warn should forward to logger and leave a warning breadcrumb", () => {
    sut.warn(ctx, "careful");

    expect(mockLogger.warn).toHaveBeenCalledWith(ctx, "careful");
    expect(mockLeaveBreadcrumb).toHaveBeenCalledWith("careful", {
      level: "warning",
      ...ctx,
    });
  });

  it("error should forward to logger and leave an error breadcrumb", () => {
    sut.error(ctx, "boom");

    expect(mockLogger.error).toHaveBeenCalledWith(ctx, "boom");
    expect(mockLeaveBreadcrumb).toHaveBeenCalledWith("boom", {
      level: "error",
      ...ctx,
    });
  });

  it("debug should forward to logger and leave a debug breadcrumb", () => {
    sut.debug(ctx, "trace");

    expect(mockLogger.debug).toHaveBeenCalledWith(ctx, "trace");
    expect(mockLeaveBreadcrumb).toHaveBeenCalledWith("trace", {
      level: "debug",
      ...ctx,
    });
  });
});
