const express = require('express');
const router = express.Router();

// Importiamo il controller con la logica applicativa che abbiamo appena scritto
const accountController = require('../controllers/accountController');

// Importiamo il tuo middleware che verifica la presenza e la validità del token JWT
const authMiddleware = require('../middleware/authMiddleware');

// =========================================================================
// DEFINIZIONE DELLE ROTTE DI GESTIONE ACCOUNT
// =========================================================================

// Rotta per modificare lo username
// PUT /api/account/update-username
router.put('/update-username', authMiddleware, accountController.updateUsername);

// Rotta per modificare la password
// PUT /api/account/change-password
router.put('/change-password', authMiddleware, accountController.changePassword);

// Rotta per eliminare l'account (e i relativi dati a cascata)
// DELETE /api/account/delete
router.delete('/delete', authMiddleware, accountController.deleteAccount);

module.exports = router;