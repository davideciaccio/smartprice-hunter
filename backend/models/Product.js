const mongoose = require('mongoose');

// Sotto-schema per lo storico dei prezzi (salva il prezzo e la data di rilevamento)
const priceHistorySchema = new mongoose.Schema({
  price: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Schema principale del Prodotto
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }, 
  image: { type: String }, // Per l'immagine estratta dal sito, Type String perchè nel db salviamo l'url che punta all'immagine
  barcode: { type: String },
  currentPrice: { type: Number },
  priceHistory: [priceHistorySchema], 
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Product', productSchema);