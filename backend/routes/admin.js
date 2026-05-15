const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Rotte per la gestione degli utenti
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;