# Whiskora Homepage Redesign Brief

Read this file before adjusting or redesigning the Whiskora homepage. Also read `WHISKORA_FRONTEND_DESIGN_GUIDANCE.md` for the broader product visual direction.

You are acting as a senior product designer, senior frontend engineer, and product storyteller for Whiskora.

Your task is to redesign the Whiskora homepage into a polished, production-ready landing page that clearly communicates what Whiskora is, why it matters, who it serves, and what features are available. The target quality should feel like a professional pet-tech platform website, not an AI-generated mockup, not a cute pet template, and not a generic SaaS landing page.

Whiskora is mobile-first. Most visitors and future users are expected to browse, create pet profiles, scan QR profiles, read articles, and check farm information from a phone. Design mobile flows, hierarchy, spacing, tap targets, and reading comfort first; then expand the same story into richer desktop layouts.

## Product Context

Whiskora is a pet-tech platform that connects pet owners, breeders, clinics, pet shops, and pet services through trusted pet data. Whiskora helps users create digital pet profiles, digital pet ID cards, public pet profiles with QR codes, health records, vaccination records, breeder profiles, verified breeder information, digital pedigree, ownership transfer, and future clinic/service integrations.

## Homepage Goal

When a first-time visitor lands on the homepage, they should immediately understand:

1. Whiskora is a trusted pet-life platform, not just a pet ID card generator.
2. Whiskora helps keep pet information organized, shareable, transparent, and verifiable.
3. Whiskora serves multiple user groups: pet owners, breeders, clinics, pet shops, and pet services.
4. The platform improves trust before adoption or purchase, care continuity after ownership, and data transparency across the pet ecosystem.
5. The tone should feel warm, trustworthy, premium, emotionally intelligent, and practical.

## Design And Storytelling Direction

Build the homepage around a strong narrative:

- Start with the real-world problem: pet information is scattered, health history is often forgotten, breeder trust is hard to verify, and every handover requires repeating important details.
- Introduce Whiskora as the system that connects pet identity, health, ownership, breeder trust, and care records in one place.
- Show what Whiskora makes possible through clear product pillars.
- Explain key features in a way normal users can understand.
- Include user-group sections for pet owners, breeders, clinics/services, and pet shops.
- End with a strong call to action to create a free pet profile / pet ID card or explore Whiskora.

## Suggested Homepage Structure

### 1. Header / Navigation

- Logo
- Product sections: Pet ID, Health Records, Breeders, Pedigree, Services/Clinics, Articles or Knowledge
- Login / Get Started CTA

### 2. Hero Section

- Strong headline about trusted pet identity and continuous care.
- Subheadline explaining that Whiskora keeps pet profiles, health records, breeder information, and shareable QR profiles connected in one platform.
- Primary CTA: Create Pet ID for Free
- Secondary CTA: Explore Whiskora
- Hero visual should feel like a real product preview, not a generic floating-card mockup.

### 3. Problem / Insight Section

Present 3-4 real user problems:

- Pet health history is scattered across memory, paper, chat, and photos.
- Owners often forget vaccine dates, deworming, treatments, or important care notes.
- Buyers cannot easily verify breeder transparency before deciding.
- Clinics, hotels, groomers, and caretakers often need the same pet information repeated.

Keep the tone helpful, not fear-based.

### 4. What Whiskora Makes Possible

Product pillars:

- Digital Pet Identity
- Health Records & Vaccination Book
- Public Pet Profile & QR Sharing
- Verified Breeder Profiles
- Digital Pedigree & Ownership Transfer
- Clinic & Service-ready Data Sharing

Each pillar should have a short title, one-line benefit, and concise explanation.

### 5. One Platform For Every Stage Of Pet Life

Structure by lifecycle:

- Create profile
- Record health
- Share with caretakers
- Verify breeder and lineage
- Transfer ownership
- Continue care with clinics/services

This section should make Whiskora feel like infrastructure for the pet ecosystem.

### 6. User Groups Section

- For Pet Owners: organize health records, share pet profile, create digital pet ID.
- For Breeders: show transparent profiles, manage litters, connect pedigree, build trust.
- For Clinics & Services: view accurate pet information faster and reduce repeated questions.
- For Pet Shops / Pet Businesses: connect services with verified pet profiles and owner needs.

Avoid making this look like generic persona cards. Make each group feel like a real use case.

