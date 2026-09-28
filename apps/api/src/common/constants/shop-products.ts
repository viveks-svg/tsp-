// Shop prices the server charges, in PAISE. The website shows the same list
// (tsp-frontend-web/src/lib/data/shop.ts) — change both together.
// Checkout never trusts a price sent by the browser.

export const SHOP_PRODUCTS: Record<string, { name: string; pricePaise: number }> = {
  "prod-1": { name: "Metal Dhan Yog Bracelet for Women", pricePaise: 89900 }, // ₹899
  "prod-2": { name: "Dhan Yog Bracelet (Lab Certified)", pricePaise: 69900 }, // ₹699
  "prod-3": { name: "Gemini (Mithun) Zodiac Green Aventurine & Milky Quartz Bracelet", pricePaise: 79900 }, // ₹799
  "prod-4": { name: "Metal Dhan Yog Bracelet - Silver", pricePaise: 99900 }, // ₹999
  "prod-5": { name: "Kashi Siddha Rudraksha Mala (108+1 Beads)", pricePaise: 129900 }, // ₹1299
  "prod-6": { name: "Vastu Copper Pyramid for Home Prosperity", pricePaise: 149900 }, // ₹1499
  "prod-7": { name: "Certified Natural Yellow Sapphire Gemstone (Pukhraj)", pricePaise: 499900 }, // ₹4999
  "prod-8": { name: "Dhan Yog Pyrite Crystal Cluster", pricePaise: 89900 }, // ₹899
};
