const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export function getGa4MeasurementId(value: string): string | null {
  const measurementId = value.trim();

  return GA4_MEASUREMENT_ID_PATTERN.test(measurementId)
    ? measurementId
    : null;
}
