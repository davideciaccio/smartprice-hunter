const mongoose = require('mongoose');

// Sotto-schema per lo storico dei prezzi (salva il prezzo e la data di rilevamento)
const priceHistorySchema = new mongoose.Schema({
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Schema principale del Prodotto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String }, // Il link e-commerce per lo scraping
  barcode: { type: String }, // Il codice a barre per la scansione mobile
  currentPrice: { type: Number },
  priceHistory: [priceHistorySchema], // Un array (lista) di prezzi passati
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Collega questo prodotto a un Utente specifico
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Product', productSchema);