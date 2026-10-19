import { DocumentChunk } from './types.js';

export interface ChunkingOptions {
  targetChunkSize?: number; // target character count, default 600
  overlap?: number; // character overlap, default 120
  minChunkSize?: number; // minimum chunk size, default 80
}

export function chunkDocument(
  documentId: string,
  text: string,
  pages?: Array<{ pageNumber: number; text: string }>,
  options: ChunkingOptions = {}
): DocumentChunk[] {
  const targetSize = options.targetChunkSize || 600;
  const overlap = options.overlap || 120;
  const minSize = options.minChunkSize || 80;

  const chunks: DocumentChunk[] = [];

  // If pages are provided, chunk page by page to guarantee accurate page citations
  if (pages && pages.length > 0) {
    let globalOffset = 0;
    let chunkIndex = 0;

    for (const page of pages) {
      const pageText = page.text;
      if (!pageText || pageText.trim().length === 0) continue;

      const pageChunks = splitTextIntoChunks(pageText, targetSize, overlap, minSize);
      for (const pc of pageChunks) {
        chunks.push({
          id: `${documentId}_chunk_${chunkIndex}`,
          documentId,
          chunkIndex,
          content: pc.content,
          charStart: globalOffset + pc.start,
          charEnd: globalOffset + pc.end,
          page: page.pageNumber,
          tokenEstimate: Math.ceil(pc.content.length / 4),
        });
        chunkIndex++;
      }
      globalOffset += pageText.length + 1;
    }

    if (chunks.length > 0) {
      return chunks;
    }
  }

  // Otherwise, chunk whole document
  const rawChunks = splitTextIntoChunks(text, targetSize, overlap, minSize);
  return rawChunks.map((rc, idx) => ({
    id: `${documentId}_chunk_${idx}`,
    documentId,
    chunkIndex: idx,
    content: rc.content,
    charStart: rc.start,
    charEnd: rc.end,
    tokenEstimate: Math.ceil(rc.content.length / 4),
  }));
}

interface TextSlice {
  content: string;
  start: number;
  end: number;
}

function splitTextIntoChunks(
  text: string,
  targetSize: number,
  overlap: number,
  minSize: number
): TextSlice[] {
  const slices: TextSlice[] = [];
  const textLength = text.length;

  if (textLength <= targetSize) {
    if (text.trim().length >= minSize) {
      slices.push({ content: text.trim(), start: 0, end: textLength });
    } else if (text.trim().length > 0) {
      // Even small docs get 1 chunk if not completely empty
      slices.push({ content: text.trim(), start: 0, end: textLength });
    }
    return slices;
  }

  let start = 0;

  while (start < textLength) {
    let end = Math.min(start + targetSize, textLength);

    // If not at the end of text, find the best boundary
    if (end < textLength) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + minSize) {
        end = paragraphBreak;
      } else {
        // Look for sentence break (. ! ?)
        const match = text.slice(start, end).match(/[.!?]\s+(?=[A-Z0-9])/g);
        if (match) {
          const lastPeriod = text.slice(start, end).lastIndexOf('. ');
          const lastExclamation = text.slice(start, end).lastIndexOf('! ');
          const lastQuestion = text.slice(start, end).lastIndexOf('? ');
          const sentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
          if (sentenceEnd > minSize) {
            end = start + sentenceEnd + 1;
          } else {
            // Space boundary
            const lastSpace = text.lastIndexOf(' ', end);
            if (lastSpace > start + minSize) {
              end = lastSpace;
            }
          }
        } else {
          // Space boundary
          const lastSpace = text.lastIndexOf(' ', end);
          if (lastSpace > start + minSize) {
            end = lastSpace;
          }
        }
      }
    }

    const chunkContent = text.slice(start, end).trim();
    if (chunkContent.length >= minSize || (end >= textLength && chunkContent.length > 0)) {
      slices.push({
        content: chunkContent,
        start,
        end,
      });
    }

    if (end >= textLength) {
      break;
    }

    // Step forward by (end - overlap)
    start = Math.max(start + 1, end - overlap);
  }

  return slices;
}
