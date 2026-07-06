const express = require('express');
const multer = require('multer');
const path = require('path');

const { analyzeResume } = require('../controllers/atsController');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
});

router.post('/analyze', upload.single('resume'), analyzeResume);

module.exports = router;