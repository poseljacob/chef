const DEFAULT_GETBOTS_APP_URL = process.env.GETBOTS_APP_URL || "https://www.getbots.ai";
const GETBOTS_BIND_URL = process.env.GETBOTS_BIND_URL || `${DEFAULT_GETBOTS_APP_URL}/api/studio/bind`;

type BindStatus = "draft" | "building" | "ready" | "archived";

export async function bindGetBotsWorkspace(input: {
  token: string;
  appId: string;
  chatUrl?: string;
  status?: BindStatus;
}) {
  if (!input.token || !input.appId) {
    return;
  }
  if (input.appId.startsWith("studio-")) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(GETBOTS_BIND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.token}`,
      },
      body: JSON.stringify({
        appId: input.appId,
        chatUrl: input.chatUrl,
        status: input.status,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[getbots.bind] bind request failed", {
        status: response.status,
        appId: input.appId,
        body: body.slice(0, 500),
      });
    }
  } catch (error) {
    console.error("[getbots.bind] bind request error", {
      appId: input.appId,
      error,
    });
  } finally {
    clearTimeout(timeout);
  }
}
