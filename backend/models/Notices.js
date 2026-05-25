const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  // A quale utente appartiene la notifica?
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Le 3 categorie che abbiamo deciso
  type: { type: String, enum: ['price_drop', 'alert', 'system'], required: true },
  
  // Stato della notifica
  read: { type: Boolean, default: false },
  
  // Data per ordinare gli avvisi cronologicamente
  createdAt: { type: Date, default: Date.now }
}, { collection: 'notices' });

module.exports = mongoose.model('Notice', noticeSchema);