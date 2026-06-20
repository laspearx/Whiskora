# Whiskora Frontend Design Guidance

Read this file before adjusting or redesigning any Whiskora frontend screen.

For homepage-specific redesign work, also read `WHISKORA_HOMEPAGE_REDESIGN_BRIEF.md`.

Whiskora is a premium pet-tech platform, not a cute pet toy app and not a generic SaaS dashboard. The interface should feel warm, trustworthy, polished, calm, and production-ready.

## Brand Personality

Whiskora should communicate:

- Trust and transparency
- Warmth without being childish
- Premium care without feeling cold
- Data-driven pet ownership
- Safety for owners, breeders, clinics, and pet services

Avoid:

- Emoji-heavy UI
- Generic AI mockup layouts
- Excessive gradients
- Random floating cards
- Fake decorative stats
- Overly cute mascot-style design
- Cluttered pastel UI
- One-off components that ignore the existing design system

## Visual Direction

Use soft premium pet-care aesthetics. The UI should feel like a real product that users can trust with pet identity, health records, breeder verification, ownership transfer, vaccination records, digital pedigree, and clinic visibility.

Design should prioritize:

- Clear hierarchy
- Strong typography
- Thoughtful whitespace
- Realistic content density
- Consistent cards and sections
- Accessible contrast
- Smooth responsive behavior
- Clean Thai language rendering
- Professional empty, loading, and error states

## Image And Asset Rules

Generated or prepared website images should be visual-only whenever the interface will render the brand, copy, CTA, QR, product labels, or verification seal separately in code.

- Do not bake Thai/English text into hero, promo, or section images if the text should be readable, searchable, translated, or responsive.
- Do not embed the Whiskora verification seal into background images when the site overlays the real `verified.png` asset separately.
- Do not embed duplicate logos, badges, buttons, UI labels, or certification marks that could conflict with real HTML/CSS components.
- Keep desktop and mobile image variants composed for their target aspect ratio, but let the web layout own text placement, buttons, badges, and trust marks.
- Prefer clean source images with enough safe space for responsive overlays instead of tightly cropped mockups that force text or seals to overlap pets, phones, or product UI.
- When replacing generated images, update both the source image folder and the matching `web/public` asset when both are used by the project.

## Component Rules

Reuse existing components and tokens whenever possible. Do not create duplicate card, button, badge, layout, or form styles unless there is a clear reason. Keep components maintainable, typed, and consistent with the framework.

Every redesigned screen should include:

- Desktop and mobile responsiveness
- Realistic states
- Clear CTA hierarchy
- No broken routing
- No unnecessary business logic changes
- No decorative UI that harms clarity

## Quality Bar

A finished Whiskora screen should look like a real production interface from a thoughtful pet-tech startup. It should not look like a quick Dribbble mockup, landing-page template, or AI-generated sample app.
