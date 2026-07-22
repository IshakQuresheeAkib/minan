import { describe, expect, it } from "vitest";

import { getImageUploadValidationError } from "./image-upload-validation";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxSize = 5 * 1024 * 1024;

describe("banner image upload validation", () => {
  it("accepts supported images up to 5 MB", () => {
    expect(
      getImageUploadValidationError(
        [{ type: "image/webp", size: maxSize }],
        acceptedTypes,
        maxSize,
      ),
    ).toBeNull();
  });

  it("rejects unsupported formats", () => {
    expect(
      getImageUploadValidationError(
        [{ type: "image/gif", size: 100 }],
        acceptedTypes,
        maxSize,
      ),
    ).toMatch(/JPEG/);
  });

  it("rejects files larger than 5 MB", () => {
    expect(
      getImageUploadValidationError(
        [{ type: "image/jpeg", size: maxSize + 1 }],
        acceptedTypes,
        maxSize,
      ),
    ).toMatch(/5 MB/);
  });
});
