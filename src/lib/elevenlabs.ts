/**
 * elevenlabs.ts — ElevenLabs TTS integration.
 *
 * Returns a base64 data URL (data:audio/mpeg;base64,...) so the audio
 * can be passed directly as inputProps into Remotion without needing a
 * file server — Chrome's <audio> element accepts data URLs natively.
 *
 * If ELEVENLABS_API_KEY is not set, returns null and the render
 * proceeds silently without voiceover.
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const MODEL_ID = "eleven_flash_v2_5"; // fastest, lowest latency

export async function generateVoiceover(
  text: string,
  voiceId: string,
): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log("[elevenlabs] ELEVENLABS_API_KEY not set — skipping voiceover");
    return null;
  }

  console.log(`[elevenlabs] Generating voiceover voice=${voiceId} chars=${text.length}`);

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(`ElevenLabs TTS failed ${response.status}: ${body}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  console.log(`[elevenlabs] Voiceover ready — ${Math.round(arrayBuffer.byteLength / 1024)}KB`);
  return `data:audio/mpeg;base64,${base64}`;
}

/**
 * Build a natural-sounding voiceover script from a content job's content object.
 * Works for both mfd (hook/points/cta/url) and ae (hook/points/takeaway/cta) shapes.
 */
export function buildVoiceoverScript(content: Record<string, unknown>): string {
  const parts: string[] = [];

  if (content.hook) parts.push(String(content.hook));

  const points = content.points;
  if (Array.isArray(points)) {
    parts.push(...points.map((p) => String(p)));
  }

  if (content.takeaway) parts.push(String(content.takeaway));
  if (content.cta)      parts.push(String(content.cta));

  return parts.join(". ").replace(/\.\./g, ".");
}
