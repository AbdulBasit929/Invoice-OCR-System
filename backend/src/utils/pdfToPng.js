const path = require("path");
const fs = require("fs");
const os = require("os");
const poppler = require("pdf-poppler");

module.exports = async function convertPdfToPng(pdfPath) {
  try {
    // Windows-safe temporary directory
    const outDir = path.join(os.tmpdir(), "ocr_tmp");

    // Create temp folder if not exists
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outPrefix = "ocr_" + Date.now();
    const expectedOutput = path.join(outDir, `${outPrefix}-1.png`);

    const opts = {
      format: "png",
  out_dir: outDir,
  out_prefix: outPrefix,
  page: 1,
  dpi: 300,        // Increase DPI (Most important)
  scale: 200,      // Larger scale = sharper text
  quality: 100 
    };

    console.log("🚀 Running poppler conversion:\n", {
      binary: poppler.pdftocairoPath,
      pdf: pdfPath,
      outDir,
      expectedOutput
    });

    await poppler.convert(pdfPath, opts);

    // Validate PNG exists
    if (!fs.existsSync(expectedOutput)) {
      throw new Error("❌ PDF → PNG failed: output file not found");
    }

    const stats = fs.statSync(expectedOutput);
    if (stats.size < 5000) {
      throw new Error("❌ Converted PNG too small — likely corrupted");
    }

    return expectedOutput;

  } catch (error) {
    console.error("❌ PDF conversion error:", error);
    throw error;
  }
};
