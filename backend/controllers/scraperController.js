const puppeteer = require('puppeteer');
const Product = require('../models/Product');

// --- CONTROLLER: Aggiungi un nuovo prodotto via Scraping ---
const addProduct = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL del prodotto mancante.' });
    }

    try {
        console.log(`Avvio scraping avanzato per: ${url}`);
        
        // 1. Setup Puppeteer (Mascheramento Avanzato)
        const browser = await puppeteer.launch({ 
            headless: "new",
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled' // Nasconde a eBay che siamo un bot
            ]
        });
        
        const page = await browser.newPage();
        
        // Falsifichiamo di essere un vero essere umano con un monitor grande e lingua italiana
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        });
        
        // Andiamo alla pagina (ignoriamo gli errori di rete secondari come immagini che non caricano)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });

        console.log("Attendo 1 secondo per il rendering di React/Prezzi dinamici...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Logica di Estrazione Multi-Sito
        const scrapedData = await page.evaluate(() => {
            let extractedTitle = null;
            let extractedImage = null;
            let extractedPrice = null;

            // --- STRATEGIA 1: L'ARMA SEGRETA (JSON-LD SEO DATA) ---
            // Funziona benissimo per Zalando, StockX e siti moderni
            const jsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (let script of jsonScripts) {
                try {
                    const data = JSON.parse(script.innerText);
                    // Cerchiamo l'oggetto che contiene "offers" (il prezzo) o "image"
                    let productData = data;
                    if (Array.isArray(data)) productData = data.find(item => item['@type'] === 'Product' || item.offers);
                    else if (data['@graph']) productData = data['@graph'].find(item => item['@type'] === 'Product' || item.offers);

                    if (productData) {
                        if (!extractedTitle && productData.name) extractedTitle = productData.name;
                        if (!extractedImage && productData.image) {
                            extractedImage = Array.isArray(productData.image) ? productData.image[0] : productData.image;
                        }
                        if (!extractedPrice && productData.offers) {
                            let offer = Array.isArray(productData.offers) ? productData.offers[0] : productData.offers;
                            if (offer.price) extractedPrice = offer.price;
                        }
                    }
                } catch (e) { /* Ignora script malformati */ }
            }

            // --- STRATEGIA 2: FALLBACK CLASSICI E SELETTORI SPECIFICI ---
            
            // A. Titolo
            if (!extractedTitle) {
                extractedTitle = document.querySelector('meta[property="og:title"]')?.content || 
                                 document.querySelector('#productTitle')?.innerText || // Amazon
                                 document.querySelector('h1')?.innerText || 
                                 'Prodotto Sconosciuto';
            }

            // B. Immagine
            if (!extractedImage) {
                const imgSelectors = [
                    '#landingImage', // Amazon
                    '#imgBlkFront', // Amazon Libri
                    '.x-item-image img', // eBay
                    'meta[property="og:image"]'
                ];
                for (let selector of imgSelectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        extractedImage = el.src || el.content;
                        if (extractedImage) break;
                    }
                }
            }

            // C. Prezzo
            if (!extractedPrice) {
                let priceText = null;
                const priceSelectors = [
                    '[data-testid="trade-box-buy-amount"]',// SELETTORE PER STOCKX!
                    '.a-price .a-offscreen', // Amazon
                    '.x-price-primary', // eBay
                    '[data-testid="product-price"]', // Altri siti generici
                    'meta[property="product:price:amount"]', 
                    '[itemprop="price"]',
                    '.price'
                ];

                for (let selector of priceSelectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                        priceText = el.content || el.innerText;
                        break;
                    }
                }

                // Pulizia del testo prezzo
                if (priceText) {
                    // Sostituisce la virgola con il punto per i decimali, rimuove il resto
                    const cleanPrice = priceText.replace(/[^0-9,-]/g, '').replace(',', '.');
                    extractedPrice = parseFloat(cleanPrice);
                }
            }

            // Forza il prezzo a numero, se fallisce diventa 0
            let finalPrice = Number(extractedPrice);
            if (isNaN(finalPrice)) finalPrice = 0;

            return { 
                title: typeof extractedTitle === 'string' ? extractedTitle.trim() : 'Prodotto', 
                image: typeof extractedImage === 'string' ? extractedImage : '', 
                finalPrice 
            };
        });

        await browser.close();

        // 3. Salvataggio a Database
        const newProduct = new Product({
            name: scrapedData.title,
            url: url,
            image: scrapedData.image,
            currentPrice: scrapedData.finalPrice,
            priceHistory: [{ price: scrapedData.finalPrice }], 
            user: req.user.userId
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
        const products = await Product.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Errore nel recupero prodotti:', error);
        res.status(500).json({ message: 'Errore nel caricamento della dashboard.' });
    }
};

// ... (codice precedente: addProduct, getUserProducts)

// --- CONTROLLER: Elimina un singolo prodotto ---
const deleteProduct = async (req, res) => {
    try {
        // Estraiamo l'ID del prodotto dall'URL (es: /api/products/65a1b2c3...)
        const productId = req.params.id;
        
        // Estraiamo l'ID dell'utente dal nostro fido authMiddleware
        const userId = req.user.userId;

        // Eseguiamo l'eliminazione sicura: deve combaciare sia l'ID prodotto che l'ID utente!
        const deletedProduct = await Product.findOneAndDelete({ 
            _id: productId, 
            user: userId 
        });

        // Se deletedProduct è null, significa che il prodotto non esiste o l'utente non è il proprietario
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Prodotto non trovato o non sei autorizzato a eliminarlo.' });
        }

        res.status(200).json({ message: 'Prodotto rimosso dalla tua dashboard con successo.' });

    } catch (error) {
        console.error('Errore durante l\'eliminazione del prodotto:', error);
        res.status(500).json({ message: 'Errore interno del server durante l\'eliminazione.' });
    }
};

// ESPORTIAMO ANCHE LA NUOVA FUNZIONE!
module.exports = { addProduct, getUserProducts, deleteProduct };