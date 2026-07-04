const escapePdfText = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const wrapText = (text, maxLength = 88) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : ['N/A'];
};

const createPage = (lines, pageIndex, totalPages) => {
  const header = [
    'BT',
    '/F1 18 Tf',
    '50 790 Td',
    `(ATS Evaluation Report) Tj`,
    '0 -24 Td',
    '/F1 10 Tf',
    `(${escapePdfText(`Page ${pageIndex + 1} of ${totalPages}`)}) Tj`,
  ];

  const body = [];
  let yOffset = -30;

  lines.forEach((line) => {
    body.push(`0 ${yOffset} Td`);
    body.push(`(${escapePdfText(line)}) Tj`);
    yOffset = -16;
  });

  return `${header.join('\n')}\n${body.join('\n')}\nET`;
};

const buildPdf = (pages) => {
  const objects = [];
  const pageObjectIds = [];

  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  pages.forEach((pageContent, index) => {
    const pageObjectId = 3 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);

    objects.push(
      `${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectId} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjectId} 0 obj\n<< /Length ${Buffer.byteLength(pageContent, 'utf8')} >>\nstream\n${pageContent}\nendstream\nendobj`
    );
  });

  objects.splice(
    1,
    0,
    `2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] >>\nendobj`
  );

  const fontObjectId = 3 + pages.length * 2;
  objects.push(`${fontObjectId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${object}\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
};

const generateApplicationReportPdf = (application) => {
  const lines = [
    `Candidate Name: ${application.studentId?.name || 'Unknown Candidate'}`,
    `Candidate Email: ${application.studentId?.email || 'N/A'}`,
    `Job Title: ${application.jobId?.title || 'N/A'}`,
    `Company: ${application.jobId?.company || 'N/A'}`,
    `ATS Score: ${application.atsEvaluation?.totalScore || 0}/100`,
    `Recommendation: ${application.atsEvaluation?.recommendation || 'N/A'}`,
    `Matched Skills: ${(application.atsEvaluation?.matchedSkills || []).join(', ') || 'None'}`,
    `Missing Skills: ${(application.atsEvaluation?.missingSkills || []).join(', ') || 'None'}`,
    `Matched Keywords: ${(application.atsEvaluation?.keywordAnalysis?.matchedKeywords || []).join(', ') || 'None'}`,
    `Missing Keywords: ${(application.atsEvaluation?.keywordAnalysis?.missingKeywords || []).join(', ') || 'None'}`,
    `Resume Word Count: ${application.resumeMetadata?.wordCount || 0}`,
    `Resume Pages: ${application.resumeMetadata?.pageCount || 0}`,
    'Score Breakdown:',
    `Keyword Match: ${application.atsEvaluation?.scoreBreakdown?.keywordMatch || 0}/40`,
    `Skills Match: ${application.atsEvaluation?.scoreBreakdown?.skillsMatch || 0}/25`,
    `Experience Match: ${application.atsEvaluation?.scoreBreakdown?.experienceMatch || 0}/20`,
    `Education Match: ${application.atsEvaluation?.scoreBreakdown?.educationMatch || 0}/10`,
    `Resume Quality: ${application.atsEvaluation?.scoreBreakdown?.resumeQuality || 0}/5`,
  ];

  const wrappedLines = lines.flatMap((line) => wrapText(line));
  const pageSize = 38;
  const pageChunks = [];

  for (let index = 0; index < wrappedLines.length; index += pageSize) {
    pageChunks.push(wrappedLines.slice(index, index + pageSize));
  }

  const pages = pageChunks.map((chunk, index) => createPage(chunk, index, pageChunks.length));
  return buildPdf(pages);
};

module.exports = {
  generateApplicationReportPdf,
};
