const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const authMiddleware = require('../middleware/authMiddleware'); // Il tuo middleware per il token JWT

// Tutte le rotte sono protette
router.get('/', authMiddleware, noticeController.getNotices);
router.put('/:id/read', authMiddleware, noticeController.markAsRead);
router.put('/read-all', authMiddleware, noticeController.markAllAsRead);
router.delete('/:id', authMiddleware, noticeController.deleteNotice);

module.exports = router;