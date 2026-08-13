import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PaymentMethodSelector } from "./PaymentMethodSelector";

describe("PaymentMethodSelector", () => {
  it("renders required-choice native radios without selecting one", () => {
    const markup = renderToStaticMarkup(
      <PaymentMethodSelector
        deliveryFee={100}
        merchandiseTotal={1200}
        name="payment_method"
        onBlur={vi.fn()}
        onChange={vi.fn()}
      />,
    );

    expect(markup.match(/name="payment_method"/g)).toHaveLength(2);
    expect(markup).toContain('value="bkash_full"');
    expect(markup).toContain('value="cod"');
    expect(markup).toContain("Tk 1,300 now");
    expect(markup).toContain("Tk 100 now");
    expect(markup).not.toContain("checked");
  });
});
