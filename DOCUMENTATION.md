# Jerry Theme Documentation

Welcome to Jerry! This guide walks you through setting up and customizing your store using the Jerry theme. All of these settings are configured in **Online Store → Themes → Customize**.

---

## Getting Started

1. In your Shopify admin, go to **Online Store → Themes**.
2. Find Jerry under your themes and click **Customize** to open the Theme Editor.
3. Use the left-hand panel to select sections and adjust their settings — every change previews live before you publish.
4. When you're happy with your changes, click **Save**, then **Publish** when you're ready to make Jerry your live theme.

---

## Homepage Sections

### Hero Slideshow
The homepage hero supports up to 4 slides, each with its own image, small badge label (e.g. "New Arrival"), heading, highlighted text, description, and two buttons (primary and secondary).
- Click **Hero** in the section list, then **Add block → Slide** to add a new slide (up to 4).
- Each slide's image, badge, heading, description, and button links/labels can be set independently.
- You can also add up to 3 **Trust items** (small icon + text, e.g. "Free Shipping", "Secure Checkout") shown beneath the hero.
- The slideshow autoplays and crossfades automatically; shoppers can also use the arrow controls or hover to pause.
- If you don't add any Slide blocks, the section falls back to a single static hero using its own Image/Heading/Description settings — if no image is set there either, an animated placeholder graphic is shown instead of a broken image.

### Shop by Category
A grid linking to your collections, each with its own image and title. Add up to 4 categories as blocks.

### Featured Collection / Product Recommendations
Choose a collection to feature on your homepage, or let Shopify automatically recommend related products on product pages.

### Testimonials
Showcase customer reviews with a star rating, quote, name, and optional avatar photo. Add as many testimonial blocks as you like.

---

## Product Pages

- **Color swatches** and **star ratings** appear automatically on product cards if your products have a "Color" option and a `rating`/`rating_count` metafield set up under **Settings → Custom data → Products**.
- **Badges** (New, Sale, Bestseller, Sold Out) appear automatically based on product tags and inventory status.
- **Quick View** lets shoppers preview and add a product to cart without leaving the page they're on — no setup required, it's built in.
- **Wishlist** lets shoppers save products to a personal list (stored in their browser, no account required).
- Products with multiple images automatically cycle through them on hover-free browsing (e.g. in collection grids).
- **Sticky Add to Cart**: on product pages, a slim bar with the product name, price, and an Add to Cart button appears at the top once a shopper scrolls past the main add-to-cart button — no setup required.
- **Recently Viewed Products**: a section that automatically shows the last few products a shopper looked at, based on their browsing history. Add it to any page as a section in the Theme Editor.

---

## Collections & Filtering

- Collection pages display products in a responsive grid (4 columns on desktop, 2 on mobile).
- Shoppers can **sort** results (price, newest, best-selling, etc.) and **filter** by availability and price using the Filters button, which opens as a popup — filters are based on your products' options and inventory automatically.
- Once a collection has 3 or more products, the layout keeps everything organized and consistent regardless of screen size.

---

## Cart

- The **cart drawer** slides in from the side after adding a product, showing a live order summary.
- A **free shipping progress bar** shows shoppers how much more they need to spend to unlock free shipping — set your threshold in **Theme Settings → Cart**.
- The dedicated **cart page** (`/cart`) mirrors the drawer with a full-page layout.

---

## Header

Select the **Header** section in the Theme Editor to configure:
- **Logo**: upload your logo image and set its display width. If no logo is uploaded, your store name is shown as text instead.
- **Menu**: choose which navigation menu appears in the header. **This is required** — if no menu is assigned, both the desktop navigation links and the mobile hamburger menu icon will be hidden, since there'd be nothing to show. Create your menu under **Online Store → Navigation** first, then select it here.
- **Sticky header**: toggle on to keep the header visible while scrolling.
- Menu items with nested sub-menus automatically become a mega menu dropdown (see Navigation & Search below).

---

## Announcement Bar

A slim bar above your header for promos, shipping notices, or store announcements.
- In the Theme Editor, select the **Header** section and add one or more **Announcement** blocks — each has its own text and an optional link.
- With multiple blocks added, turn on **Auto-rotate** to cycle through them automatically, and set the **rotation speed** (in seconds).
- Choose whether shoppers can dismiss the bar with a close button, and set its background color, text color, and text alignment.
- Use the `[amount]` token in your announcement text (e.g. "Free shipping on orders over [amount]") to automatically insert your **Free shipping threshold**, set under **Theme Settings → Cart & Shipping**. Update the threshold once there and it stays in sync everywhere it's used, including the cart page's shipping progress bar.

