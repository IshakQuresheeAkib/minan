// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatCardOrganic } from "@/features/admin/components/StatCardOrganic";

describe("StatCardOrganic component", () => {
  it("renders with green color variant and progress bar", () => {
    const { container } = render(
      <StatCardOrganic
        title="Total Sales"
        value="৳250,000"
        change="+12.5%"
        isPositive={true}
        colorVariant="green"
        progressPercent={85}
        countdownText="Live Hub"
      />,
    );

    expect(screen.getByText("Total Sales")).toBeDefined();
    expect(screen.getByText("৳250,000")).toBeDefined();
    expect(screen.getByText("+12.5%")).toBeDefined();
    expect(screen.getByText("85%")).toBeDefined();
    expect(screen.getByText("Live Hub")).toBeDefined();

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
    expect(screen.getByText("Active")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(0, 69, 143");
  });

  it("renders with orange color variant from shapeVariant 3", () => {
    const { container } = render(
      <StatCardOrganic
        title="Open Orders"
        value="15"
        shapeVariant={3}
      />,
    );

    expect(screen.getByText("Open Orders")).toBeDefined();
    expect(screen.getByText("15")).toBeDefined();
    expect(screen.getByText("Pending")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(255, 183, 65");
  });

  it("renders with red color variant from shapeVariant 4", () => {
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
    expect(screen.getByText("Storefront")).toBeDefined();

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.background).toContain("rgba(166, 61, 42");
  });
});
