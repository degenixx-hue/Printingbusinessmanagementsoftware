import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format currency consistently
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Helper function to convert number to words (Indian numbering system)
export const convertNumberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  if (num === 0) return 'Zero Rupees Only';
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);
  
  let result = '';
  if (crore) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remainder) result += convertLessThanThousand(remainder);
  
  return result.trim() + ' Rupees Only';
};

// Generate Quotation PDF
export const generateQuotationPDF = (quotation: any, client: any, companySettings: any): jsPDF => {
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Add logo if available
  if (companySettings.logo) {
    const img = new Image();
    img.src = companySettings.logo;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const maxLogoHeight = 20;
    const maxLogoWidth = 40;
    
    let logoWidth = maxLogoWidth;
    let logoHeight = maxLogoHeight;
    
    const aspectRatio = imgWidth / imgHeight;
    if (aspectRatio > (maxLogoWidth / maxLogoHeight)) {
      logoWidth = maxLogoWidth;
      logoHeight = maxLogoWidth / aspectRatio;
    } else {
      logoHeight = maxLogoHeight;
      logoWidth = maxLogoHeight * aspectRatio;
    }
    
    doc.addImage(companySettings.logo, 'PNG', margin, margin, logoWidth, logoHeight);
  }

  // Company details
  doc.setFontSize(7);
  doc.setTextColor(51, 51, 51);
  const phone = companySettings.contactNumber || '';
  const email = companySettings.email || '';
  const address = companySettings.address || '';
  
  doc.text(phone, pageWidth - margin, margin + 3, { align: 'right' });
  doc.text(email, pageWidth - margin, margin + 7, { align: 'right' });
  
  const addressLines = doc.splitTextToSize(address, 70);
  let addressY = margin + 11;
  addressLines.forEach((line: string) => {
    doc.text(line, pageWidth - margin, addressY, { align: 'right' });
    addressY += 3;
  });

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth / 2, margin + 32, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 20, margin + 33, pageWidth / 2 + 20, margin + 33);

  // Client details
  let clientY = margin + 42;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('To,', margin, clientY);
  clientY += 3;
  doc.setFont('helvetica', 'bold');
  doc.text(client?.companyName || '', margin, clientY);
  clientY += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  const clientAddress = client?.address || '';
  const clientAddressLines = doc.splitTextToSize(clientAddress, 70);
  clientAddressLines.forEach((line: string) => {
    doc.text(line, margin, clientY);
    clientY += 3;
  });
  
  doc.text(`Phone: ${client?.contactNumber || ''}`, margin, clientY);
  clientY += 3;
  doc.text(`Email: ${client?.email || ''}`, margin, clientY);
  clientY += 3;
  doc.text(`GST: ${client?.gst || ''}`, margin, clientY);

  // Quotation info
  let infoY = margin + 42;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Quotation No:', pageWidth / 2 + 10, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.quotationNumber, pageWidth - margin, infoY, { align: 'right' });
  infoY += 3;
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', pageWidth / 2 + 10, infoY);
  doc.text(new Date(quotation.createdAt).toLocaleDateString('en-IN'), pageWidth - margin, infoY, { align: 'right' });

  // Product table
  const tableBody = quotation.items.map((item: any, index: number) => {
    let specs = '';
    
    // Check if this is a creative quotation item
    if (item.digitalCreative && item.creativePackageType) {
      // Creative package format
      const packageIcon = item.creativePackageType === 'Festive' ? '🎉' : '📢';
      const dateFrom = item.creativeDateFrom ? new Date(item.creativeDateFrom).toLocaleDateString('en-IN') : '';
      const dateTo = item.creativeDateTo ? new Date(item.creativeDateTo).toLocaleDateString('en-IN') : '';
      specs = `${packageIcon} Package Type: ${item.creativePackageType} • Period: ${dateFrom} to ${dateTo}${item.designCount ? ` • Designs: ${item.designCount}` : ''}`;
    } else {
      // Regular printing product format
      specs = `Type: ${item.productName} • Size: ${item.coverPageQuantity > 0 ? 'Custom' : 'Standard'} • Paper: Art ${item.coverPageGsm > 0 ? item.coverPageGsm : 300}\nPages: ${item.coverPageQuantity + item.innerPageQuantity} • Lamination: ${item.laminationType} • Binding: Perfect • UV: ${item.uv ? 'Yes' : 'No'}`;
    }
    
    return [
      index + 1,
      {
        content: `${item.productName}\n${specs}`,
        styles: { fontSize: 6, cellPadding: 1.5, textColor: [80, 80, 80] }
      },
      item.pricePerUnit.toFixed(2),
      item.quantity,
      item.amount.toFixed(2),
    ];
  });

  const discountAmount = quotation.discountValue && quotation.discountValue > 0
    ? (quotation.discountType === 'percentage'
        ? quotation.subtotal * (quotation.discountValue / 100)
        : quotation.discountValue)
    : 0;

  const tableStartY = Math.max(clientY + 6, margin + 70);

  (doc as any).autoTable({
    startY: tableStartY,
    head: [[
      { content: 'SL', styles: { halign: 'center', fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Item Description', styles: { fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Price', styles: { halign: 'right', fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Qty', styles: { halign: 'center', fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Total', styles: { halign: 'right', fillColor: [248, 249, 250], fontSize: 7 } }
    ]],
    body: tableBody,
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontSize: 7 },
      1: { cellWidth: 90, fontSize: 6 },
      2: { cellWidth: 23, halign: 'right', fontSize: 7 },
      3: { cellWidth: 15, halign: 'center', fontSize: 7 },
      4: { cellWidth: 28, halign: 'right', fontSize: 7 },
    },
    headStyles: {
      fillColor: [248, 249, 250],
      textColor: [51, 51, 51],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 6,
      textColor: [51, 51, 51],
      cellPadding: 1.5,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', margin, finalY);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 139);
  const amountInWords = convertNumberToWords(quotation.totalAmount);
  doc.text(amountInWords, margin, finalY + 3);

  // Summary - Aligned with Total column from table
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(7);
  let summaryY = finalY;
  
  // Calculate positions to align with table's Total column
  // Total column width = 28, starts at: margin + 8 + 90 + 23 + 15 = 136
  const totalColumnStartX = margin + 8 + 90 + 23 + 15; // 146mm
  const totalColumnEndX = totalColumnStartX + 28; // 174mm
  const summaryLabelX = totalColumnStartX - 45; // Start labels 45mm before Total column
  const summaryAmountX = totalColumnEndX; // Align amounts with Total column right edge
  
  doc.text('Subtotal:', summaryLabelX, summaryY);
  doc.text(quotation.subtotal.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
  
  summaryY += 3.5;
  if (discountAmount > 0) {
    doc.text(`Discount ${quotation.discountType === 'percentage' ? `(${quotation.discountValue}%)` : ''}:`, summaryLabelX, summaryY);
    doc.text(`- ${discountAmount.toFixed(2)}`, summaryAmountX, summaryY, { align: 'right' });
    summaryY += 3.5;
  }
  
  if (quotation.includeGst) {
    const cgst = quotation.gstAmount / 2;
    const sgst = quotation.gstAmount / 2;
    doc.text(`CGST (${(quotation.gstPercentage / 2).toFixed(1)}%):`, summaryLabelX, summaryY);
    doc.text(cgst.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
    summaryY += 3.5;
    doc.text(`SGST (${(quotation.gstPercentage / 2).toFixed(1)}%):`, summaryLabelX, summaryY);
    doc.text(sgst.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
    summaryY += 3.5;
  }
  
  doc.setFillColor(220, 53, 69);
  doc.rect(summaryLabelX - 2, summaryY - 3, (summaryAmountX - summaryLabelX + 6), 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Gross Amount:', summaryLabelX, summaryY);
  doc.text(quotation.totalAmount.toFixed(2), summaryAmountX, summaryY, { align: 'right' });

  // Account details
  summaryY += 10;
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Account Details', margin, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  const accountDetails = [
    ['Bank Name:', companySettings.bankName || 'N/A'],
    ['Account Number:', companySettings.accountNumber || 'N/A'],
    ['IFSC Code:', companySettings.ifscCode || 'N/A'],
  ];
  
  summaryY += 4;
  accountDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 28, summaryY);
    summaryY += 3;
  });

  // Terms
  summaryY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Terms & Conditions', margin, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  
  const terms = [
    '• All prices are in INR and inclusive of taxes unless specified. Payment: 50% advance, 50% on delivery.',
    '• Delivery timeline confirmed upon order. Quotation valid for 30 days. No cancellation after final approval.',
    '• Goods once sold will not be taken back or exchanged. All disputes subject to local jurisdiction.',
  ];
  
  summaryY += 4;
  terms.forEach(term => {
    const termLines = doc.splitTextToSize(term, contentWidth - 2);
    termLines.forEach((line: string) => {
      doc.text(line, margin, summaryY);
      summaryY += 3;
    });
  });

  summaryY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorised Signature', pageWidth - margin, summaryY, { align: 'right' });

  return doc;
};

// Generate Job Sheet PDF
export const generateJobSheetPDF = (jobSheet: any, client: any, product: any, companySettings: any): jsPDF => {
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const pageWidth = 210;
  const margin = 15;

  // Logo
  if (companySettings.logo) {
    const img = new Image();
    img.src = companySettings.logo;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const maxLogoHeight = 20;
    const maxLogoWidth = 40;
    
    let logoWidth = maxLogoWidth;
    let logoHeight = maxLogoHeight;
    
    const aspectRatio = imgWidth / imgHeight;
    if (aspectRatio > (maxLogoWidth / maxLogoHeight)) {
      logoWidth = maxLogoWidth;
      logoHeight = maxLogoWidth / aspectRatio;
    } else {
      logoHeight = maxLogoHeight;
      logoWidth = maxLogoHeight * aspectRatio;
    }
    
    doc.addImage(companySettings.logo, 'PNG', margin, margin, logoWidth, logoHeight);
  }

  // Company details
  doc.setFontSize(7);
  doc.setTextColor(51, 51, 51);
  doc.text(companySettings.contactNumber || '', pageWidth - margin, margin + 3, { align: 'right' });
  doc.text(companySettings.email || '', pageWidth - margin, margin + 7, { align: 'right' });

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('JOB SHEET', pageWidth / 2, margin + 32, { align: 'center' });

  // Job Sheet details
  let yPos = margin + 42;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  doc.text('Job Sheet No:', margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(jobSheet.jobSheetNumber, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', margin, yPos);
  doc.text(new Date(jobSheet.createdAt).toLocaleDateString('en-IN'), pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.text('Client:', margin, yPos);
  doc.text(client?.companyName || '', pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.text('Product:', margin, yPos);
  doc.text(product?.productName || '', pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.text('Quantity:', margin, yPos);
  doc.text(jobSheet.quantity.toString(), pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.text('Status:', margin, yPos);
  doc.text(jobSheet.status, pageWidth - margin, yPos, { align: 'right' });
  yPos += 10;

  // Specifications
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Specifications:', margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const specs = [
    ['Cover Pages:', `${jobSheet.specifications.coverPageQuantity} (${jobSheet.specifications.coverPageGsm} GSM)`],
    ['Inner Pages:', `${jobSheet.specifications.innerPageQuantity} (${jobSheet.specifications.innerPageGsm} GSM)`],
    ['Lamination:', jobSheet.specifications.laminationType],
    ['UV Coating:', jobSheet.specifications.uv ? 'Yes' : 'No'],
    ['Gold Foiling:', jobSheet.specifications.goldFoiling ? 'Yes' : 'No'],
  ];

  specs.forEach(([label, value]) => {
    doc.text(label, margin, yPos);
    doc.text(value, pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;
  });

  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Process Status:', margin, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const processStatus = [
    ['Printing:', jobSheet.processStatus.printing ? '✓ Completed' : '○ Pending'],
    ['Lamination:', jobSheet.processStatus.lamination ? '✓ Completed' : '○ Pending'],
    ['Creasing & Pinning:', jobSheet.processStatus.creasingAndPinning ? '✓ Completed' : '○ Pending'],
    ['Ready to Deliver:', jobSheet.processStatus.readyToDeliver ? '✓ Completed' : '○ Pending'],
  ];

  processStatus.forEach(([label, value]) => {
    doc.text(label, margin, yPos);
    doc.text(value, pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;
  });

  return doc;
};

// Generate Bill PDF
export const generateBillPDF = (bill: any, client: any, companySettings: any): jsPDF => {
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Logo
  if (companySettings.logo) {
    const img = new Image();
    img.src = companySettings.logo;
    const imgWidth = img.width;
    const imgHeight = img.height;
    const maxLogoHeight = 20;
    const maxLogoWidth = 40;
    
    let logoWidth = maxLogoWidth;
    let logoHeight = maxLogoHeight;
    
    const aspectRatio = imgWidth / imgHeight;
    if (aspectRatio > (maxLogoWidth / maxLogoHeight)) {
      logoWidth = maxLogoWidth;
      logoHeight = maxLogoWidth / aspectRatio;
    } else {
      logoHeight = maxLogoHeight;
      logoWidth = maxLogoHeight * aspectRatio;
    }
    
    doc.addImage(companySettings.logo, 'PNG', margin, margin, logoWidth, logoHeight);
  }

  // Company details
  doc.setFontSize(7);
  doc.setTextColor(51, 51, 51);
  const phone = companySettings.contactNumber || '';
  const email = companySettings.email || '';
  const address = companySettings.address || '';
  
  doc.text(phone, pageWidth - margin, margin + 3, { align: 'right' });
  doc.text(email, pageWidth - margin, margin + 7, { align: 'right' });
  
  const addressLines = doc.splitTextToSize(address, 70);
  let addressY = margin + 11;
  addressLines.forEach((line: string) => {
    doc.text(line, pageWidth - margin, addressY, { align: 'right' });
    addressY += 3;
  });

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.includeGst ? 'TAX INVOICE' : 'INVOICE', pageWidth / 2, margin + 32, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 20, margin + 33, pageWidth / 2 + 20, margin + 33);

  // Client details
  let clientY = margin + 42;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('To,', margin, clientY);
  clientY += 3;
  doc.setFont('helvetica', 'bold');
  doc.text(client?.companyName || '', margin, clientY);
  clientY += 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  const clientAddress = client?.address || '';
  const clientAddressLines = doc.splitTextToSize(clientAddress, 70);
  clientAddressLines.forEach((line: string) => {
    doc.text(line, margin, clientY);
    clientY += 3;
  });
  
  doc.text(`Phone: ${client?.contactNumber || ''}`, margin, clientY);
  clientY += 3;
  doc.text(`Email: ${client?.email || ''}`, margin, clientY);
  clientY += 3;
  if (bill.includeGst) {
    doc.text(`GST: ${client?.gst || ''}`, margin, clientY);
    clientY += 3;
  }

  // Bill info
  let infoY = margin + 42;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Bill No:', pageWidth / 2 + 10, infoY);
  doc.setFont('helvetica', 'bold');
  doc.text(bill.billNumber, pageWidth - margin, infoY, { align: 'right' });
  infoY += 3;
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', pageWidth / 2 + 10, infoY);
  doc.text(new Date(bill.createdAt).toLocaleDateString('en-IN'), pageWidth - margin, infoY, { align: 'right' });

  // Product table
  const tableBody = bill.items.map((item: any, index: number) => {
    return [
      index + 1,
      item.description,
      item.rate.toFixed(2),
      item.quantity,
      item.amount.toFixed(2),
    ];
  });

  const discountAmount = bill.discountValue && bill.discountValue > 0
    ? (bill.discountType === 'percentage'
        ? bill.subtotal * (bill.discountValue / 100)
        : bill.discountValue)
    : 0;

  const tableStartY = Math.max(clientY + 6, margin + 70);

  (doc as any).autoTable({
    startY: tableStartY,
    head: [[
      { content: 'SL', styles: { halign: 'center', fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Item Description', styles: { fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Price', styles: { halign: 'right', fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Qty', styles: { halign: 'center', fillColor: [248, 249, 250], fontSize: 7 } },
      { content: 'Total', styles: { halign: 'right', fillColor: [248, 249, 250], fontSize: 7 } }
    ]],
    body: tableBody,
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontSize: 7 },
      1: { cellWidth: 90, fontSize: 7 },
      2: { cellWidth: 23, halign: 'right', fontSize: 7 },
      3: { cellWidth: 15, halign: 'center', fontSize: 7 },
      4: { cellWidth: 28, halign: 'right', fontSize: 7 },
    },
    headStyles: {
      fillColor: [248, 249, 250],
      textColor: [51, 51, 51],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 1.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 51, 51],
      cellPadding: 1.5,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount in Words:', margin, finalY);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 139);
  const amountInWords = convertNumberToWords(bill.totalAmount);
  doc.text(amountInWords, margin, finalY + 3);

  // Summary - Aligned with Total column from table
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(7);
  let summaryY = finalY;
  
  // Calculate positions to align with table's Total column
  // Total column width = 28, starts at: margin + 8 + 90 + 23 + 15 = 136
  const totalColumnStartX = margin + 8 + 90 + 23 + 15; // 146mm
  const totalColumnEndX = totalColumnStartX + 28; // 174mm
  const summaryLabelX = totalColumnStartX - 45; // Start labels 45mm before Total column
  const summaryAmountX = totalColumnEndX; // Align amounts with Total column right edge
  
  doc.text('Subtotal:', summaryLabelX, summaryY);
  doc.text(bill.subtotal.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
  
  summaryY += 3.5;
  if (discountAmount > 0) {
    doc.text(`Discount ${bill.discountType === 'percentage' ? `(${bill.discountValue}%)` : ''}:`, summaryLabelX, summaryY);
    doc.text(`- ${discountAmount.toFixed(2)}`, summaryAmountX, summaryY, { align: 'right' });
    summaryY += 3.5;
  }
  
  if (bill.includeGst) {
    const cgst = bill.gstAmount / 2;
    const sgst = bill.gstAmount / 2;
    doc.text(`CGST (${(bill.gstPercentage / 2).toFixed(1)}%):`, summaryLabelX, summaryY);
    doc.text(cgst.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
    summaryY += 3.5;
    doc.text(`SGST (${(bill.gstPercentage / 2).toFixed(1)}%):`, summaryLabelX, summaryY);
    doc.text(sgst.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
    summaryY += 3.5;
  }
  
  doc.setFillColor(220, 53, 69);
  doc.rect(summaryLabelX - 2, summaryY - 3, (summaryAmountX - summaryLabelX + 6), 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Gross Amount:', summaryLabelX, summaryY);
  doc.text(bill.totalAmount.toFixed(2), summaryAmountX, summaryY, { align: 'right' });

  summaryY += 7;
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Advance Received:', summaryLabelX, summaryY);
  doc.text(bill.advanceReceived.toFixed(2), summaryAmountX, summaryY, { align: 'right' });
  summaryY += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Balance Amount:', summaryLabelX, summaryY);
  doc.text(bill.balanceAmount.toFixed(2), summaryAmountX, summaryY, { align: 'right' });

  // Account details
  summaryY += 8;
  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Account Details', margin, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  
  const accountDetails = [
    ['Bank Name:', companySettings.bankName || 'N/A'],
    ['Account Number:', companySettings.accountNumber || 'N/A'],
    ['IFSC Code:', companySettings.ifscCode || 'N/A'],
  ];
  
  summaryY += 4;
  accountDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, summaryY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 28, summaryY);
    summaryY += 3;
  });

  // Terms
  summaryY += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Terms & Conditions', margin, summaryY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  
  const terms = [
    '• All prices in INR, inclusive of taxes. Balance due on/before delivery. No returns/exchanges.',
    '• Check all items before accepting. All disputes subject to local jurisdiction only.',
  ];
  
  summaryY += 4;
  terms.forEach(term => {
    const termLines = doc.splitTextToSize(term, contentWidth - 2);
    termLines.forEach((line: string) => {
      doc.text(line, margin, summaryY);
      summaryY += 3;
    });
  });

  summaryY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Authorised Signature', pageWidth - margin, summaryY, { align: 'right' });

  return doc;
};

// Generate All Transactions Ledger PDF
export const generateLedgerPDF = (transactions: any[]): void => {
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT LEDGER - ALL TRANSACTIONS', pageWidth / 2, margin + 10, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 17, { align: 'center' });

  // Table
  const tableData = transactions.map(t => [
    t.Date,
    t.Client,
    t.Type,
    t.Description,
    t.Debit > 0 ? `Rs. ${formatCurrency(t.Debit)}` : '-',
    t.Credit > 0 ? `Rs. ${formatCurrency(t.Credit)}` : '-',
    `Rs. ${formatCurrency(t.Balance)}`,
  ]);

  (doc as any).autoTable({
    startY: margin + 25,
    head: [['Date', 'Client', 'Type', 'Description', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [26, 43, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Calculate totals
  const totalDebit = transactions.reduce((sum, t) => sum + (t.Debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.Credit || 0), 0);
  const netBalance = totalCredit - totalDebit;

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Debit: Rs. ${formatCurrency(totalDebit)}`, margin, finalY);
  doc.text(`Total Credit: Rs. ${formatCurrency(totalCredit)}`, margin, finalY + 7);
  doc.text(`Net Balance: Rs. ${formatCurrency(Math.abs(netBalance))} ${netBalance < 0 ? '(Outstanding)' : '(Advance)'}`, margin, finalY + 14);

  // Open print dialog
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

// Generate Client Ledger PDF
export const generateClientLedgerPDF = (transactions: any[], clientName: string): void => {
  const doc = new jsPDF({
    putOnlyUsedFonts: true,
    compress: true
  });
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT LEDGER', pageWidth / 2, margin + 10, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, pageWidth / 2, margin + 17, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 23, { align: 'center' });

  // Table
  const tableData = transactions.map(t => [
    t.Date,
    t.Type,
    t.Description,
    t.Debit > 0 ? `Rs. ${formatCurrency(t.Debit)}` : '-',
    t.Credit > 0 ? `Rs. ${formatCurrency(t.Credit)}` : '-',
    `Rs. ${formatCurrency(t.Balance)}`,
  ]);

  (doc as any).autoTable({
    startY: margin + 30,
    head: [['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [26, 43, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Calculate totals
  const totalDebit = transactions.reduce((sum, t) => sum + (t.Debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.Credit || 0), 0);
  const finalBalance = transactions.length > 0 ? transactions[transactions.length - 1].Balance : 0;

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Debit: Rs. ${formatCurrency(totalDebit)}`, margin, finalY);
  doc.text(`Total Credit: Rs. ${formatCurrency(totalCredit)}`, margin, finalY + 7);
  doc.text(`Current Balance: Rs. ${formatCurrency(Math.abs(finalBalance))} ${finalBalance < 0 ? '(Outstanding)' : '(Advance)'}`, margin, finalY + 14);

  // Open print dialog
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};