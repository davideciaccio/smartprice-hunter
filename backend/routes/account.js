const express = require('express');
const router = express.Router();

// Importiamo il controller con la logica applicativa che abbiamo appena scritto
const accountController = require('../controllers/accountController');

// Importiamo il tuo middleware che verifica la presenza e la validità del token JWT
const authMiddleware = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Gestione del profilo utente (modifica credenziali ed eliminazione)
 */

// =========================================================================
// DEFINIZIONE DELLE ROTTE DI GESTIONE ACCOUNT
// =========================================================================

// --- 1. ROTTA PER MODIFICARE LO USERNAME ---

/**
 * @swagger
 * /api/account/update-username:
 *   put:
 *     summary: Modifica lo username
 *     description: Aggiorna lo username dell'utente attualmente loggato. Verifica che non sia vuoto o già utilizzato da altri.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newUsername
 *             properties:
 *               newUsername:
 *                 type: string
 *                 example: mario_rossi_nuovo
 *     responses:
 *       200:
 *         description: Username aggiornato con successo. Restituisce i dati dell'utente aggiornati.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username aggiornato con successo!
 *                 user:
 *                   type: object
 *       400:
 *         description: Username vuoto, identico all'attuale o già in uso da un altro utente.
 *       401:
 *         description: Non autorizzato. Token mancante o non valido.
 *       404:
 *         description: Utente non trovato nel database.
 *       500:
 *         description: Errore interno del server durante l'aggiornamento.
 */
router.put('/update-username', authMiddleware, accountController.updateUsername);


// --- 2. ROTTA PER MODIFICARE LA PASSWORD ---

/**
 * @swagger
 * /api/account/change-password:
 *   put:
 *     summary: Modifica la password
 *     description: Cambia la password dell'utente. Richiede la vecchia password e valida la nuova (min 8 caratteri, 1 maiuscola, 1 minuscola, 1 numero, 1 carattere speciale).
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: VecchiaPassword123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NuovaPass!456
 *     responses:
 *       200:
 *         description: Password modificata con successo.
 *       400:
 *         description: Vecchia password errata o la nuova password non rispetta i rigidi criteri di sicurezza.
 *       401:
 *         description: Non autorizzato. Token mancante o non valido.
 *       404:
 *         description: Utente non trovato.
 *       500:
 *         description: Errore interno del server.
 */
router.put('/change-password', authMiddleware, accountController.changePassword);


// --- 3. ROTTA PER ELIMINARE L'ACCOUNT ---

/**
 * @swagger
 * /api/account/delete:
 *   delete:
 *     summary: Elimina l'account
 *     description: Rimuove permanentemente l'account dell'utente loggato (e i dati associati). Richiede la password per confermare l'azione.
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passwordConfirm
 *             properties:
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *                 example: MiaPasswordSicura123!
 *     responses:
 *       200:
 *         description: Account e prodotti monitorati eliminati definitivamente con successo.
 *       400:
 *         description: La password di conferma è mancante o errata.
 *       401:
 *         description: Non autorizzato. Token JWT mancante o invalido.
 *       404:
 *         description: Utente non trovato.
 *       500:
 *         description: Errore interno del server durante l'eliminazione.
 */
router.delete('/delete', authMiddleware, accountController.deleteAccount);

module.exports = router;