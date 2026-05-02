const express = require('express');
// Express crea un mini-router o mini-app che si occupa esclusivamente di autenticazione
// Questo per evitare di scrivere le rotte nel file principale server.js
const router = express.Router();
// Importiamo i controllers e i middleware
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");




// Le rotte servono a "guidare" il nostro frontend sfruttando metodo HTTP e URL, in sostanza in base
// al metodo che parte dal frontend, qui ci sono le istruzioni per dire al backend come comportarsi.
// Il file sarà agganciato in server.js su /api/auth

// --- 1. ROTTA DI REGISTRAZIONE (POST /api/auth/register) ---
// Ora il metodo post ha come secondo argomento la funzione importata dal controller
router.post('/register', authController.register);

// --- 2. ROTTA DI LOGIN (POST /api/auth/login) ---
// Uguale per il login
router.post('/login', authController.login);

module.exports = router;