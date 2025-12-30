import { jsPDF } from 'jspdf';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  references?: Array<{
    title: string;
    source: string;
    category: string;
  }>;
}

export async function exportConversationToPDF(
  messages: Message[],
  conversationTitle: string = 'محادثة جديدة'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add Arabic font support (using default font for now)
  doc.setFont('helvetica');
  doc.setFontSize(16);
  doc.setR2L(true); // Enable right-to-left text

  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;

  // Title
  doc.setFontSize(18);
  doc.text(conversationTitle, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 15;

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(date, pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 10;

  // Reset color
  doc.setTextColor(0, 0, 0);

  // Process messages
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    // Message header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const header = message.role === 'user' ? 'المستخدم:' : 'النموذج:';
    doc.text(header, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 7;

    // Message content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Split text into lines
    const lines = doc.splitTextToSize(message.content, maxWidth);
    for (const line of lines) {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Add references if available
    if (message.references && message.references.length > 0) {
      yPosition += 5;
      
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`المراجع المستخدمة (${message.references.length}):`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      for (const ref of message.references) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }

        const refText = `• ${ref.title} - ${ref.source} [${ref.category}]`;
        const refLines = doc.splitTextToSize(refText, maxWidth - 5);
        for (const line of refLines) {
          doc.text(line, pageWidth - margin - 3, yPosition, { align: 'right' });
          yPosition += 5;
        }
      }

      doc.setTextColor(0, 0, 0);
    }

    yPosition += 10; // Space between messages
  }

  // Footer on last page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `صفحة ${i} من ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `${conversationTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}
