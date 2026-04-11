// Discord notifications — optional, not required for v1
// Wire up DISCORD_WEBHOOK_URL env var to enable

export async function notifyDiscord(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return; // silent no-op in v1

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
  } catch (err) {
    console.warn("[discord] Notification failed (non-fatal):", err);
  }
}
