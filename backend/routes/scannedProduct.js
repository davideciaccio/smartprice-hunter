const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteggiamo le rotte con il middleware per essere certi che l'ID utente sia presente
router.post('/save', authMiddleware, scanController.saveScannedProduct);
router.get('/', authMiddleware, scanController.getScannedProducts);
router.get('/lookup/:barcode', scanController.lookupBarcode);
router.get('/search',authMiddleware, scanController.searchProducts);
router.get('/locations/:barcode', scanController.getProductLocations);
router.delete('/:id', authMiddleware, scanController.deleteScannedProduct);

// Rotte pubbliche o di consultazione generale della mappa
router.get('/lookup/:barcode', scanController.lookupBarcode);
router.get('/locations/:barcode', scanController.getProductLocations);

module.exports = router;