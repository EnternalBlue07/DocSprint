import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  page.drawText('DocSprint Dummy Verification PDF for Compression Testing', {
    x: 50,
    y: 350,
    size: 16,
  });
  
  // Add some dummy pages
  for (let i = 0; i < 3; i++) {
    const p = pdfDoc.addPage([600, 400]);
    p.drawText(`Page ${i + 2} content goes here for testing compression.`, {
      x: 50,
      y: 300,
      size: 14,
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('sample.pdf', pdfBytes);
  console.log('sample.pdf created successfully!');
}

createPdf();
