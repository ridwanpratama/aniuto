const axios = require('axios');
const cheerio = require('cheerio');
const MangaUrl = require('../models/mangaUrl');

async function scrapeUrl(mangaUrl) {
    const { href, text } = mangaUrl;
    try {
        const response = await axios.get(href);
        if (response.status === 200) {
            const html = response.data;
            const $ = cheerio.load(html);

            // Deklarasikan variabel categories di luar loop
            const categoryTags = $('.seriestugenre a');
            const categories = categoryTags.map((index, element) => $(element).text()).get();

            const chapters = [];
            $('.eph-num a').each((index, element) => {
                const chapter = $(element).find('.chapternum').text();
                const chapterUrl = $(element).attr('href');
                chapters.push({
                    chapter: chapter,
                    url: chapterUrl,
                });
            });

            const sortedChapters = chapters.sort((a, b) => {
                return parseInt(b.chapter) - parseInt(a.chapter);
            });

            const mangaData = new MangaUrl({
                text: text,
                category: categories.join(', '),
                chapters: sortedChapters.map((chapter) => ({
                    chapter: chapter.chapter,
                    images: [],
                })),
            });

            mangaData.save()
                .then(() => {
                    console.log('Data manga-url berhasil disimpan');
                })
                .catch((error) => {
                    console.error('Gagal menyimpan data manga-url:', error);
                });

            for (const chapter of sortedChapters) {
                await scrapeChapterImages(chapter.url, text, chapter.chapter);
            }
        }
    } catch (error) {
        console.log('Error:', error);
    }
}


async function scrapeAllUrls(mangaUrls) {
    for (const mangaUrl of mangaUrls) {
        await scrapeUrl(mangaUrl);
    }
}

// TODO: Download & auto reupload chapter images to cloud storage / S3
async function scrapeChapterImages(chapterUrl, text, chapter) {
    try {
        const response = await axios.get(chapterUrl);
        const html = response.data;
        const $ = cheerio.load(html);

        var script = $('script').filter(function () {
            return $(this).html().startsWith('ts_reader.run');
        }).eq(0).html();

        if (script) {
            const startIndex = script.indexOf('"images":[') + '"images":['.length;
            const endIndex = script.indexOf(']', startIndex);
            const imagesString = script.substring(startIndex, endIndex);
            const images = imagesString.split(',');

            for (let i = 0; i < images.length; i++) {
                images[i] = images[i].replace(/"/g, '').trim();
            }

            const mangaData = await MangaUrl.findOne({ text: text });
            const mangaChapter = mangaData.chapters.find(ch => ch.chapter === chapter);
            mangaChapter.images = images;

            mangaData.save()
                .then(() => {
                    console.log(`Data gambar untuk manga: ${text} ${chapter} berhasil disimpan`);
                })
                .catch((error) => {
                    console.error(`Gagal menyimpan data gambar untuk manga: ${text} ${chapter}:`, error);
                });

        } else {
            console.log('Script not found');
        }
    } catch (error) {
        console.error('Failed to fetch data:', error);
    }
}

module.exports = {
    scrapeUrl,
    scrapeAllUrls,
    scrapeChapterImages,
};