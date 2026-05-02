const puppeteer = require('puppeteer');
const Product = require('../models/Product');

// --- CONTROLLER: Aggiungi un nuovo prodotto via Scraping ---
const addProduct = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL del prodotto mancante.' });
    }

    try {
        console.log(`Avvio scraping per: ${url}`);
        
        // 1. Setup Puppeteer
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Mascheriamo il bot per evitare di essere bloccati dagli e-commerce
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 2. Logica di Estrazione (Eseguita dentro il browser di Puppeteer)
        const scrapedData = await page.evaluate(() => {
            // A. Estrazione Titolo (Prima cerca i meta tag OG, poi H1)
            let title = document.querySelector('meta[property="og:title"]')?.content || 
                        document.querySelector('h1')?.innerText || 
                        'Prodotto Sconosciuto';

            // B. Estrazione Immagine (Cerca il meta tag OG image, comunissimo ovunque)
            let image = document.querySelector('meta[property="og:image"]')?.content || '';

            // C. Estrazione Prezzo
            let priceText = null;
            // Array di selettori comuni: partiamo dal più preciso (meta tag) a quelli di Amazon/generici
            const priceSelectors = [
                'meta[property="product:price:amount"]', 
                '.a-price-whole', 
                '.price', 
                '[itemprop="price"]', 
                '.current-price'
            ];

            for (let selector of priceSelectors) {
                const el = document.querySelector(selector);
                if (el) {
                    // I meta tag usano 'content', i div/span usano 'innerText'
                    priceText = el.content || el.innerText;
                    break;
                }
            }

            // Pulizia del prezzo per convertirlo in un numero puro (es. "1.299,99 €" -> 1299.99)
            let finalPrice = 0;
            if (priceText) {
                const cleanPrice = priceText.replace(/[^\d,-]/g, '').replace(',', '.');
                finalPrice = parseFloat(cleanPrice);
            }

            return { title: title.trim(), image, finalPrice };
        });

        await browser.close();

        // 3. Salvataggio a Database
        const newProduct = new Product({
            name: scrapedData.title,
            url: url,
            image: scrapedData.image,
            currentPrice: scrapedData.finalPrice,
            // Iniziamo la storia dei prezzi con il primo rilevamento
            priceHistory: [{ price: scrapedData.finalPrice }], 
            user: req.user.userId // Ottenuto dall'authMiddleware
        });

        await newProduct.save();

        res.status(201).json({ message: 'Prodotto aggiunto con successo!', product: newProduct });

    } catch (error) {
        console.error('Errore scraping:', error);
        res.status(500).json({ message: 'Impossibile analizzare la pagina. Il sito potrebbe bloccare i bot.' });
    }
};


// --- CONTROLLER: Recupera tutti i prodotti dell'utente loggato ---
const getUserProducts = async (req, res) => {
    try {
        // Cerca i prodotti filtrando per l'ID utente (preso dal token)
        // .sort({ createdAt: -1 }) li ordina dal più recente al più vecchio
        const products = await Product.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Errore nel recupero prodotti:', error);
        res.status(500).json({ message: 'Errore nel caricamento della dashboard.' });
    }
};

// ESPORTIAMO ENTRAMBE LE FUNZIONI!
module.exports = { addProduct, getUserProducts };