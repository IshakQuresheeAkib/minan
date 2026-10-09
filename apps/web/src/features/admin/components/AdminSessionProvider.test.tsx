// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { refreshSession } from "@/features/admin/actions/auth.actions";
import { AdminSessionProvider } from "./AdminSessionProvider";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/features/admin/actions/auth.actions", () => ({
  refreshSession: vi.fn(),
}));

describe("AdminSessionProvider", () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(refreshSession).mockRejectedValue(new Error("Refresh failed"));
    window.history.replaceState({}, "", "/admin?tab=orders");
  });

  it("marks the login redirect so a valid stale access cookie cannot send it back", async () => {
    render(
      <AdminSessionProvider>
        <div>Protected admin</div>
      </AdminSessionProvider>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        "/admin/login?next=%2Fadmin%3Ftab%3Dorders&reauth=1",
      );
    });
  });
});
