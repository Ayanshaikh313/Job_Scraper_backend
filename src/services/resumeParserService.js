const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const decodePdfText = (buffer) => {
  const raw = buffer.toString('latin1');
  const chunks = [];
  const textRegex = /\(([^()]*(?:\\.[^()]*)*)\)\s*Tj|\[(.*?)\]\s*TJ/gms;
  let match;

  while ((match = textRegex.exec(raw)) !== null) {
    if (match[1]) {
      chunks.push(match[1]);
    }

    if (match[2]) {
      const nestedMatches = match[2].match(/\(([^()]*(?:\\.[^()]*)*)\)/g) || [];
      nestedMatches.forEach((item) => chunks.push(item.slice(1, -1)));
    }
  }

  const cleaned = chunks
    .join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned;
};

const estimatePageCount = (buffer) => {
  const matches = buffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 1;
};

const parseResumeFromFile = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  let extractedText = '';
  let pageCount = estimatePageCount(buffer);

  try {
    const parser = new PDFParse({ data: buffer });
    const parsedPdf = await parser.getText();
    extractedText = (parsedPdf.text || '').trim();
    if (parsedPdf.numpages) {
      pageCount = parsedPdf.numpages;
    }
  } catch (error) {
    extractedText = decodePdfText(buffer);
    console.warn('pdf-parse failed, using regex fallback:', error.message);
  }

  return {
    text: extractedText,
    metadata: {
      wordCount: extractedText ? extractedText.split(/\s+/).filter(Boolean).length : 0,
      characterCount: extractedText.length,
      pageCount,
      parsedAt: new Date(),
    },
  };
};

module.exports = {
  parseResumeFromFile,
};
