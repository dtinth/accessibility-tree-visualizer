# Accessibility tree visualizer

A simple React application that reads Chrome’s Accessibility Tree and visualizes it as a web page.

It can serve as a quick way to preview how VoiceOver might read your website.

**Disclaimer:** This is just a proof-of-concept I did in a single night, so you will see very bad code inside.
Moreover, the resulting webpage is not accessible at all.

## How to use

1. Obtain the Accessibility Tree of a website using Puppeteer with this script.

   ```js
   // get-ax-tree.js
   const puppeteer = require('puppeteer')

   ;(async () => {
     const browser = await puppeteer.launch()
     const page = await browser.newPage()
     await page.goto(process.argv[2])
     const client =
       /** @type {import('puppeteer-core').CDPSession} */ (page._client)
     try {
       console.log(
         JSON.stringify(
           await client.send('Accessibility.getFullAXTree'),
           null,
           2,
         ),
       )
     } catch (e) {
       console.error(e)
       process.exitCode = 1
     } finally {
       browser.close()
     }
   })()
   ```

   Usage:

   ```
   node get-ax-tree https://github.com/ > tree.json
   ```

2. Drag the JSON file into the webpage at https://codesandbox.io/embed/github/dtinth/accessibility-tree-visualizer/tree/master/?fontsize=14&hidenavigation=1&theme=dark&view=preview.

   (Also: If you have your JSON tree copied into clipboard, you can paste it into the webpage and it will load the tree from the clipboard.)

## Development

I use CodeSandbox to develop this. Click this link to begin hacking: https://codesandbox.io/s/github/dtinth/accessibility-tree-visualizer
