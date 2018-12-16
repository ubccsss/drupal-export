// @ts-check
const {
    readdir,
    readJson,
    ensureFile,
    outputFile,
    createWriteStream
} = require('fs-extra');
const { join } = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4}) - (\d{2}):(\d{2})$/;

/**
 * @param {object} node
 * @param {string} node.title
 * @param {string} node.link
 * @param {string} node.type
 * @param {object} node.author
 * @param {string} node.author.username
 * @param {string} node.author.link
 * @param {string} node.date
 * @param {string} outFolder
 */
async function scrapePage(node, outFolder) {
    const url = new URL(node.link, 'https://ubccsss.org');
    const res = await fetch(node.link);
    const text = await res.text();
    const $ = cheerio.load(text);

    const article = $('article')
    const html = article.html() || "";

    const images = $('img', article);
    const imageDownloads = images
        .toArray()
        .map(img => new URL($(img).attr('src'), 'https://ubccsss.org'))
        .filter(url => url.host === 'ubccsss.org')
        .map(url =>
            ensureFile(url.pathname)
                .then(() => {
                    const dest = createWriteStream(url.pathname);
                    res.body.pipe(dest);
                    return new Promise((resolve, reject) => {
                        dest.once('finish', resolve);
                        dest.once('error', reject);
                    });
                })
                .then(() => url)
        );

    const [_a, month, day, year, hour, min] = DATE_REGEX.exec(node.date);
    const date = new Date(`${year}-${month}-${day}T${hour}:${min}:00`);
    const frontMatter = [
        '---',
        `title: ${node.title}`,
        `href: ${node.link}`,
        `type: ${node.type}`,
        `author:`,
        `  username: ${node.author.username}`,
        `  link: ${node.author.link}`,
        `date: ${date.toISOString()}`,
        '---'
    ].join('\n');

    const saveHtml = outputFile(
        join(outFolder, `${url.pathname}.md`),
        `${frontMatter}\n\n${html.trim()}`
    );

    const [_b, urls] = await Promise.all([
        saveHtml,
        Promise.all(imageDownloads)
    ]);
    urls.push(url);
    return urls;
}

/**
 * @param {string} dataFolder
 * @param {string} outFolder
 */
async function scrapeAll(dataFolder, outFolder) {
    const dataFiles = await readdir(dataFolder);
    await Promise.all(
        dataFiles.map(async file => {
            const json = await readJson(join(dataFolder, file));
            return Promise.all(json.map(node => scrapePage(node, outFolder)));
        })
    );
}

exports.scrapeAll = scrapeAll;

if (require.main === module) {
    scrapeAll(process.argv[2], process.argv[3]);
}
