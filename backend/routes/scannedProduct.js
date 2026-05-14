const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteggiamo le rotte con il middleware per essere certi che l'ID utente sia presente
router.post('/save', authMiddleware, scanController.saveScannedProduct);
router.get('/', authMiddleware, scanController.getScannedProducts);
router.get('/lookup/:barcode', scanController.lookupBarcode);
router.get('/search', scanController.searchProducts);
router.get('/locations/:barcode', scanController.getProductLocations);

module.exports = router;