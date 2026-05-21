const ScannedProduct = require('../models/ScannedProduct');
const axios = require('axios');

exports.saveScannedProduct = async (req, res) => {
  try {
    // Estraiamo i dati che arrivano dal frontend (camera.page.ts)
    const { barcode, name, brand, image, price, store } = req.body;

    // 1. RIFORMATTIAMO LO STORE PER FARLO COMBACIARE COL TUO SCHEMA DB
    const storeForDb = {
      name: store.name,
      address: store.address,
      coordinates: {
        lat: store.lat, // Prende la latitudine dal frontend
        lng: store.lng  // Prende la longitudine dal frontend
      }
    };

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
          store: storeForDb, // Salva l'oggetto store completo (lat, lng, address, name)
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
        const products = await ScannedProduct.find().sort({ createdAt: -1 });
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

// Aggiungi questo in backend/controllers/scanController.js
exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.status(200).json([]);
    }

    // Creiamo una RegExp per una ricerca "case-insensitive" (ignora maiuscole/minuscole)
    const regex = new RegExp(searchQuery, 'i');

    // Cerchiamo nel DB: il NOME deve contenere il testo OPPURE il BARCODE deve contenerlo
    const products = await ScannedProduct.find({
      $or: [
        { name: regex },
        { barcode: regex }
      ]
    }).limit(10); // Limitiamo a 10 risultati per non appesantire la tendina

    res.status(200).json(products);
  } catch (error) {
    console.error('Errore durante la ricerca:', error);
    res.status(500).json({ error: 'Errore di ricerca' });
  }
};

// backend/controllers/scanController.js
exports.getProductLocations = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    // Troviamo tutte le occorrenze di quel prodotto nei vari negozi
    const locations = await ScannedProduct.find({ barcode: barcode });
    res.status(200).json(locations);
  } catch (error) {
    console.error('Errore recupero posizioni:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
};