const ScannedProduct = require('../models/ScannedProduct');

// --- FUNZIONE 1: Salva un nuovo prodotto scansionato ---
exports.saveScannedProduct = async (req, res) => {
    try {
        const { name, price, image, barcode, brand, store } = req.body;
        const userId = req.user.userId; 

        if (!name || !price) {
            return res.status(400).json({ message: "Dati insufficienti per salvare il prodotto." });
        }

        const newScannedProduct = new ScannedProduct({
            name,
            currentPrice: parseFloat(price),
            image: image || '',
            barcode: barcode || 'N/D',
            brand: brand || 'Generico',
            // Dati del punto vendita
            store: {
                name: store?.name || 'Negozio Sconosciuto',
                address: store?.address || '',
                coordinates: {
                    lat: store?.lat,
                    lng: store?.lng
                }
            },
            priceHistory: [{ price: parseFloat(price) }],
            user: userId
        });

        await newScannedProduct.save();
        res.status(201).json({ message: "Prodotto e punto vendita salvati!", product: newScannedProduct });
    } catch (error) {
        console.error("Errore salvataggio scansione:", error);
        res.status(500).json({ message: "Errore nel salvataggio dei dati." });
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