# scrape-drupal

A script to scrape the ubccsss.org Drupal site.

## Usage

Open the Drupal admin panel and navigate to the content page. Open the DevTools panel and paste the contents of the _scrape_list.js_ file inside. After parsing the current page, the script automatically navigates to the next page so you can just paste it again. Move the saved data files into a folder.

Afterwards, run _scrape_page.js_ and point it to the new folder as your first argument. Pass the path to the folder to save your content as the second argument.
```powershell
npm install
node scrape_page.js .\date .\content
```
