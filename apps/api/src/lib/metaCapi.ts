type MetaCapiEventPayload = {
  eventName: string;
  eventId: string;
  eventSourceUrl?: string;
};

type MetaCapiUserData = {
  clientUserAgent?: string;
};

export async function sendMetaCapiEvent(
  payload: MetaCapiEventPayload,
  userData: MetaCapiUserData = {},
): Promise<void> {
  const accessToken = process.env.META_CAPI_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;

  if (!accessToken || !pixelId) {
    return;
  }

  const body = {
    data: [
      {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: "website",
        event_source_url: payload.eventSourceUrl,
        user_data: {
          client_user_agent: userData.clientUserAgent,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    console.error("Meta CAPI request failed:", message);
  }
}
