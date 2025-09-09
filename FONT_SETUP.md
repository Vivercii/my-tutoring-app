# Setting Up Söhne Font (Premium Option)

## Current Setup
The application currently uses **DM Sans** - a high-quality, geometric sans-serif that's similar to Söhne and free to use.

## To Use Söhne (After Purchasing License)

### 1. Purchase Söhne License
- Purchase from Klim Type Foundry: https://klim.co.nz/retail-fonts/soehne/
- You'll need web font files (WOFF/WOFF2 format)

### 2. Add Font Files
Create a fonts directory and add your Söhne font files:
```
public/
  fonts/
    soehne-buch.woff2
    soehne-kräftig.woff2
    soehne-halbfett.woff2
    soehne-leicht.woff2
```

### 3. Update Global CSS
Add to `src/app/globals.css`:

```css
@font-face {
  font-family: 'Söhne';
  src: url('/fonts/soehne-leicht.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Söhne';
  src: url('/fonts/soehne-buch.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Söhne';
  src: url('/fonts/soehne-halbfett.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Söhne';
  src: url('/fonts/soehne-kräftig.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

### 4. Update Tailwind Config
In `tailwind.config.ts`, update the font stack:

```ts
fontFamily: {
  sans: ['Söhne', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['Söhne Mono', 'JetBrains Mono', 'monospace'],
},
```

### 5. Remove Google Font Import (Optional)
If using only Söhne, you can remove the DM Sans import from `src/app/layout.tsx`.

## Font Weights Mapping
- Light (300): Subtle text, captions
- Book (400): Body text, regular weight
- Halbfett (600): Medium emphasis, subheadings
- Kräftig (700): Strong emphasis, headings

## Similar Free Alternatives
If Söhne license is not in budget, these are excellent alternatives:
- **DM Sans** (currently used) - Geometric, clean
- **Inter** - Used by many modern apps
- **Geist** - Vercel's new font, very modern
- **Plus Jakarta Sans** - Similar geometric feel

## License Note
⚠️ Söhne requires a commercial license for production use. The license from Klim Type Foundry typically costs around $299-$599 for web use depending on traffic.