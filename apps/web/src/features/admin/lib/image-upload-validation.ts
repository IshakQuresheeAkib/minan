type UploadCandidate = Pick<File, "size" | "type">;

export function getImageUploadValidationError(
  files: readonly UploadCandidate[],
  acceptedFileTypes?: readonly string[],
  maxFileSizeBytes?: number,
): string | null {
  if (
    acceptedFileTypes &&
    files.some((file) => !acceptedFileTypes.includes(file.type))
  ) {
    return "Upload a JPEG, PNG, or WebP image";
  }

  if (
    maxFileSizeBytes &&
    files.some((file) => file.size > maxFileSizeBytes)
  ) {
    return "Each image must be 5 MB or smaller";
  }

  return null;
}
