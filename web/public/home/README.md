# Whiskora Homepage Images

Generated homepage visuals should stay visual-only. Do not embed readable text, CTA buttons, logos, QR labels, or Whiskora verification seals into background images when the website renders those elements separately in HTML/CSS. In particular, hero backgrounds should not contain a baked Whiskora Verified stamp if `/verified.png` is already overlaid by the page.

Use URL-safe English file names for images in this folder. Thai file names can work locally, but English lowercase names are safer for deploys, CDNs, and image optimization.

- `hero-cover.png` - full first-screen homepage cover, provided from `หน้าปกหน้าแรก.png`, recommended 1680 x 950.
- `farm-promo.png` - farm promotion section with the "ดูฟาร์มทั้งหมด" call to action, recommended 1672 x 941.
- `hero-visual-desktop-v1.png` - generated visual-only desktop hero background, no text embedded.
- `hero-visual-mobile-v1.png` - generated visual-only mobile hero background, no text embedded.
- `farm-promo-visual-desktop-v1.png` - generated visual-only desktop farm promotion background, no text embedded.
- `farm-promo-visual-mobile-v1.png` - generated visual-only mobile farm promotion background, no text embedded.

## Optional Split Image Slots

Replace these placeholder slots with real transparent PNG images:

- `hero-pets.png` - hero foreground pets, transparent background, recommended 1200 x 760.
- `hero-phone-profile.png` - phone mockup showing Pet ID / QR Profile, transparent background, recommended 720 x 1050.
- `profile-phone.png` - close-up phone mockup for the profile section, transparent background, recommended 620 x 1050.
- `dashboard-cat.png` - sitting cat for the breeder dashboard section, transparent background, recommended 520 x 420.
- `cta-cat.png` - cute white cat for the pink CTA footer, transparent background, recommended 620 x 520.
