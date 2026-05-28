import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
}

export interface RagPdfChunk {
  content: string;
  pageLabel: string;
  sectionTitle: string | null;
}

interface BuildRagPdfChunksOptions {
  maxChunkLength?: number;
}

const defaultMaxChunkLength = 700;
function normalizeExtractedLine(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function normalizePageLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function deriveSectionTitle(lines: string[]) {
  const candidate = lines[0];

  if (!candidate || candidate.length > 80) {
    return null;
  }

  return candidate;
}

function splitIntoSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

export function buildRagPdfChunks(
  pages: ExtractedPdfPage[],
  options: BuildRagPdfChunksOptions = {}
): RagPdfChunk[] {
  const maxChunkLength = options.maxChunkLength ?? defaultMaxChunkLength;

  return pages.flatMap((page) => {
    const lines = normalizePageLines(page.text);

    if (lines.length === 0) {
      return [];
    }

    const sectionTitle = deriveSectionTitle(lines);
    const normalizedText = lines.join(" ");
    const sentences = splitIntoSentences(normalizedText);
    const chunks: RagPdfChunk[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      const candidate = currentChunk ? `${currentChunk} ${sentence}` : sentence;

      if (candidate.length <= maxChunkLength || currentChunk.length === 0) {
        currentChunk = candidate;
        continue;
      }

      chunks.push({
        content: currentChunk,
        pageLabel: String(page.pageNumber),
        sectionTitle,
      });
      currentChunk = sentence;
    }

    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk,
        pageLabel: String(page.pageNumber),
        sectionTitle,
      });
    }

    return chunks;
  });
}

export async function downloadPdfDocument(
  documentUrl: string,
  download = fetch
): Promise<Uint8Array> {
  const response = await download(documentUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download the RAG source PDF from ${documentUrl}. Received ${response.status}.`
    );
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function extractPdfPages(
  pdfBytes: Uint8Array
): Promise<ExtractedPdfPage[]> {
  const pdf = await getDocument({ data: pdfBytes }).promise;
  const pages: ExtractedPdfPage[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let currentLine = "";

    for (const item of textContent.items as Array<{
      hasEOL?: boolean;
      str: string;
    }>) {
      const value = normalizeExtractedLine(item.str);

      if (value.length > 0) {
        currentLine = currentLine ? `${currentLine} ${value}` : value;
      }

      if (item.hasEOL) {
        lines.push(normalizeExtractedLine(currentLine));
        currentLine = "";
      }
    }

    if (currentLine.length > 0) {
      lines.push(normalizeExtractedLine(currentLine));
    }

    const text = lines.filter((line) => line.length > 0).join("\n");

    if (text.length > 0) {
      pages.push({
        pageNumber,
        text,
      });
    }
  }

  return pages;
}
