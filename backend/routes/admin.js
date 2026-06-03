const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Gestione globale degli utenti e moderazione da parte dell'amministratore
 */

// --- 1. ROTTA PER RECUPERARE TUTTI GLI UTENTI ---

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Recupera tutti gli utenti
 *     description: Restituisce la lista completa degli utenti registrati (password escluse per sicurezza).
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista degli utenti recuperata con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Non autorizzato. Token JWT mancante o invalido.
 *       403:
 *         description: Accesso negato. L'utente non ha i permessi di amministratore.
 *       500:
 *         description: Errore nel recupero degli utenti.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore nel recupero degli utenti
 */
router.get('/users', adminController.getAllUsers);


// --- 2. ROTTA PER BANNARE UN UTENTE ---

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   post:
 *     summary: Banna un utente
 *     description: Imposta lo stato isBanned a true per un utente specifico tramite il suo ID.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID univoco (MongoDB ObjectId) dell'utente da bannare
 *     responses:
 *       200:
 *         description: Utente bannato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utente bannato con successo
 *       500:
 *         description: Errore durante il ban.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore durante il ban
 */
router.post('/users/:id/ban', adminController.banUser);


// --- 3. ROTTA PER RIMUOVERE IL BAN ---

/**
 * @swagger
 * /api/admin/users/{id}/unban:
 *   post:
 *     summary: Rimuove il ban di un utente
 *     description: Imposta lo stato isBanned a false, ripristinando l'accesso per l'utente.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID univoco (MongoDB ObjectId) dell'utente da sbannare
 *     responses:
 *       200:
 *         description: Ban rimosso con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utente sbannato con successo
 *       500:
 *         description: Errore durante lo sban.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore durante lo sban
 */
router.post('/users/:id/unban', adminController.unbanUser);


// --- 4. ROTTA PER ELIMINARE UN UTENTE ---

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Elimina un utente (Azione Admin)
 *     description: Rimuove permanentemente un utente dal database tramite il suo ID.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'ID univoco (MongoDB ObjectId) dell'utente da eliminare
 *     responses:
 *       200:
 *         description: Utente eliminato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utente eliminato definitivamente
 *       500:
 *         description: Errore durante l'eliminazione.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Errore durante l'eliminazione
 */
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;