const mongoose = require('mongoose');

const scannedProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    barcode: { type: String },
    image: { type: String },
    brand: { type: String },
    currentPrice: { type: Number, required: true },
    store: {
        name: { type: String, default: 'Negozio Fisico' },
        address: { type: String },
        coordinates: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    priceHistory: [
        {
            price: { type: Number, required: true },
            date: { type: Date, default: Date.now }
        }
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now } // Aggiunto per sapere qual è la scansione più recente!
}, { collection: 'scanned_products' });

module.exports = mongoose.model('ScannedProduct', scannedProductSchema);