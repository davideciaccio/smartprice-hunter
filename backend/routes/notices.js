const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middleware/authMiddleware'); // Il tuo middleware per il token JWT

/**
 * @swagger
 * tags:
 *   name: Notifiche
 *   description: Gestione delle notifiche per l'utente (lettura, aggiornamento stato, eliminazione)
 */

// --- 1. RECUPERO TUTTE LE NOTIFICHE ---
/**
 * @swagger
 * /api/notices:
 *   get:
 *     summary: Recupera le notifiche
 *     description: Restituisce l'elenco di tutte le notifiche (lette e non lette) per l'utente attualmente loggato. Ordinate dalla più recente.
 *     tags: [Notifiche]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista delle notifiche recuperata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Non autorizzato. Token JWT mancante o invalido.
 *       500:
 *         description: Errore nel recupero degli avvisi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore nel recupero degli avvisi
 */
router.get('/', authMiddleware, noticeController.getNotices);

// --- 2. SEGNA UNA SINGOLA NOTIFICA COME LETTA ---
/**
 * @swagger
 * /api/notices/{id}/read:
 *   put:
 *     summary: Segna una notifica come letta
 *     description: Aggiorna lo stato di una singola notifica specifica, impostandola come "letta".
 *     tags: [Notifiche]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID univoco della notifica
 *     responses:
 *       200:
 *         description: Notifica segnata come letta con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Avviso segnato come letto
 *       500:
 *         description: Errore aggiornamento avviso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore aggiornamento avviso
 */
router.put('/:id/read', authMiddleware, noticeController.markAsRead);

// --- 3. SEGNA TUTTE LE NOTIFICHE COME LETTE ---
/**
 * @swagger
 * /api/notices/read-all:
 *   put:
 *     summary: Segna tutte le notifiche come lette
 *     description: Aggiorna massivamente lo stato di tutte le notifiche non lette dell'utente loggato.
 *     tags: [Notifiche]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tutte le notifiche sono state segnate come lette.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tutti gli avvisi sono stati letti
 *       500:
 *         description: Errore aggiornamento avvisi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore aggiornamento avvisi
 */
router.put('/read-all', authMiddleware, noticeController.markAllAsRead);

// --- 4. ELIMINA UNA NOTIFICA ---
/**
 * @swagger
 * /api/notices/{id}:
 *   delete:
 *     summary: Elimina una notifica
 *     description: Rimuove permanentemente una notifica specifica dal database tramite il suo ID.
 *     tags: [Notifiche]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID della notifica da eliminare
 *     responses:
 *       200:
 *         description: Notifica eliminata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Avviso eliminato
 *       500:
 *         description: Errore eliminazione avviso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore eliminazione avviso
 */
router.delete('/:id', authMiddleware, noticeController.deleteNotice);

module.exports = router;