### 7. Feature Showcase

Show 4-6 key features with realistic UI-focused copy:

- Free Pet ID Card
- QR Public Pet Profile
- Digital Health Book
- Vaccination Records
- Breeder Profile
- Digital Pedigree

Make the content readable and not too dense.

### 8. Trust / Verification Section

Explain Whiskora's trust layer:

- Registered breeder profiles
- Transparent pet information
- Digital records
- Review/verification readiness
- Future clinic and service integration

This section should feel credible and calm, not salesy.

### 9. Final CTA

- Invite users to start with a free pet profile or pet ID card.
- Make the CTA simple and emotionally warm.

## Visual Rules

- Do not use emojis as UI icons.
- Do not make the page look childish or overly cute.
- Do not overuse gradients, blobs, glassmorphism, sparkles, or decorative floating cards.
- Do not use fake stats unless there is a real source in the project.
- Do not make every section look equally important.
- Avoid generic SaaS layouts and AI mockup patterns.
- Use a warm, premium pet-care aesthetic with restrained colors, strong typography, clear spacing, and real product hierarchy.
- Thai text must be readable, natural, and visually balanced.
- The page must be responsive and polished on mobile and desktop.
- Homepage images should be visual-only when text, CTA buttons, logos, QR details, or verification seals are rendered by the website. Do not bake the Whiskora verification seal into hero backgrounds if the page overlays the real `verified.png` seal separately.

## Reference Direction From `Design Whiskora Homepage.zip`

Use the provided reference as design direction, not as code to copy directly. The reference is strongest when it behaves like a premium storytelling website: cinematic full-width sections, real pet/lifestyle imagery, and clear editorial rhythm. Do not follow its desktop-first instruction for Whiskora's production site; Whiskora's real product direction is mobile-first.

Apply these ideas to Whiskora:

- Prioritize the mobile website experience first, then expand to desktop. Avoid app-style navigation patterns, but make the phone experience the easiest and most polished version of the site.
- Use fewer, more meaningful sections with strong visual contrast instead of many same-looking cards.
- Let photography and wide visual panels carry the emotional tone, while HTML renders all real copy, CTAs, badges, logos, QR labels, and verification assets.
- Use website navigation patterns: top navigation, section anchors, clear CTA hierarchy, and footer links. Avoid app-style bottom navigation, tab bars, or phone-only interaction patterns on the public homepage.
- Keep motion optional and lightweight. Do not introduce new animation dependencies only to mimic the reference.
- Avoid copying reference elements that conflict with Whiskora's quality bar, especially emoji icons, fake stats, excessive floating mini-cards, and decorative product mockups that make the page feel like an app preview instead of a trustworthy web platform.
- Recommended homepage rhythm: hero, trust/problem insight, platform introduction, farm directory story, product pillars, lifecycle, ecosystem audiences, feature showcase, trust layer, knowledge center, FAQ, final CTA.

## Mobile Scroll Motion

Homepage movement should be mobile-first, lightweight, and functional. Use scroll reveal to help users feel progression between sections, not to decorate the page.

- Prefer subtle fade + short upward movement for section headers, cards, and large story panels.
- Keep mobile animation distance shorter than desktop so the page feels responsive while scrolling with a thumb.
- Avoid heavy parallax, continuous JavaScript scroll handlers, layout-shifting animation, or motion that could make long Thai text hard to read.
- Respect `prefers-reduced-motion` and show all content immediately for users who reduce motion.
- Do not add animation dependencies unless there is a clear product reason.

## Implementation Requirements

- First inspect the existing homepage route, components, design tokens, global styles, layout system, and existing Whiskora components.
- Reuse existing components and styling conventions where appropriate.
- Improve the actual homepage structure, content hierarchy, and visual quality, not just colors.
- Keep code maintainable, typed, responsive, and consistent with the current framework.
- Do not break authentication, routing, data fetching, or existing product logic.
- Add or improve empty/loading/error states only where relevant.
- Use realistic product copy instead of placeholder text.
- Run lint/typecheck/build if available and fix any issues.

## Before Editing

1. Audit the current homepage and identify why it currently feels unfinished, generic, or AI-generated.
2. Propose the new homepage structure.
3. Confirm which files/components will likely be changed.
4. Then implement.

## After Editing

1. Summarize what changed.
2. List changed files.
3. Mention checks run.
4. Mention anything that needs manual visual review.
