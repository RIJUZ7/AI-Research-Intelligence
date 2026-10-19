import crypto from 'crypto';
import * as pdfParseModule from 'pdf-parse';
import * as mammothModule from 'mammoth';

const pdfParse = (pdfParseModule as any).default || pdfParseModule;
const mammoth = (mammothModule as any).default || mammothModule;

export interface ExtractedDocument {
  text: string;
  charCount: number;
  pageCount?: number;
  pages?: Array<{ pageNumber: number; text: string }>;
  fileHash: string;
  detectedType: 'pdf' | 'txt' | 'md' | 'csv' | 'json' | 'docx';
}

export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\x00/g, '') // remove null bytes
    .replace(/[\t ]+/g, ' ') // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n') // maximum 2 consecutive newlines
    .trim();
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  filename: string,
  mimetype?: string
): Promise<ExtractedDocument> {
  if (!buffer || buffer.length === 0) {
    throw new Error('Document buffer is empty (0 bytes).');
  }

  const fileHash = computeFileHash(buffer);
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const supportedExts = ['pdf', 'txt', 'md', 'markdown', 'csv', 'json', 'docx'];
  if (!supportedExts.includes(ext) && mimetype !== 'application/pdf') {
    throw new Error(
      `Unsupported file type ".${ext || 'unknown'}". Supported formats are PDF, DOCX, TXT, Markdown, CSV, and JSON.`
    );
  }

  // 1. PDF Extraction
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      const normalized = normalizeText(data.text);
      if (!normalized || normalized.length < 10) {
        throw new Error(
          'PDF contains insufficient or no extractable text. If this is a scanned document, OCR processing would be required.'
        );
      }

      // Try basic page boundary splitting if form feeds or markers exist
      const rawPages = data.text.split(/\f|\n(?=Page\s+\d+)/i);
      const pages = rawPages
        .map((pageText: string, idx: number) => ({
          pageNumber: idx + 1,
          text: normalizeText(pageText),
        }))
        .filter((p: { pageNumber: number; text: string }) => p.text.length > 0);

      return {
        text: normalized,
        charCount: normalized.length,
        pageCount: data.numpages || (pages.length > 0 ? pages.length : 1),
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: normalized }],
        fileHash,
        detectedType: 'pdf',
      };
    } catch (err: any) {
      if (err.message && err.message.includes('OCR')) {
        throw err;
      }
      throw new Error(`Failed to extract text from PDF: ${err.message || 'Malformed or encrypted PDF'}`);
    }
  }

  // 2. DOCX Extraction
  if (ext === 'docx') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const normalized = normalizeText(result.value);
      if (!normalized || normalized.length === 0) {
        throw new Error('DOCX document contains no extractable text.');
      }
      return {
        text: normalized,
        charCount: normalized.length,
        fileHash,
        detectedType: 'docx',
      };
    } catch (err: any) {
      throw new Error(`Failed to extract text from DOCX: ${err.message || 'Corrupted or encrypted DOCX file'}`);
    }
  }

  // 3. Markdown
  if (ext === 'md' || ext === 'markdown') {
    const raw = buffer.toString('utf-8');
    const text = normalizeText(raw);
    if (!text || text.length === 0) {
      throw new Error('Markdown document contains no text.');
    }
    return {
      text,
      charCount: text.length,
      fileHash,
      detectedType: 'md',
    };
  }

  // 4. CSV Dataset
  if (ext === 'csv') {
    const raw = buffer.toString('utf-8');
    const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('CSV file is empty.');
    }

    // Parse CSV line preserving quotes
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += c;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      return values;
    };

    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    let formatted = `CSV Dataset (${headers.join(', ')}):\n\n`;
    rows.forEach((r, idx) => {
      formatted += `Record #${idx + 1}: ` + headers.map((h, i) => `${h}: ${r[i] || 'N/A'}`).join(' | ') + '\n';
    });

    const text = normalizeText(formatted);
    if (!text || text.length === 0) {
      throw new Error('CSV document contains no extractable data.');
    }
    return {
      text,
      charCount: text.length,
      fileHash,
      detectedType: 'csv',
    };
  }

  // 5. JSON
  if (ext === 'json') {
    const raw = buffer.toString('utf-8');
    try {
      const parsed = JSON.parse(raw);
      const text = normalizeText(JSON.stringify(parsed, null, 2));
      if (!text || text.length === 0) {
        throw new Error('JSON document is empty.');
      }
      return {
        text,
        charCount: text.length,
        fileHash,
        detectedType: 'json',
      };
    } catch (err: any) {
      throw new Error(`Invalid JSON file format: ${err.message}`);
    }
  }

  // 6. Plain Text (.txt)
  const raw = buffer.toString('utf-8');
  const text = normalizeText(raw);
  if (!text || text.length === 0) {
    throw new Error('Text document is empty or contains no readable characters.');
  }

  return {
    text,
    charCount: text.length,
    fileHash,
    detectedType: 'txt',
  };
}
