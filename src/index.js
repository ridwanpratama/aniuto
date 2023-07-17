const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const { scrapeAllUrls } = require('./scrapers/mangaScraper');

mongoose
    .connect('mongodb://localhost/mangadb', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('Koneksi ke MongoDB berhasil');
    })
    .catch((error) => {
        console.error('Koneksi ke MongoDB gagal:', error);
    });

// TODO: Add multiple sources
const url = 'https://westmanga.info/manga/list-mode/';
axios.get(url)
    .then((response) => {
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            const mangaUrls = [];
            $('.postbody .soralist a').each((index, element) => {
                const href = $(element).attr('href');
                const text = $(element).text();
                if (href && href.trim() !== '' && text && text.trim() !== '') {
                    mangaUrls.push({
                        href: href,
                        text: text.trim(),
                    });
                }
            });
            scrapeAllUrls(mangaUrls);
        }
    })
    .catch((error) => {
        console.log('Error:', error);
    });
