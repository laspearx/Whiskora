// Website design tokens
export const W = {
  // Brand
  pink: "#E84677",
  pinkDark: "#C53562",
  pinkLight: "#F5729A",
  pinkBg: "#FFF0F5",
  pinkGlow: "rgba(232,70,119,0.18)",

  // Dark surfaces
  dark: "#060914",
  darkCard: "#0D1225",
  darkBorder: "rgba(255,255,255,0.08)",
  darkMuted: "rgba(255,255,255,0.45)",

  // Light surfaces
  cream: "#FFFAFC",
  light: "#F8FAFC",
  lightCard: "#FFFFFF",
  border: "#E8EDF5",

  // Text
  white: "#FFFFFF",
  ink: "#0B0D1A",
  inkMid: "#2D3348",
  muted: "#64748B",

  // Accent (kept for verified badges etc.)
  indigo: "#4F46E5",
  emerald: "#10B981",

  // Easing
  ease: [0.22, 1, 0.36, 1] as const,
};

// Curated image set
export const IMG = {
  // Hero
  heroMain: "https://images.unsplash.com/photo-1680330385871-630d91dd52da?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=90&w=1400&h=1000",
  heroCat: "https://images.unsplash.com/photo-1611843275167-a9bba9aa65dd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=90&w=900&h=1200",

  // Pets
  whitePersian: "https://images.unsplash.com/photo-1592385672401-ab91fccb6fd5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",
  tabbyCat: "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",
  kittenPink: "https://images.unsplash.com/photo-1614035030394-b6e5b01e0737?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=500&h=500",
  goldenPuppy: "https://images.unsplash.com/photo-1592769606534-fe78d27bf450?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=600",
  corgi: "https://images.unsplash.com/photo-1774347119444-4173d24846bd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=500&h=700",
  goldenSnow: "https://images.unsplash.com/photo-1615233500064-caa995e2f9dd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",
  catCouch: "https://images.unsplash.com/photo-1645322044534-09e32fdf5297?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=400",
  catReach: "https://images.unsplash.com/photo-1781187109836-36956dace181?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",

  // Lifestyle
  womanDog: "https://images.unsplash.com/photo-1563237481-693b5bc6423e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=700&h=900",
  womanHug: "https://images.unsplash.com/photo-1592951117966-baa457963d25?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=800&h=600",

  // Services
  vet: "https://images.unsplash.com/photo-1770836037275-38b44e4b101f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",
  grooming: "https://images.unsplash.com/photo-1611173622933-91942d394b04?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",
  groomingScissors: "https://images.unsplash.com/photo-1719464454959-9cf304ef4774?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=600&h=500",
};

export const SPRING = { type: "spring", stiffness: 80, damping: 20 };
