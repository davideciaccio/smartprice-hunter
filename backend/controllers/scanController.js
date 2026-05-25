const ScannedProduct = require('../models/ScannedProduct');
const axios = require('axios');
const Notice = require('../models/Notices');

// --- 1. SALVATAGGIO PRODOTTO ---
exports.saveScannedProduct = async (req, res) => {
  try {
    const { barcode, name, brand, image, price, store } = req.body;
    const userId = req.user.userId;

    const storeForDb = {
      name: store.name,
      address: store.address,
      coordinates: {
        lat: store.lat, 
        lng: store.lng  
      }
    };

 
    const updatedProduct = await ScannedProduct.findOneAndUpdate(
      { 
        barcode: barcode, 
        "store.name": store.name, 
        "store.address": store.address,
        user: userId // <--- LA CHIAVE DEL FIX
      }, 
      { 
        $set: { 
          name: name,   
          brand: brand,
          image: image,
          currentPrice: price, 
          store: storeForDb,
          user: userId, 
          updatedAt: new Date() // Aggiorniamo la data per la mappa
        }
      },
      { 
        new: true,    
        upsert: true  
      }
    );

    // =========================================================
    // NUOVO: LOGICA NOTIFICA "OCCASIONE IN ZONA" (CROWDSOURCING)
    // =========================================================
    // Cerchiamo altri utenti che hanno lo stesso prodotto nella loro lista,
    // ma con un prezzo MAGGIORE di quello appena trovato.
    const interestedUsers = await ScannedProduct.find({
      barcode: barcode,
      user: { $ne: userId }, // Escludiamo l'utente che sta scansionando (non vogliamo auto-notificarci)
      currentPrice: { $gt: price } // Solo se il loro prezzo salvato è più alto di questa nuova occasione
    }).distinct('user'); // Vogliamo una lista di ID utente unici (evita doppie notifiche se hanno scansionato più volte)

    // Creiamo una notifica per ciascun utente interessato
    if (interestedUsers.length > 0) {
      const noticesToCreate = interestedUsers.map(targetUserId => ({
        user: targetUserId,
        title: 'Occasione in Zona! 📍 ',
        message: `Un utente ha appena segnalato "${name}" a soli €${Number(price).toFixed(2)} presso ${store.name}. Controlla la mappa!`,
        type: 'price_drop'
      }));

      await Notice.insertMany(noticesToCreate);
      console.log(`[NOTIFICA COMMUNITY] Avvisati ${interestedUsers.length} utenti per un prezzo locale più basso di ${name}.`);
    }
    // =========================================================

    res.status(200).json({ 
      message: 'Dati salvati correttamente per questo punto vendita', 
      product: updatedProduct 
    });

  } catch (error) {
    console.error('Errore nel salvataggio:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio a database' });
  }
};

// --- 2. RECUPERA I PRODOTTI DELL'UTENTE (DASHBOARD e COMPARISON) ---
exports.getScannedProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const products = await ScannedProduct.find({ user: userId }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("Errore nel recupero scansioni:", error);
        res.status(500).json({ message: "Errore nel recupero delle scansioni." });
    }
};

// --- 3. RICERCA GLOBALE PER LA TENDINA DELLA MAPPA ---
exports.searchProducts = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    
    if (!searchQuery || searchQuery.length < 2) {
      return res.status(200).json([]);
    }

    const regex = new RegExp(searchQuery, 'i');
    
    // Globale: senza filtro user
    const products = await ScannedProduct.find({
      $or: [
        { name: regex },
        { barcode: regex }
      ]
    }).limit(10); 

    res.status(200).json(products);
  } catch (error) {
    console.error('Errore durante la ricerca:', error);
    res.status(500).json({ error: 'Errore di ricerca' });
  }
};

// --- 4. MAPPA: RECUPERA LE POSIZIONI PIÙ RECENTI ---
exports.getProductLocations = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    
    // 1. Peschiamo tutti i record GLOBALI di quel barcode, ordinati dal più recente al più vecchio
    const allLocations = await ScannedProduct.find({ barcode: barcode })
                                             .sort({ updatedAt: -1, createdAt: -1 });
    
    // 2. Filtriamo i duplicati (stesso negozio scansionato da più utenti)
    // Teniamo solo il primo che incontriamo (che grazie al .sort() è il più recente!)
    const uniqueLocations = [];
    const seenStores = new Set();

    for (const loc of allLocations) {
      // Creiamo una "chiave" unica basata su nome e indirizzo del negozio
      const storeKey = `${loc.store.name}-${loc.store.address}`;
      
      // Se non abbiamo ancora visto questo negozio, lo aggiungiamo all'array da inviare alla mappa
      if (!seenStores.has(storeKey)) {
        seenStores.add(storeKey);
        uniqueLocations.push(loc);
      }
    }

    // Inviamo alla mappa solo la lista "pulita" senza pin sovrapposti
    res.status(200).json(uniqueLocations);

  } catch (error) {
    console.error('Errore recupero posizioni:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
};

// --- 5. ELIMINAZIONE PRODOTTO (TASK 2) ---
exports.deleteScannedProduct = async (req, res) => {
  try {
    const productId = req.params.id; 
    const userId = req.user.userId; 

    // FIX TASK 2: Eliminazione sicura. Rimuove SOLO la riga di QUESTO utente.
    // L'eventuale riga dell'altro utente nello stesso negozio resta salva nel DB.
    const deletedProduct = await ScannedProduct.findOneAndDelete({ 
      _id: productId, 
      user: userId 
    });
    
    if (!deletedProduct) {
      return res.status(404).json({ 
        message: 'Prodotto non trovato o non autorizzato alla cancellazione.' 
      });
    }

    res.status(200).json({ message: 'Prodotto eliminato con successo.' });
    
  } catch (error) {
    console.error("Errore nell'eliminazione del prodotto scansionato:", error);
    res.status(500).json({ error: 'Errore interno del server.' });
  }
};

// --- 6. CHIAMATA AL DATABASE ESTERNO (GLOBALE) ---
exports.lookupBarcode = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    
    // Cerca globalmente nel DB per risparmiare chiamate API
    const existingProduct = await ScannedProduct.findOne({ barcode: barcode });

    if (existingProduct) {
      return res.status(200).json({ 
        foundInDb: true, 
        data: existingProduct 
      });
    }
    
    const apiUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const response = await axios.get(apiUrl);
    res.status(200).json(response.data);
    
  } catch (error) {
    console.error('Errore backend durante chiamata UPCitemdb:', error.message);
    res.status(500).json({ error: 'Errore di connessione al database prodotti' });
  }
};