export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfLib = require("pdf-parse");
    const PDFClass = pdfLib.PDFParse || (typeof pdfLib === "function" ? pdfLib : null);

    if (PDFClass && typeof PDFClass === "function" && PDFClass.prototype?.getText) {
      const parser = new PDFClass({ data: buffer });
      const result = await parser.getText();
      await parser.destroy?.();
      const extracted = typeof result === "string" ? result : result?.text || "";
      if (extracted.trim().length > 0) {
        return { text: extracted.trim(), pages: result?.pages?.length || 1 };
      }
    } else if (typeof pdfLib === "function") {
      const data = await pdfLib(buffer);
      if (data && data.text) {
        return { text: data.text.trim(), pages: data.numpages || 1 };
      }
    }
  } catch (err: unknown) {
    console.warn("Primary PDF parser encountered an issue, running stream scanner fallback:", err);
  }

  // Stream extraction fallback for PDF text operators
  const rawString = buffer.toString("binary");
  const textChunks: string[] = [];

  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(rawString)) !== null) {
    textChunks.push(match[1]);
  }

  const arrayTjRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(rawString)) !== null) {
    const inner = match[1];
    const subMatches = inner.match(/\(([^)]+)\)/g);
    if (subMatches) {
      textChunks.push(subMatches.map((s) => s.slice(1, -1)).join(" "));
    }
  }

  const fallbackText = textChunks.join(" ").trim();
  if (fallbackText.length > 0) {
    return { text: fallbackText, pages: 1 };
  }

  // Clean ASCII fallback
  const cleanAscii = buffer
    .toString("utf-8", 0, Math.min(buffer.length, 50000))
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const meaningfulWords = cleanAscii
    .split(" ")
    .filter((w) => w.length > 2 && !w.startsWith("/") && !w.startsWith("%") && !w.includes("obj") && !w.includes("endobj"))
    .join(" ");

  return { text: meaningfulWords || "No readable text content extracted from file.", pages: 1 };
}

export function splitIntoChunks(text: string, chunkSize = 400, overlap = 80): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (cleanText.length <= chunkSize) {
    return [cleanText];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < cleanText.length) {
    const endIndex = Math.min(startIndex + chunkSize, cleanText.length);
    let chunk = cleanText.slice(startIndex, endIndex);

    // Try not to cut in the middle of a sentence/word if possible
    if (endIndex < cleanText.length) {
      const lastSpace = chunk.lastIndexOf(" ");
      if (lastSpace > chunkSize * 0.6) {
        chunk = chunk.slice(0, lastSpace);
        startIndex += lastSpace + 1 - overlap;
      } else {
        startIndex += chunkSize - overlap;
      }
    } else {
      startIndex = cleanText.length;
    }

    if (chunk.trim().length > 0) {
      chunks.push(chunk.trim());
    }
  }

  return chunks;
}
