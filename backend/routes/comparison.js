const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');

// Questa rotta gestirà richieste del tipo: GET /api/compare/123456789
router.get('/:query', comparisonController.getOnlineCompetitors);

module.exports = router;