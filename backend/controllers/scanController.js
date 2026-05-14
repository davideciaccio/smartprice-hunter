const ScannedProduct = require('../models/ScannedProduct');
const axios = require('axios');

exports.saveScannedProduct = async (req, res) => {
  try {
    // Estraiamo i dati che arrivano dal frontend (camera.page.ts)
    const { barcode, name, brand, image, price, store } = req.body;

    /**
     * CORREZIONE LOGICA:
     * Il filtro ora cerca la combinazione UNICA di Barcode + Nome Negozio + Indirizzo Negozio.
     * * 1. Se scansioni lo stesso prodotto in un NUOVO negozio -> Crea un nuovo record (grazie a upsert: true).
     * 2. Se scansioni lo stesso prodotto nello STESSO negozio -> Aggiorna il prezzo di quel record specifico.
     */
    const updatedProduct = await ScannedProduct.findOneAndUpdate(
      { 
        barcode: barcode, 
        "store.name": store.name, 
        "store.address": store.address 
      }, 
      { 
        $set: { 
          name: name,   // Mantiene i dati descrittivi aggiornati
          brand: brand,
          image: image,
          currentPrice: price, // Aggiorna il prezzo specifico per questo binomio prodotto-negozio
          store: store, // Salva l'oggetto store completo (lat, lng, address, name)
          updatedAt: new Date() // Buona pratica per tracciare l'ultimo aggiornamento prezzo
        }
      },
      { 
        new: true,    
        upsert: true  
      }
    );

    res.status(200).json({ 
      message: 'Dati salvati correttamente per questo punto vendita', 
      product: updatedProduct 
    });

  } catch (error) {
    console.error('Errore nel salvataggio:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio a database' });
  }
};

// --- FUNZIONE 2: Recupera i prodotti scansionati (QUELLA CHE MANCAVA!) ---
exports.getScannedProducts = async (req, res) => {
    try {
        const products = await ScannedProduct.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("Errore nel recupero scansioni:", error);
        res.status(500).json({ message: "Errore nel recupero delle scansioni." });
    }
};

exports.lookupBarcode = async (req, res) => {
  try {
    const barcode = req.params.barcode;

    // 1. Cerchiamo PRIMA nel nostro database
    const existingProduct = await ScannedProduct.findOne({ barcode: barcode });

    if (existingProduct) {
      // Trovato! Rispondiamo al frontend dicendo che viene dal DB
      return res.status(200).json({ 
        foundInDb: true, 
        data: existingProduct 
      });
    }
    
    // Il backend chiama l'API esterna (nessun blocco CORS qui!)
    const apiUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const response = await axios.get(apiUrl);
    
    // Restituiamo il JSON pulito al nostro frontend Angular
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('Errore backend durante chiamata UPCitemdb:', error.message);
    res.status(500).json({ error: 'Errore di connessione al database prodotti' });
  }
};

