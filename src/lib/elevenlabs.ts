/**
 * elevenlabs.ts — ElevenLabs TTS with word-level timestamps.
 *
 * Uses the /with-timestamps endpoint which returns JSON containing
 * audio_base64 and character-level alignment data. Characters are
 * grouped into WordTiming objects that drive the caption overlay.
 *
 * If ELEVENLABS_API_KEY is not set, returns null and the render
 * proceeds silently without voiceover or captions.
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const MODEL_ID = "eleven_flash_v2_5";

export interface WordTiming {
  w: string;  // word text
  s: number;  // start seconds (2 decimal places)
  e: number;  // end seconds
}

export interface VoiceoverResult {
  audioSrc: string;
  wordTimings: WordTiming[];
}

/** Group character-level alignment data into word timings. */
function charsToWords(
  chars: string[],
  starts: number[],
  ends: number[],
): WordTiming[] {
  const words: WordTiming[] = [];
  let current = "";
  let wordStart = 0;
  let lastEnd = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === " " || ch === "\n") {
      if (current) {
        words.push({ w: current, s: Math.round(wordStart * 100) / 100, e: Math.round(lastEnd * 100) / 100 });
        current = "";
      }
    } else {
      if (!current) wordStart = starts[i];
      current += ch;
      lastEnd = ends[i];
    }
  }
  if (current) {
    words.push({ w: current, s: Math.round(wordStart * 100) / 100, e: Math.round(lastEnd * 100) / 100 });
  }
  return words;
}

export async function generateVoiceover(
  text: string,
  voiceId: string,
): Promise<VoiceoverResult | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log("[elevenlabs] ELEVENLABS_API_KEY not set — skipping voiceover");
    return null;
  }

  console.log(`[elevenlabs] Generating voiceover voice=${voiceId} chars=${text.length}`);

  const response = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voiceId}/with-timestamps`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "(unreadable)");
    throw new Error(`ElevenLabs TTS failed ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    audio_base64: string;
    alignment: {
      characters: string[];
      character_start_times_seconds: number[];
      character_end_times_seconds: number[];
    };
  };

  const audioSrc = `data:audio/mpeg;base64,${data.audio_base64}`;
  const wordTimings = charsToWords(
    data.alignment.characters,
    data.alignment.character_start_times_seconds,
    data.alignment.character_end_times_seconds,
  );

  console.log(
    `[elevenlabs] Voiceover ready — ${Math.round(data.audio_base64.length * 0.75 / 1024)}KB, ${wordTimings.length} words`,
  );
  return { audioSrc, wordTimings };
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
