const User = require('../models/User');

// Recupera tutti gli utenti (escludendo le password per sicurezza)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Errore nel recupero utenti:', error);
    res.status(500).json({ error: 'Errore nel recupero degli utenti' });
  }
};

// Banna un utente
exports.banUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { isBanned: true });
    res.status(200).json({ message: 'Utente bannato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante il ban' });
  }
};

// Sbanna un utente
exports.unbanUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndUpdate(userId, { isBanned: false });
    res.status(200).json({ message: 'Utente sbannato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante lo sban' });
  }
};

// Elimina definitivamente un utente
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'Utente eliminato definitivamente' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante l\'eliminazione' });
  }
};