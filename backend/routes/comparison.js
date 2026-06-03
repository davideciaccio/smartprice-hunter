const express = require('express');
const router = express.Router();
const comparisonController = require('../controllers/comparisonController');

/**
 * @swagger
 * tags:
 *   name: Comparazione
 *   description: Ricerca e confronto dei prezzi dei prodotti online rispetto ai competitor
 */

// --- 1. ROTTA PER CERCARE E CONFRONTARE PRODOTTI ONLINE ---

/**
 * @swagger
 * /api/compare/{query}:
 *   get:
 *     summary: Cerca e confronta i prezzi online
 *     description: Cerca un prodotto online tramite SerpApi (per EAN o nome) e restituisce i primi 5 competitor ordinati per prezzo crescente. Se non trova nulla, restituisce un array vuoto.
 *     tags: [Comparazione]
 *     parameters:
 *       - in: path
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Il termine di ricerca (es. codice EAN 123456789 o nome del prodotto)
 *     responses:
 *       200:
 *         description: Risultati della comparazione recuperati con successo (array che può essere vuoto).
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   storeName:
 *                     type: string
 *                     example: Negozio Sconosciuto
 *                   storeIcon:
 *                     type: string
 *                     example: https://via.placeholder.com/20
 *                   price:
 *                     type: number
 *                     example: 19.99
 *                   formattedPrice:
 *                     type: string
 *                     example: € 19,99
 *                   link:
 *                     type: string
 *                     example: https://www.esempio.com/prodotto
 *                   condition:
 *                     type: string
 *                     example: new
 *                   delivery:
 *                     type: string
 *                     example: Consegna gratuita
 *                   rating:
 *                     type: number
 *                     example: 4.5
 *                   reviewsCount:
 *                     type: number
 *                     example: 120
 *       500:
 *         description: Errore del server o chiave API mancante.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Impossibile recuperare i prezzi online al momento.
 */
// Questa rotta gestirà richieste del tipo: GET /api/compare/123456789
router.get('/:query', comparisonController.getOnlineCompetitors);

module.exports = router;