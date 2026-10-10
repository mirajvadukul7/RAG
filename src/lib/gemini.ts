import { GoogleGenAI } from "@google/genai";

export async function generateRAGAnswer(
  query: string,
  evidencePack: Array<{ source_id: string; document: string; text: string }>
): Promise<{ answer: string; citations: string[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null; // Signals to caller that Gemini key is not configured
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const evidencePrompt = evidencePack
      .map((e) => `[${e.source_id}] (Document: ${e.document}):\n${e.text}`)
      .join("\n\n");

    const prompt = `You are AegisRAG, a secure zero-leakage enterprise AI assistant.
Answer the user's question STRICTLY and SOLELY using the authorized evidence provided below.
DO NOT use outside knowledge. If the evidence does not contain the answer, explicitly state that you cannot answer based on authorized records.
Whenever you state a fact from the evidence, cite the exact source ID like [${evidencePack[0]?.source_id || "SRC-001"}] in square brackets.

Authorized Evidence:
${evidencePrompt}

User Question: ${query}

Provide a concise, factual answer with source citations.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const matches = text.match(/\[(SRC-[A-Za-z0-9-_]+)\]/g) || [];
    const citations = Array.from(new Set(matches.map((c) => c.replace(/[[\]]/g, ""))));

    return {
      answer: text,
      citations: citations.length > 0 ? citations : evidencePack.map((e) => e.source_id).slice(0, 2),
    };
  } catch (err: unknown) {
    console.error("Gemini API generation error:", err);
    return null;
  }
}

export async function performImageOCR(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      text: "",
      error: "Image OCR requires GEMINI_API_KEY. Configure GEMINI_API_KEY in your environment to enable real multimodal vision OCR processing.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType: mimeType || "image/png",
              },
            },
            {
              text: "Extract and transcribe all legible text, table data, and numerical figures visible in this image verbatim. Do not summarize.",
            },
          ],
        },
      ],
    });

    return { text: response.text || "No text detected in image." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OCR failed";
    return { text: "", error: `Gemini OCR Error: ${msg}` };
  }
}
