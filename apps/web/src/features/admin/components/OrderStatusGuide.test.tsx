import {
  Children,
  isValidElement,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";
import { describe, expect, it } from "vitest";

import { SheetDescription } from "@/components/ui/sheet";

import { OrderStatusGuide } from "./OrderStatusGuide";

function findElementByType(
  node: ReactNode,
  type: ElementType,
): ReactElement<{ children?: ReactNode }> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) {
      continue;
    }

    if (child.type === type) {
      return child;
    }

    const match = findElementByType(child.props.children, type);
    if (match) {
      return match;
    }
  }

  return undefined;
}

describe("OrderStatusGuide", () => {
  it("exposes its introductory guidance as the Sheet accessible description", () => {
    const description = findElementByType(
      OrderStatusGuide(),
      SheetDescription,
    );

    expect(description?.props.children).toBe(
      "একটি Order-এর Workflow, Fee এবং COD status আলাদা। Decision নেওয়ার আগে তিনটি status দেখুন।",
    );
  });
});
