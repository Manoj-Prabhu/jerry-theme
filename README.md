# Jerry

Jerry is a modern, conversion-focused Shopify Online Store 2.0 theme built for performance, accessibility, and merchant flexibility. It includes an AJAX cart drawer, predictive search, quick view, wishlist, a multi-slide hero carousel, responsive layouts, and extensive Theme Editor customization.

## Installation

### Requirements

- A Shopify store on the Online Store 2.0 platform
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) 3.x or later, if installing via the command line
- Shopify admin access

### Steps

1. In your Shopify admin, go to **Online Store → Themes**.
2. Click **Add theme → Upload ZIP file** and select the Jerry theme package.
3. Once uploaded, the theme appears under **Draft themes**. Click **Customize** to configure it, or **Publish** to make it your live theme.
4. Alternatively, using Shopify CLI:

   ```bash
   shopify theme push
   ```

After installing, visit **Online Store → Themes → Customize** to set your logo, colors, fonts, hero content, and navigation before publishing.

### Pushing code updates safely

Content added through the Theme Editor (hero slides, featured collections, menu assignments, and other settings) is stored as data in `templates/*.json` and `config/settings_data.json` — not in the theme's code files. Running `shopify theme push` uploads your local copies of *all* files, including those, so if your local project doesn't have the latest Theme Editor changes, pushing will overwrite and remove them.

To update the theme's code without losing live content:

```bash
shopify theme pull
```

Run this before every push to sync the live theme's current content/settings into your local files first. Then push normally — your code changes apply on top of the live content instead of replacing it.

If you only changed code (not settings or templates) and want to skip the pull, you can instead exclude data files from the push directly:

```bash
shopify theme push --ignore="templates/*.json" --ignore="config/settings_data.json"
```

## Theme features

- **Hero slideshow** — up to 4 slides, each with its own image, heading, description, and buttons; autoplays with manual prev/next controls, crossfades smoothly, and pauses on hover/focus
- **Shop by Category** — image grid section linking to collections
- **Featured Collection** and **Product Recommendations** — merchant-selected or automatic product grids
- **Testimonials** — star-rated customer quotes with optional avatars
- **Product cards** — color swatches, star ratings, sale/new/bestseller/sold-out badges, quick view, and wishlist
- **Quick View** — full add-to-cart flow (variants, quantity, images) without leaving the page
- **Wishlist** — persistent, no account required
- **Cart** — AJAX drawer and dedicated cart page, free-shipping progress bar, quantity controls
- **Predictive search** — live results plus recent-search history
- **Collection filtering and sorting** — price, availability, and product options
- **Country/region selector** — lets shoppers switch markets and currency from the footer
- **Customer accounts** — themed login, registration, account overview, order history, address book, and password reset/activation
- **App blocks** — merchants can add app content to the product and footer sections via the theme editor
- **Blog, article, FAQ, and contact page** templates
- Fully responsive, with reduced-motion support throughout

## Theme settings

Configured under **Theme settings** in the theme editor:

| Section | Controls |
|---|---|
| Typography | Primary, body, and logo fonts |
| Layout | Page width, page margin, section spacing, card and base border radius |
| Effects | Animation speed, shadow strength |
| Breadcrumbs | Enable/disable globally or per template (product, collection, blog, page) |
| Cart & Shipping | Free shipping threshold (drives the cart progress bar and announcement bar) |
| Product Badges | Toggle New/Sale/Sold Out/Bestseller badges; New badge duration; bestseller tag |
| Colors | Background, foreground, primary, secondary, accent, and border colors; input corner radius |
| Buttons | Button background, text color, and radius |
| Social media | Facebook, Instagram, YouTube, X links (shown in the footer) |

Each section (Hero, Shop by Category, Featured Collection, Testimonials, Footer, etc.) also has its own settings and blocks, editable independently from the theme editor.

## Supported Shopify features

- Online Store 2.0 — JSON templates, sections everywhere, app blocks on product and footer
- Multi-language storefronts via `locales/en.default.json` (add additional locale files to translate)
- Multi-currency and Shopify Markets, including a storefront country/currency switcher
- Classic customer accounts (login, register, account, orders, addresses, password reset/activation)
- Gift cards
- Blog and articles
- Metafields — product star ratings read from a `custom.rating` / `custom.rating_count` metafield when present
- Search & Discovery app filters (availability, price, and product-option filtering on collection pages)
- Full Theme Editor customization with configurable sections and blocks throughout

## Browser support

Jerry supports the current and previous major version of:

- Chrome
- Firefox
- Safari (desktop and iOS)
- Edge

JavaScript-dependent features (cart drawer, quick view, predictive search, wishlist, filters) degrade gracefully — core browsing and checkout remain functional with JavaScript disabled. All animations respect the operating system's reduced-motion setting.

## Version

Current version: **0.1.8**

## Author

**Mano Studio**

## Support

For support or questions, contact: [manojprabhu101@gmail.com](mailto:manojprabhu101@gmail.com)

## Credits

Jerry uses a small number of third-party assets under their respective open licenses — see [CREDITS.md](./CREDITS.md) for full attribution.

## License

Copyright © 2026 Mano Studio. All rights reserved.

Jerry is proprietary software. Permission is granted only to customers who have legally purchased a valid license for Jerry to install and use this theme on Shopify stores covered by that license. No part of this theme may be copied, modified, distributed, sublicensed, reverse engineered, or resold without prior written permission from Mano Studio.

Unauthorized distribution or resale of this software is strictly prohibited. See [LICENSE.md](./LICENSE.md) for the full terms.
