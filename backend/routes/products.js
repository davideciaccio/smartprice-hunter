const express = require('express');
const router = express.Router();

// Importiamo il controller
const { addProduct, getUserProducts, deleteProduct } = require('../controllers/scraperController');

// Importiamo il middleware di sicurezza
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Prodotti
 *   description: Gestione dei prodotti monitorati dall'utente (aggiunta tramite scraping, lettura ed eliminazione)
 */

// --- LE NOSTRE ROTTE PRODOTTI (Tutte protette da authMiddleware) ---

// POST /api/products/add -> Avvia lo scraping e salva il prodotto
// rotta protetta da Middleware

/**
 * @swagger
 * /api/products/add:
 *   post:
 *     summary: Aggiunge un prodotto tramite scraping
 *     description: Avvia lo scraping di un prodotto partendo da un URL e lo salva nella lista dell'utente. Genera automaticamente una notifica di sistema.
 *     tags: [Prodotti]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: "https://www.amazon.it/dp/esempio-prodotto"
 *     responses:
 *       201:
 *         description: Prodotto elaborato e aggiunto con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto aggiunto con successo!
 *                 product:
 *                   type: object
 *       400:
 *         description: URL mancante o impossibile analizzare la pagina.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Impossibile analizzare la pagina. Verifica il link.
 *       401:
 *         description: Non autorizzato. Token mancante o invalido.
 *       500:
 *         description: Errore interno del server durante lo scraping.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore interno del server.
 */
router.post('/add', authMiddleware, addProduct);


// GET /api/products/ -> Restituisce l'elenco dei prodotti dell'utente
// rotta protetta da Middleware

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Recupera i prodotti dell'utente
 *     description: Restituisce l'elenco di tutti i prodotti salvati e monitorati dall'utente attualmente loggato.
 *     tags: [Prodotti]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dei prodotti recuperata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Non autorizzato. Token mancante o invalido.
 *       500:
 *         description: Errore nel caricamento della dashboard.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore nel caricamento della dashboard.
 */
router.get('/', authMiddleware, getUserProducts);


// DELETE /api/products/:id -> Elimina un prodotto specifico
// Il duepunti (:) indica a Express che "id" è un parametro dinamico (req.params.id)

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Elimina un prodotto
 *     description: Rimuove un prodotto specifico dalla lista dell'utente tramite il suo ID univoco.
 *     tags: [Prodotti]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID univoco (MongoDB ObjectId) del prodotto da eliminare
 *     responses:
 *       200:
 *         description: Prodotto eliminato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto rimosso dalla tua dashboard con successo.
 *       401:
 *         description: Non autorizzato. Token mancante o invalido.
 *       404:
 *         description: Prodotto non trovato o permesso negato.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Prodotto non trovato o non sei autorizzato a eliminarlo.
 *       500:
 *         description: Errore interno del server.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Errore interno del server durante l'eliminazione.
 */
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;