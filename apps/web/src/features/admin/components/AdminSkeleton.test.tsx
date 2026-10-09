// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  AdminDashboardSkeleton,
  AdminShellSkeleton,
  AdminSidebarSkeleton,
  AdminTopBarSkeleton,
} from "./AdminSkeleton";

describe("AdminSkeleton components", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders AdminSidebarSkeleton with navigation items", () => {
    const { getByLabelText } = render(<AdminSidebarSkeleton />);
    expect(getByLabelText("Sidebar loading")).toBeDefined();
  });

  it("renders AdminTopBarSkeleton with search and actions", () => {
    const { getByLabelText } = render(<AdminTopBarSkeleton />);
    expect(getByLabelText("Top navigation loading")).toBeDefined();
  });

  it("renders AdminDashboardSkeleton with layout sections", () => {
    const { container } = render(<AdminDashboardSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it("renders AdminShellSkeleton wrapping sidebar, header, and dashboard fallback", () => {
    const { getByRole, getByLabelText } = render(<AdminShellSkeleton />);
    expect(getByRole("status", { name: "Loading admin portal" })).toBeDefined();
    expect(getByLabelText("Sidebar loading")).toBeDefined();
    expect(getByLabelText("Top navigation loading")).toBeDefined();
  });

  it("renders custom children inside AdminShellSkeleton when provided", () => {
    const { getByText } = render(
      <AdminShellSkeleton>
        <div>Custom loading body</div>
      </AdminShellSkeleton>,
    );
    expect(getByText("Custom loading body")).toBeDefined();
  });
});
