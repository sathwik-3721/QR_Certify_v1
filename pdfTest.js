import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Path to the certificate image
const certificateImagePath = path.resolve('./certificate-bg2.png');

async function generatePDF(data) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed the Roboto font
  const robotoFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Add a new page with landscape orientation
  const page = pdfDoc.addPage([842, 595]); // A4 size: [width, height]

  // Set the background image
  const imageBuffer = fs.readFileSync(certificateImagePath);
  const backgroundImage = await pdfDoc.embedJpg(imageBuffer);

  page.drawImage(backgroundImage, {
    x: 0,
    y: 0,
    width: page.getWidth(),
    height: page.getHeight(),
  });

  // Draw name
  page.drawText(data.name, {
    x: page.getWidth() / 2 - robotoFont.widthOfTextAtSize(data.name, 30) / 2,
    y: 400,
    size: 30,
    font: robotoFont,
    color: rgb(0, 0, 0),
  });

  // Draw certificate content
  const content = [
    'Attended',
    `${data.event}`,
    "at Digital Summit'24 from December 19-21st, 2024 at Miracle City",
    'Visakhapatnam (AP)',
  ];

  let yPosition = 350;
  for (const line of content) {
    page.drawText(line, {
      x: page.getWidth() / 2 - robotoFont.widthOfTextAtSize(line, 16) / 2,
      y: yPosition,
      size: 16,
      font: robotoFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20; // Adjust the line spacing
  }

  // Draw footer
  page.drawText('"Cloud", "Cognitive", "Blockchain", "IoT", "Machine Learning"', {
    x: page.getWidth() / 2 - robotoFont.widthOfTextAtSize(
      '"Cloud", "Cognitive", "Blockchain", "IoT", "Machine Learning"',
      12
    ) / 2,
    y: 50,
    size: 12,
    font: robotoFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('output.pdf', pdfBytes);

  console.log('PDF generated successfully!');
}

// Example data for the certificate
const data = {
  name: 'John Doe',
  event: 'AI and Innovation Workshop',
};

// Call the function to generate the PDF
generatePDF(data);
