const puppeteer = require('puppeteer');
const Product = require('../models/Product');

// =======================================================================
// MOTORE CONDIVISO: Lo usano sia il Frontend che il Cron Job
// =======================================================================
const runScrapingEngine = async (url) => {
    let browser;
    try {
        console.log(`Avvio scraping avanzato per: ${url}`);
        
        // 1. Setup Puppeteer (esattamente come nel tuo file originale)
        browser = await puppeteer.launch({ 
            headless: "new",
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled' // Nasconde a eBay che siamo un bot
            ]
        });
        
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        });
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });

        console.log("Attendo 1 secondo per il rendering di React/Prezzi dinamici...");
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Logica di Estrazione Multi-Sito originale
        const scrapedData = await page.evaluate(() => {
            let extractedTitle = null;
            let extractedImage = null;
            let extractedPrice = null;

            // --- STRATEGIA 1:(JSON-LD SEO DATA) ---
            const jsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (let script of jsonScripts) {
                try {
                    const data = JSON.parse(script.innerText);
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
            if (!extractedTitle) {
                extractedTitle = document.querySelector('meta[property="og:title"]')?.content || 
                                 document.querySelector('#productTitle')?.innerText || 
                                 document.querySelector('h1')?.innerText || 
                                 'Prodotto Sconosciuto';
            }

            if (!extractedImage) {
                const imgSelectors = [
                    '#landingImage', 
                    '#imgBlkFront', 
                    '.x-item-image img', 
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

            if (!extractedPrice) {
                let priceText = null;
                const priceSelectors = [
                    '[data-testid="trade-box-buy-amount"]',
                    '.a-price .a-offscreen', 
                    '.x-price-primary', 
                    '[data-testid="product-price"]', 
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

                if (priceText) {
                    const cleanPrice = priceText.replace(/[^0-9,-]/g, '').replace(',', '.');
                    extractedPrice = parseFloat(cleanPrice);
                }
            }

            let finalPrice = Number(extractedPrice);
            if (isNaN(finalPrice)) finalPrice = 0;

            return { 
                title: typeof extractedTitle === 'string' ? extractedTitle.trim() : 'Prodotto', 
                image: typeof extractedImage === 'string' ? extractedImage : '', 
                finalPrice 
            };
        });

        await browser.close();
        return scrapedData; // Ritorniamo i dati anziché rispondere alla richiesta HTTP

    } catch (error) {
        console.error('Errore scraping interno:', error);
        if (browser) await browser.close(); // Chiusura sicura in caso di errore
        return null; 
    }
};

// =======================================================================
// CONTROLLER: Aggiungi un nuovo prodotto via Scraping
// =======================================================================
const addProduct = async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL del prodotto mancante.' });
    }

    try {
        // Usiamo la funzione centralizzata
        const scrapedData = await runScrapingEngine(url);

        if (!scrapedData || scrapedData.finalPrice === 0) {
            return res.status(400).json({ message: 'Impossibile analizzare la pagina. Verifica il link.' });
        }

        // Salvataggio a Database
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
        console.error('Errore controller scraping:', error);
        res.status(500).json({ message: 'Errore interno del server.' });
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

// --- CONTROLLER: Elimina un singolo prodotto ---
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.userId;

        const deletedProduct = await Product.findOneAndDelete({ 
            _id: productId, 
            user: userId 
        });

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Prodotto non trovato o non sei autorizzato a eliminarlo.' });
        }

        res.status(200).json({ message: 'Prodotto rimosso dalla tua dashboard con successo.' });

    } catch (error) {
        console.error('Errore durante l\'eliminazione del prodotto:', error);
        res.status(500).json({ message: 'Errore interno del server durante l\'eliminazione.' });
    }
};

// ESPORTIAMO ANCHE IL MOTORE CONDIVISO
module.exports = { addProduct, getUserProducts, deleteProduct, runScrapingEngine };