# Glow by Grace

Website for Glow by Grace, a hair shop.

## Tech stack
- HTML5, CSS3, vanilla JavaScript (no framework, no build step)
- Google Fonts: Bodoni Moda, Pinyon Script, Manrope
- Static hosting (GitHub Pages / Netlify / Vercel)

## Structure
```
glowbygrace/
├── index.html            # Home / landing page
├── shop.html             # Shop page
└── assets/
    ├── css/
    │   └── styles.css    # All styles
    ├── img/
    │   └── favicon.svg
    └── js/
        ├── products.js   # Product catalogue and store settings
        ├── main.js       # Shared header/footer, product cards, bag
        ├── shop.js       # Shop filters and sorting
        └── chat.js       # Hair assistant chat
```

## Run locally
Open `index.html` in a browser, or serve the folder:
```bash
python3 -m http.server 8080
```
