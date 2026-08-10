import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ShippingMethodSelector } from "./ShippingMethodSelector";

const options = [
  {
    id: "inside_sylhet" as const,
    label: "Inside Sylhet Shipping Cost",
    delivery_fee: 60,
  },
  {
    id: "outside_sylhet" as const,
    label: "Outside Sylhet Shipping Cost",
    delivery_fee: 120,
  },
];

describe("ShippingMethodSelector", () => {
  it("renders two same-name native radios without an initial selection", () => {
    const markup = renderToStaticMarkup(
      <ShippingMethodSelector
        name="shipping_zone"
        onBlur={vi.fn()}
        onChange={vi.fn()}
        options={options}
      />,
    );

    expect(markup.match(/name="shipping_zone"/g)).toHaveLength(2);
    expect(markup).toContain('value="inside_sylhet"');
    expect(markup).toContain('value="outside_sylhet"');
    expect(markup).not.toContain("checked");
  });
});
