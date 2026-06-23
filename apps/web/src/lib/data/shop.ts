export interface Product {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice: number;
  image: string;
  category: string; // 'bracelets' | 'rudraksha' | 'vastu' | 'gemstones' | 'crystals'
  badge?: string;
  description: string;
}

export const SHOP_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Metal Dhan Yog Bracelet for Women",
    rating: 5.0,
    reviewCount: 1656,
    price: 899,
    originalPrice: 1400,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=400&q=80",
    category: "bracelets",
    badge: "50% OFF",
    description: "Handcrafted metal beads combined with wealth-attracting crystals. Tailored specifically for women to welcome financial growth, harmony, and positivity."
  },
  {
    id: "prod-2",
    name: "Dhan Yog Bracelet (Lab Certified)",
    rating: 5.0,
    reviewCount: 1612,
    price: 699,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80",
    category: "bracelets",
    badge: "Best Seller",
    description: "Lab-certified authentic gemstones including pyrite, green aventurine, and tiger's eye. Designed to align your chakras for abundance and luck."
  },
  {
    id: "prod-3",
    name: "Gemini (Mithun) Zodiac Green Aventurine & Milky Quartz Bracelet",
    rating: 5.0,
    reviewCount: 1932,
    price: 799,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80",
    category: "bracelets",
    badge: "Zodiac Special",
    description: "Specialized planetary alignment bracelet for Gemini. Green Aventurine aids intellect, while Milky Quartz brings tranquility and emotional balance."
  },
  {
    id: "prod-4",
    name: "Metal Dhan Yog Bracelet - Silver",
    rating: 5.0,
    reviewCount: 718,
    price: 999,
    originalPrice: 1700,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=400&q=80",
    category: "bracelets",
    badge: "Premium Silver",
    description: "Sleek silver-coated dhan yog beads. Enhances decision-making skills and protects against negative financial energies."
  },
  {
    id: "prod-5",
    name: "Kashi Siddha Rudraksha Mala (108+1 Beads)",
    rating: 4.9,
    reviewCount: 845,
    price: 1299,
    originalPrice: 2500,
    image: "https://images.unsplash.com/photo-1685419368164-eb624c946062?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "rudraksha",
    badge: "Siddh Collection",
    description: "Energized Panchmukhi Rudraksha beads from Kashi. Ideal for meditation, concentration, and building a powerful protective aura."
  },
  {
    id: "prod-6",
    name: "Vastu Copper Pyramid for Home Prosperity",
    rating: 4.8,
    reviewCount: 520,
    price: 1499,
    originalPrice: 3000,
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=400&q=80",
    category: "vastu",
    badge: "Vastu Correction",
    description: "Pure copper multi-layered pyramid. Neutralizes negative energy flow and brings wealth and health to the living space."
  },
  {
    id: "prod-7",
    name: "Certified Natural Yellow Sapphire Gemstone (Pukhraj)",
    rating: 5.0,
    reviewCount: 341,
    price: 4999,
    originalPrice: 8000,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
    category: "gemstones",
    badge: "Certified Gem",
    description: "Natural 4.25 Carat Yellow Sapphire representing Lord Jupiter. Highly auspicious for wealth, intellect, marriage, and career growth."
  },
  {
    id: "prod-8",
    name: "Dhan Yog Pyrite Crystal Cluster",
    rating: 4.9,
    reviewCount: 622,
    price: 899,
    originalPrice: 1800,
    image: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=400&q=80",
    category: "crystals",
    badge: "Fool's Gold",
    description: "Raw high-grade Pyrite Cluster. Place on your study table, cash register, or office desk to attract high wealth opportunities."
  }
];
