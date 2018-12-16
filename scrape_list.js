// @ts-check
/**
 * Run in console on the 1st Drupal content page.
 */

/**
 * Fetch an HTML document
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 */
async function fetchDocument(input, init) {
    const res = await fetch(input, init);
    const text = await res.text();
    return new DOMParser().parseFromString(text, 'text/html');
}

/**
 * Get link to next page
 * @param {ParentNode} page
 */
function nextPage(page) {
    const current = page.querySelector('.pager-current');
    if (current.nextElementSibling == null) {
        return null; // Last page.
    }

    return current.nextElementSibling.querySelector('a').href;
}

/**
 * Extract all the event posts from this page
 * @param {ParentNode} page
 */
function* findLinks(page) {
    const rows = page.querySelectorAll('.table-select-processed tbody tr');
    for (const row of rows) {
        const [
            _c,
            titleCell,
            typeCell,
            authorCell,
            _s,
            updatedCell
        ] = row.children;
        yield {
            title: titleCell.textContent,
            link: titleCell.querySelector('a').href,
            type: typeCell.textContent,
            author: {
                username: authorCell.textContent,
                link: authorCell.querySelector('a').href
            },
            date: updatedCell.textContent
        };
    }
}

function main() {
    const linkData = JSON.stringify(Array.from(findLinks(document)));
    const file = new Blob([linkData], { type: 'text/plain' });
    const url = URL.createObjectURL(file);

    // Make a link element and click it to download the pdf.
    const download = document.createElement('a');
    download.href = url;
    download.download = `drupal.json`;
    download.dispatchEvent(new MouseEvent('click'));

    URL.revokeObjectURL(url);

    location.assign(nextPage(document));
}

main();
