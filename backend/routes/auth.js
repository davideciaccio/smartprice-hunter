const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Autenticazione
 *   description: Gestione della registrazione, login e sicurezza degli account
 */

// --- 1. ROTTA DI REGISTRAZIONE (POST /api/auth/register) ---

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     description: Crea un nuovo account nel database. Valida la lunghezza della password (min. 8) e l'univocità di email e username.
 *     tags: [Autenticazione]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: mario_rossi
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mario.rossi@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: PasswordSicura123!
 *     responses:
 *       201:
 *         description: Utente creato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Utente creato con successo!
 *       400:
 *         description: Dati mancanti, password troppo corta, oppure email/username già in uso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 field:
 *                   type: string
 *                   example: email
 *                 message:
 *                   type: string
 *                   example: Questa email è già registrata.
 *       500:
 *         description: Errore del server durante la registrazione.
 */
router.post('/register', authController.register);


// --- 2. ROTTA DI LOGIN (POST /api/auth/login) ---

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Effettua il login
 *     description: Autentica l'utente e restituisce un token JWT assieme ai dati base del profilo.
 *     tags: [Autenticazione]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: mario.rossi@email.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: PasswordSicura123!
 *     responses:
 *       200:
 *         description: Login effettuato con successo.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 username:
 *                   type: string
 *                 role:
 *                   type: string
 *       400:
 *         description: Credenziali non valide.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Credenziali non valide.
 *       500:
 *         description: Errore del server durante il login.
 */
router.post('/login', authController.login);

module.exports = router;