export function openImageInNewTab(imgSrc) {
  const newTab = window.open();
  if (newTab) {
    newTab.document.write(`
      <html>
        <head>
          <title>Resume / CV</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; background: #000; min-height: 100vh; }
            img { max-width: 100%; max-height: 100vh; object-fit: contain; }
          </style>
        </head>
        <body>
          <img src="${imgSrc}" alt="Resume CV" />
        </body>
      </html>
    `);
    newTab.document.close();
  }
}
