import { GoogleAnalytics } from "@next/third-parties/google";

import { env } from "@/config/env";
import { getGa4MeasurementId } from "@/lib/analytics/ga4";

export function Ga4Analytics() {
  const measurementId = getGa4MeasurementId(env.ga4Id);

  if (!measurementId) {
    return null;
  }

  return <GoogleAnalytics gaId={measurementId} />;
}
