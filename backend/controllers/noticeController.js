const Notice = require('../models/Notices');

// 1. Recupera tutte le notifiche dell'utente loggato
exports.getNotices = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Ordiniamo dalla più recente alla più vecchia
    const notices = await Notice.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel recupero degli avvisi' });
  }
};

// 2. Segna una singola notifica come letta
exports.markAsRead = async (req, res) => {
  try {
    const noticeId = req.params.id;
    const userId = req.user.userId;
    
    await Notice.findOneAndUpdate(
      { _id: noticeId, user: userId },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Avviso segnato come letto' });
  } catch (error) {
    res.status(500).json({ error: 'Errore aggiornamento avviso' });
  }
};

// 3. Segna TUTTE le notifiche come lette (Tasto Globale)
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await Notice.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Tutti gli avvisi sono stati letti' });
  } catch (error) {
    res.status(500).json({ error: 'Errore aggiornamento avvisi' });
  }
};

// 4. Elimina una notifica (Cestino)
exports.deleteNotice = async (req, res) => {
  try {
    const noticeId = req.params.id;
    const userId = req.user.userId;
    
    await Notice.findOneAndDelete({ _id: noticeId, user: userId });
    res.status(200).json({ message: 'Avviso eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore eliminazione avviso' });
  }
};