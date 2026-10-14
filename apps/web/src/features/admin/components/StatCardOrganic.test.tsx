// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatCardOrganic } from "@/features/admin/components/StatCardOrganic";

describe("StatCardOrganic component", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders with green color variant and change indicator", () => {
    const { container } = render(
      <StatCardOrganic
        title="Total Sales"
        value="৳250,000"
        change="+12.5%"
        isPositive={true}
        colorVariant="green"
        subtitle="This month"
      />,
    );

    expect(screen.getByText("Total Sales")).toBeDefined();
    expect(screen.getByText("৳250,000")).toBeDefined();
    expect(screen.getByText("+12.5%")).toBeDefined();
    expect(screen.getByText("This month")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("radial-gradient");
    expect(card.style.background).toContain("rgba(16, 118, 103");
  });

  it("renders with blue color variant from shapeVariant 2", () => {
    const { container } = render(
      <StatCardOrganic
        title="New Customers"
        value="128"
        shapeVariant={2}
      />,
    );

    expect(screen.getByText("New Customers")).toBeDefined();
    expect(screen.getByText("128")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(0, 69, 143");
  });

  it("renders with purple color variant from shapeVariant 3", () => {
    const { container } = render(
      <StatCardOrganic
        title="Open Orders"
        value="15"
        shapeVariant={3}
      />,
    );

    expect(screen.getByText("Open Orders")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(124, 58, 237");
  });

  it("renders with green color variant from shapeVariant 4", () => {
    const { container } = render(
      <StatCardOrganic
        title="Conversion Rate"
        value="3.2%"
        shapeVariant={4}
        change="-0.4%"
        isPositive={false}
      />,
    );

    expect(screen.getByText("Conversion Rate")).toBeDefined();
    expect(screen.getByText("3.2%")).toBeDefined();
    expect(screen.getByText("-0.4%")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(16, 118, 103");
  });

  it("handles click action when onActionClick is provided", () => {
    const onActionClick = vi.fn();
    const { container } = render(
      <StatCardOrganic
        title="Clickable Stat"
        value="50"
        onActionClick={onActionClick}
      />,
    );

    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });

  it("renders with purple color variant", () => {
    const { container } = render(
      <StatCardOrganic
        title="Open Orders"
        value="46"
        colorVariant="purple"
        icon={<span data-testid="test-icon">icon</span>}
      />,
    );

    expect(screen.getByText("Open Orders")).toBeDefined();
    expect(screen.getByText("46")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(124, 58, 237");

    const iconCircle = screen.getByTestId("test-icon").parentElement as HTMLElement;
    expect(iconCircle.style.backgroundColor).toBe("rgba(124, 58, 237, 0.14)");
    expect(iconCircle.classList.contains("rounded-full")).toBe(true);
  });

  it("renders red variant with red top right circle bg color", () => {
    render(
      <StatCardOrganic
        title="Total Sales"
        value="৳12,416"
        colorVariant="red"
        icon={<span data-testid="test-icon">icon</span>}
      />,
    );

    const iconCircle = screen.getByTestId("test-icon").parentElement as HTMLElement;
    expect(iconCircle.style.backgroundColor).toBe("rgba(220, 38, 38, 0.14)");
    expect(iconCircle.classList.contains("rounded-full")).toBe(true);
  });

  it("renders green variant with green top right circle bg color", () => {
    render(
      <StatCardOrganic
        title="Conversion Rate"
        value="3.2%"
        colorVariant="green"
        icon={<span data-testid="test-icon">icon</span>}
      />,
    );

    const iconCircle = screen.getByTestId("test-icon").parentElement as HTMLElement;
    expect(iconCircle.style.backgroundColor).toBe("rgba(16, 118, 103, 0.14)");
    expect(iconCircle.classList.contains("rounded-full")).toBe(true);
  });
});
