const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorTypes');

class ExportService {
  constructor() {
    this.exportBaseDir = path.join(__dirname, '../../exports');
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      logger.info(`Directory ensured: ${dirPath}`);
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}: ${error.message}`);
      throw new AppError('Failed to create export directory', 500);
    }
  }

  generateSafeFilename(invoiceNumber, extension) {
    const safeInvoiceNumber = (invoiceNumber || 'invoice')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    const timestamp = Date.now();
    return `invoice_${safeInvoiceNumber}_${timestamp}.${extension}`;
  }

  /**
   * ✅ FIXED: Export invoice to PDF without empty pages
   */
  async exportToPDF(invoice, filePath) {
    return new Promise(async (resolve, reject) => {
      try {
        const directory = path.dirname(filePath);
        await this.ensureDirectory(directory);

        // ✅ CRITICAL FIX: Set bufferPages to false to prevent empty pages
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          bufferPages: false, // ✅ This prevents empty pages
          autoFirstPage: true,
          info: {
            Title: `Invoice ${invoice.invoiceNumber || invoice._id}`,
            Author: 'Invoice OCR System',
            Subject: 'Invoice',
            CreationDate: new Date()
          }
        });

        const stream = fsSync.createWriteStream(filePath);
        doc.pipe(stream);

        // Colors
        const primary = '#2563eb';
        const secondary = '#64748b';
        const border = '#e2e8f0';
        const success = '#10b981';
        const warning = '#f59e0b';
        const error = '#ef4444';

        // Page dimensions
        const pageWidth = doc.page.width - 80; // 40px margin on each side
        const leftMargin = 40;
        const rightMargin = doc.page.width - 40;

        // Track current Y position
        let currentY = 60;

        // ============================================
        // HEADER SECTION
        // ============================================
        doc
          .fontSize(24)
          .fillColor(primary)
          .font('Helvetica-Bold')
          .text('INVOICE', leftMargin, currentY, { align: 'center', width: pageWidth });

        currentY += 40;

        // Invoice Number & Date
        doc
          .fontSize(10)
          .fillColor(secondary)
          .font('Helvetica')
          .text('Invoice Number:', leftMargin, currentY)
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text(invoice.invoiceNumber || 'N/A', leftMargin + 100, currentY);

        doc
          .font('Helvetica')
          .fillColor(secondary)
          .text('Invoice Date:', leftMargin + 300, currentY)
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text(
            invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A',
            leftMargin + 380,
            currentY
          );

        currentY += 30;

        // Divider
        doc
          .moveTo(leftMargin, currentY)
          .lineTo(rightMargin, currentY)
          .strokeColor(border)
          .stroke();

        currentY += 20;

        // ============================================
        // COMPANY INFORMATION
        // ============================================
        if (invoice.companyName) {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#000')
            .text('COMPANY INFORMATION', leftMargin, currentY);

          currentY += 20;

          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(invoice.companyName, leftMargin, currentY);

          currentY += 15;

          if (invoice.contact?.phone) {
            doc
              .font('Helvetica')
              .fillColor(secondary)
              .text(`Phone: ${invoice.contact.phone}`, leftMargin, currentY);
            currentY += 15;
          }

          if (invoice.contact?.email) {
            doc
              .fillColor(primary)
              .text(`Email: ${invoice.contact.email}`, leftMargin, currentY);
            currentY += 15;
          }

          if (invoice.contact?.address) {
            doc
              .fillColor(secondary)
              .text(`Address: ${invoice.contact.address}`, leftMargin, currentY, {
                width: pageWidth,
              });
            currentY += 15;
          }

          currentY += 10;
        }

        // ============================================
        // FINANCIAL DETAILS
        // ============================================
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text('FINANCIAL DETAILS', leftMargin, currentY);

        currentY += 20;

        // Amount Box
        doc
          .roundedRect(leftMargin, currentY, pageWidth, 70, 5)
          .fillAndStroke('#f8fafc', border);

        currentY += 15;

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(secondary)
          .text('Subtotal:', leftMargin + 20, currentY);

        doc
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text(
            `${invoice.currency || 'USD'} ${(invoice.subtotal || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            leftMargin + 200,
            currentY
          );

        currentY += 20;

        doc
          .font('Helvetica')
          .fillColor(secondary)
          .text('Tax:', leftMargin + 20, currentY);

        doc
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text(
            `${invoice.currency || 'USD'} ${(invoice.taxAmount || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            leftMargin + 200,
            currentY
          );

        currentY += 25;

        // Divider line
        doc
          .moveTo(leftMargin + 20, currentY)
          .lineTo(rightMargin - 20, currentY)
          .strokeColor(border)
          .stroke();

        currentY += 10;

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(primary)
          .text('Total Amount:', leftMargin + 20, currentY);

        doc
          .fontSize(14)
          .text(
            `${invoice.currency || 'USD'} ${(invoice.totalAmount || 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            leftMargin + 200,
            currentY
          );

        currentY += 40;

        // ============================================
        // ADDITIONAL INFORMATION
        // ============================================
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000')
          .text('ADDITIONAL INFORMATION', leftMargin, currentY);

        currentY += 20;

        doc.fontSize(10).font('Helvetica');

        if (invoice.dueDate) {
          doc
            .fillColor(secondary)
            .text('Due Date:', leftMargin, currentY)
            .fillColor('#000')
            .text(new Date(invoice.dueDate).toLocaleDateString(), leftMargin + 100, currentY);
          currentY += 15;
        }

        if (invoice.poNumber) {
          doc
            .fillColor(secondary)
            .text('PO Number:', leftMargin, currentY)
            .fillColor('#000')
            .text(invoice.poNumber, leftMargin + 100, currentY);
          currentY += 15;
        }

        // Status Badge
        const statusColor =
          invoice.status === 'processed' || invoice.status === 'validated'
            ? success
            : invoice.status === 'pending'
            ? warning
            : error;

        doc
          .fillColor(secondary)
          .text('Status:', leftMargin, currentY);

        doc
          .fillColor(statusColor)
          .text(invoice.status ? invoice.status.toUpperCase() : 'N/A', leftMargin + 100, currentY);

        currentY += 15;

        if (invoice.validation?.isValid !== undefined) {
          doc
            .fillColor(secondary)
            .text('Validated:', leftMargin, currentY)
            .fillColor(invoice.validation.isValid ? success : error)
            .text(invoice.validation.isValid ? 'Yes' : 'No', leftMargin + 100, currentY);
          currentY += 15;
        }

        // ============================================
        // FOOTER (Fixed at bottom)
        // ============================================
        const footerY = doc.page.height - 60;

        doc
          .moveTo(leftMargin, footerY)
          .lineTo(rightMargin, footerY)
          .strokeColor(border)
          .stroke();

        doc
          .fontSize(8)
          .fillColor(secondary)
          .text(
            'This document was automatically generated by Invoice OCR System',
            leftMargin,
            footerY + 15,
            { width: pageWidth, align: 'center' }
          );

        doc.text(`Generated on ${new Date().toLocaleString()}`, leftMargin, footerY + 28, {
          width: pageWidth,
          align: 'center',
        });

        // ✅ CRITICAL: End document immediately after content
        doc.end();

        stream.on('finish', () => {
          logger.info(`✅ PDF export completed: ${filePath}`);
          resolve(filePath);
        });

        stream.on('error', (error) => {
          logger.error(`❌ PDF stream error: ${error.message}`);
          reject(error);
        });

      } catch (error) {
        logger.error(`❌ PDF export error: ${error.message}`);
        reject(new AppError('Failed to export to PDF', 500));
      }
    });
  }

  /**
   * Export invoices to Excel
   */
  async exportToExcel(invoices, filePath) {
    try {
      const directory = path.dirname(filePath);
      await this.ensureDirectory(directory);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoices');

      worksheet.columns = [
        { header: 'Invoice Number', key: 'invoiceNumber', width: 20 },
        { header: 'Date', key: 'invoiceDate', width: 15 },
        { header: 'Company', key: 'companyName', width: 30 },
        { header: 'Amount', key: 'totalAmount', width: 15 },
        { header: 'Currency', key: 'currency', width: 10 },
        { header: 'Tax', key: 'taxAmount', width: 15 },
        { header: 'Subtotal', key: 'subtotal', width: 15 },
        { header: 'Due Date', key: 'dueDate', width: 15 },
        { header: 'PO Number', key: 'poNumber', width: 15 },
        { header: 'Phone', key: 'phone', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Quality Score', key: 'qualityScore', width: 15 },
        { header: 'Created', key: 'createdAt', width: 20 },
      ];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      invoices.forEach((invoice) => {
        worksheet.addRow({
          invoiceNumber: invoice.invoiceNumber || 'N/A',
          invoiceDate: invoice.invoiceDate
            ? new Date(invoice.invoiceDate).toLocaleDateString()
            : 'N/A',
          companyName: invoice.companyName || 'N/A',
          totalAmount: invoice.totalAmount || 0,
          currency: invoice.currency || 'USD',
          taxAmount: invoice.taxAmount || 0,
          subtotal: invoice.subtotal || 0,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A',
          poNumber: invoice.poNumber || 'N/A',
          phone: invoice.contact?.phone || 'N/A',
          email: invoice.contact?.email || 'N/A',
          status: invoice.status,
          qualityScore: invoice.validation?.qualityScore || 'N/A',
          createdAt: new Date(invoice.createdAt).toLocaleString(),
        });
      });

      worksheet.columns.forEach((column) => {
        column.width = column.width || 15;
      });

      await workbook.xlsx.writeFile(filePath);
      logger.info(`✅ Excel export completed: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`❌ Excel export error: ${error.message}`);
      throw new AppError('Failed to export to Excel', 500);
    }
  }

  /**
   * Export invoices to JSON
   */
  async exportToJSON(invoices, filePath) {
    try {
      const directory = path.dirname(filePath);
      await this.ensureDirectory(directory);

      const exportData = invoices.map((invoice) => ({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        companyName: invoice.companyName,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        taxAmount: invoice.taxAmount,
        subtotal: invoice.subtotal,
        dueDate: invoice.dueDate,
        poNumber: invoice.poNumber,
        contact: invoice.contact,
        lineItems: invoice.lineItems,
        status: invoice.status,
        validation: invoice.validation,
        metadata: invoice.metadata,
        createdAt: invoice.createdAt,
      }));

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
      logger.info(`✅ JSON export completed: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`❌ JSON export error: ${error.message}`);
      throw new AppError('Failed to export to JSON', 500);
    }
  }
}

module.exports = new ExportService();