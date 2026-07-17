import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { AppVersion } from "@/shared/components/layout/AppVersion";

// __APP_VERSION__ is stamped to "test" by vitest.config.ts (the web build stamp;
// mirrors vite.config.ts).
describe("AppVersion", () => {
  it("shows the web build stamp", () => {
    renderWithProviders(<AppVersion />);
    const el = screen.getByText("test");
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("title", "test");
  });

  it("swallows its own clicks so it can't trigger the sign-out row's action", async () => {
    const onRowClick = vi.fn();
    renderWithProviders(
      <div onClick={onRowClick}>
        <AppVersion />
      </div>
    );
    await userEvent.click(screen.getByText("test"));
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
