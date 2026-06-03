const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Prodotti Scansionati
 *   description: Gestione delle scansioni dei codici a barre, salvataggio e mappa delle posizioni
 */

// --- 1. SALVATAGGIO PRODOTTO (Protetta) ---
/**
 * @swagger
 * /api/scanned/save:
 *   post:
 *     summary: Salva un prodotto scansionato
 *     description: Salva o aggiorna un prodotto scansionato nel punto vendita. Se il prezzo è il più basso, notifica automaticamente gli altri utenti interessati (Crowdsourcing).
 *     tags: [Prodotti Scansionati]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcode
 *               - name
 *               - price
 *               - store
 *             properties:
 *               barcode:
 *                 type: string
 *                 example: "8001120422112"
 *               name:
 *                 type: string
 *                 example: "Biscotti Esempio"
 *               brand:
 *                 type: string
 *                 example: "MarcaFamosa"
 *               image:
 *                 type: string
 *                 example: "https://link-immagine.com/foto.jpg"
 *               price:
 *                 type: number
 *                 example: 2.50
 *               store:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "Supermercato XYZ"
 *                   address:
 *                     type: string
 *                     example: "Via Roma 1, Milano"
 *                   lat:
 *                     type: number
 *                     example: 45.4642
 *                   lng:
 *                     type: number
 *                     example: 9.1900
 *     responses:
 *       200:
 *         description: Prodotto salvato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Dati salvati correttamente per questo punto vendita
 *                 product:
 *                   type: object
 *       500:
 *         description: Errore interno del server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore durante il salvataggio a database
 */
router.post('/save', authMiddleware, scanController.saveScannedProduct);

// --- 2. ELENCO PRODOTTI SCANSIONATI (Protetta) ---
/**
 * @swagger
 * /api/scanned:
 *   get:
 *     summary: Recupera la cronologia delle scansioni
 *     description: Restituisce l'elenco dei prodotti scansionati dall'utente loggato.
 *     tags: [Prodotti Scansionati]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Elenco recuperato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Non autorizzato.
 *       500:
 *         description: Errore interno del server.
 */
router.get('/', authMiddleware, scanController.getScannedProducts);

// --- 3. RICERCA PUBBLICA TRAMITE BARCODE (Pubblica) ---
/**
 * @swagger
 * /api/scanned/lookup/{barcode}:
 *   get:
 *     summary: Cerca le informazioni di un codice a barre
 *     description: Restituisce i dettagli generali di un prodotto (dal DB locale o da UPCitemdb) partendo dal suo barcode. Rotta pubblica.
 *     tags: [Prodotti Scansionati]
 *     parameters:
 *       - in: path
 *         name: barcode
 *         schema:
 *           type: string
 *         required: true
 *         description: Il codice a barre da cercare
 *     responses:
 *       200:
 *         description: Informazioni recuperate con successo (dal DB o dall'API esterna).
 *       500:
 *         description: Errore di connessione al database prodotti.
 */
router.get('/lookup/:barcode', scanController.lookupBarcode);

// --- 4. RICERCA GENERALE PRODOTTI (Protetta) ---
/**
 * @swagger
 * /api/scanned/search:
 *   get:
 *     summary: Cerca tra i prodotti (Mappa)
 *     description: Permette di cercare tra i prodotti precedentemente scansionati globalmente tramite nome o barcode.
 *     tags: [Prodotti Scansionati]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Termine di ricerca (minimo 2 caratteri)
 *     responses:
 *       200:
 *         description: Risultati della ricerca (array di prodotti).
 *       500:
 *         description: Errore di ricerca.
 */
router.get('/search', authMiddleware, scanController.searchProducts);

// --- 5. POSIZIONI DEL PRODOTTO (Pubblica) ---
/**
 * @swagger
 * /api/scanned/locations/{barcode}:
 *   get:
 *     summary: Ottieni le posizioni di un prodotto
 *     description: Restituisce i punti vendita in cui questo prodotto è stato scansionato (senza duplicati di negozio). Rotta pubblica.
 *     tags: [Prodotti Scansionati]
 *     parameters:
 *       - in: path
 *         name: barcode
 *         schema:
 *           type: string
 *         required: true
 *         description: Il codice a barre del prodotto
 *     responses:
 *       200:
 *         description: Posizioni recuperate con successo (array di prodotti filtrati per store unico).
 *       500:
 *         description: Errore del server.
 */
router.get('/locations/:barcode', scanController.getProductLocations);

// --- 6. ELIMINAZIONE PRODOTTO (Protetta) ---
/**
 * @swagger
 * /api/scanned/{id}:
 *   delete:
 *     summary: Elimina una scansione
 *     description: Rimuove in sicurezza la scansione effettuata dall'utente loggato.
 *     tags: [Prodotti Scansionati]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID (ObjectId) della scansione da rimuovere
 *     responses:
 *       200:
 *         description: Scansione eliminata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto eliminato con successo.
 *       401:
 *         description: Non autorizzato.
 *       404:
 *         description: Prodotto non trovato o non autorizzato alla cancellazione.
 *       500:
 *         description: Errore interno del server.
 */
router.delete('/:id', authMiddleware, scanController.deleteScannedProduct);

module.exports = router;