---

## Navigation & Search

- **Breadcrumbs**: automatically shown near the top of collection, product, blog, and other inner pages so shoppers can navigate back easily — no setup required.
- **Predictive search**: as shoppers type in the search bar, matching products appear instantly in a dropdown, along with their recent search history.
- **Search results page**: pressing "Search" shows a dedicated results page with the same product grid used elsewhere in the theme.
- **Country/region selector**: enable this in the Footer section to let shoppers switch their shipping country and currency.

---

## Footer

Select the **Footer** section in the Theme Editor to configure:
- **Description**: a short line of text about your store, shown next to your logo.
- **Menu columns**: add up to 3 **Menu** blocks, each linking to one of your navigation menus (e.g. Shop, Company, Support) — add, remove, or reorder them freely.
- **Social icons**: toggle on/off; icons appear automatically for any social links you've added under **Theme Settings → Social media**.
- **Payment icons**: toggle on/off to show the payment methods your store accepts.
- **Country/currency selector**: toggle on/off (see Navigation & Search above).
- **Newsletter signup**: a built-in email subscription form is always shown in the footer, adding subscribers to your customer list automatically.
- **App blocks**: apps that support theme blocks can be added to the footer the same way as the Product page (see App Blocks below).

---

## Customer Accounts

Jerry includes fully themed customer account pages — login, registration, account overview, order history, address book, and password reset — all matching your store's design. These work automatically once **Customer accounts** is set to "Classic" in **Settings → Customer accounts** in your Shopify admin.

---

## FAQ Page

The FAQ page uses a block-based accordion system:
1. Create a page in **Online Store → Pages** using the "FAQ" template.
2. In the Theme Editor, go to the FAQ section and add **Category Heading** blocks (e.g. "Orders", "Shipping") followed by **FAQ Item** blocks (question + answer) for each category.
3. Optionally add a **Note** block at the end for a closing message like "Still need help?".
4. Categories automatically arrange into a two-column layout on desktop and stack on mobile.

---

## Contact Page

Create a page using the "Contact" template to get a themed contact form with name, email, phone, and message fields, styled alongside a customizable intro panel.

---

## Blog & Articles

Standard Shopify blogs work out of the box with Jerry's styling — just create a blog and articles as usual in **Online Store → Blog posts**.

---

## App Blocks

If you install an app that provides theme app blocks (e.g. reviews, loyalty, upsells), you can add them directly to the **Product** and **Footer** sections via **Add block → [App name]** in the Theme Editor.

---

## Theme Settings

Click the gear icon (**Theme Settings**) at the bottom of the section list in the Theme Editor to access store-wide settings, organized into:

- **Typography** — fonts and sizing for headings and body text.
- **Layout** — page width and spacing.
- **Effects** — animation and visual effect toggles.
- **Breadcrumbs** — show/hide the breadcrumb trail on inner pages.
- **Cart & Shipping** — the free shipping threshold, used by the cart's progress bar and the `[amount]` token in the announcement bar (see above).
- **Product Badges** — enable/disable and label the New, Sale, Bestseller, and Sold Out badges.
- **Colors** — your store's color palette (primary, accent, backgrounds, etc.).
- **Buttons** — button corner radius and style.
- **Social media** — links to your social profiles, used by the footer's social icons.

Changes here apply site-wide, across every page.

---

## Multi-language & Multi-currency

Jerry's text is fully translatable through Shopify's standard **Settings → Languages** system, and supports Shopify Markets for multi-currency pricing automatically.

---

## Gift Cards

Jerry fully themes Shopify's built-in gift card product and redemption page to match your store — just enable gift cards under **Settings → Payments** (or create a gift card product) and it will use Jerry's styling automatically.

---

## 404 Page

If a shopper reaches a broken or missing link, Jerry shows a clean, on-brand "Page not found" screen with a button to return to shopping — no setup required.

---

## Browsing Experience

A few small touches that work automatically, with nothing to configure:
- **Back to top button**: appears once a shopper scrolls down a page, for quick navigation back to the top.
- **Scroll animations**: sections gently fade/slide into view as shoppers scroll down the page.
- **Accessibility**: keyboard navigation, screen reader labels, and focus indicators are built into every interactive element (menus, modals, forms, sliders).
- **Responsive design**: every page and section is optimized for mobile, tablet, and desktop screens automatically.

---

## Need Help?

If you run into any issues setting up Jerry, reach out to us at **manojprabhu101@gmail.com** and we'll help you get things sorted.
