/**
 * CV download utilities
 * PDF  → html2pdf.js (browser-side)
 * Word → docx library
 * Excel → xlsx (SheetJS)
 */

/* ─── PDF ─────────────────────────────────────────────────── */

export async function downloadPDF(containerId: string, filename = 'CV.pdf'): Promise<void> {
  const element = document.getElementById(containerId);
  if (!element) throw new Error(`Element #${containerId} not found`);

  // Dynamically import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin: [10, 10, 10, 10],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(opt).from(element).save();
}

/* ─── Word (.docx) ───────────────────────────────────────── */

export async function downloadWord(cvText: string, filename = 'CV.docx'): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

  const lines = cvText.split('\n').filter(Boolean);

  const children = lines.map((line) => {
    // Lines that look like headings (ALL CAPS or end with ':')
    const isHeading =
      line === line.toUpperCase() && line.trim().length > 3 && !/[a-z]/.test(line);

    if (isHeading) {
      return new Paragraph({
        text: line.trim(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
      });
    }

    if (line.startsWith('•') || line.startsWith('-')) {
      return new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: line.replace(/^[•\-]\s*/, ''), size: 22 })],
      });
    }

    return new Paragraph({
      children: [new TextRun({ text: line.trim(), size: 22 })],
      spacing: { after: 80 },
      alignment: AlignmentType.LEFT,
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}
export function downloadExcel(
  rows: Record<string, string | number>[],
  filename = 'CV.xlsx'
): void {
  // Dynamic import to prevent issues on the server
  const XLSX = require('xlsx');
  
  // Create a worksheet from the data
  const worksheet = XLSX.utils.json_to_sheet(rows);
  
  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CV');
  
  // Write the file and trigger download
  XLSX.writeFile(workbook, filename);
}

/* ─── Helper ────────────────────────────────────────────── */

function triggerDownload(blob: Blob, filename: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
