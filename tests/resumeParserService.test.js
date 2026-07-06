const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseResumeFromFile } = require('../src/services/resumeParserService');

test('parseResumeFromFile extracts readable text from a real resume PDF', async () => {
  const candidatePaths = [
    path.join(process.env.USERPROFILE || '', 'Downloads', 'Ayan_Shaikh_CV.pdf'),
    path.join('C:', 'Users', 'ayanm', 'Downloads', 'Ayan_Shaikh_CV.pdf'),
  ].filter(Boolean);

  const resumePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

  assert.ok(resumePath, 'Expected a sample resume PDF in the Downloads folder');

  const result = await parseResumeFromFile(resumePath);
  assert.match(result.text, /(Ayan|React|Node|Software)/i);
  assert.ok(result.metadata.wordCount > 0);
});
