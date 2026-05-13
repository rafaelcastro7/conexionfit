import * as pdfjs from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/** Extrae texto plano del PDF (útil si la planilla se generó desde Word/Excel con capa de texto). Las escaneadas a mano suelen devolver poco o nada. */
export async function extractTextFromPdf(data: ArrayBuffer): Promise<string> {
  const pdf = await pdfjs.getDocument({ data }).promise;
  const chunks: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    for (const item of content.items) {
      const anyItem = item as { str?: string; hasEOL?: boolean };
      if (typeof anyItem.str === 'string') {
        chunks.push(anyItem.str);
        if (anyItem.hasEOL) chunks.push('\n');
        else chunks.push(' ');
      }
    }
    chunks.push('\n');
  }
  return chunks.join('').replace(/\n{3,}/g, '\n\n').trim();
}
