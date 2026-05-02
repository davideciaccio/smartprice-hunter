const express = require('express');
const router = express.Router();

// Importiamo il controller
const { addProduct, getUserProducts } = require('../controllers/scraperController');

// Importiamo il middleware di sicurezza
const authMiddleware = require('../middleware/authMiddleware');

// --- LE NOSTRE ROTTE PRODOTTI (Tutte protette da authMiddleware) ---

// POST /api/products/add -> Avvia lo scraping e salva il prodotto
// rotta protetta da Middleware
router.post('/add', authMiddleware, addProduct);

// GET /api/products/ -> Restituisce l'elenco dei prodotti dell'utente
// rotta protetta da Middleware
router.get('/', authMiddleware, getUserProducts);

module.exports = router;