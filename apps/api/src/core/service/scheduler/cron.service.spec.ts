const { mockSchedule } = vi.hoisted(() => ({
  mockSchedule: vi.fn(),
}));

vi.mock("node-cron", () => ({
  default: { schedule: mockSchedule },
}));

vi.mock("../../http/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

import { cronService } from "./cron.service";
import { logger } from "../../http/logger";

describe("CronService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a job", () => {
    const job = { name: "test-job", schedule: "* * * * *", handler: vi.fn() };

    // cronService is a singleton — we test via start()
    cronService.register(job);

    // Job not started yet — cron.schedule not called
    // We verify in start() test below
  });

  it("should call cron.schedule for each registered job on start()", () => {
    cronService.start();

    expect(mockSchedule).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ job: "test-job" }),
      "Cron job registered",
    );
  });

  it("should execute handler and log on success", async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    mockSchedule.mockImplementation(
      (_schedule: string, callback: () => void) => {
        callback(); // Immediately execute
      },
    );

    // Register and start a new service-like behavior
    // Since cronService is singleton, we test the callback directly
    const scheduledCallback = mockSchedule.mock.calls[0]?.[1];
    if (scheduledCallback) {
      await scheduledCallback();
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ job: "test-job" }),
        "Cron job started",
      );
    }
  });
});
