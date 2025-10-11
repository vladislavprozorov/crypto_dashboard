
export const DASHBOARD_CONSTANTS = {
  BITCOIN_PRICE_THRESHOLD: 5,
  WALLET_ADDRESS_DISPLAY_LENGTH: 8,
  SKELETON_ITEMS_COUNT: 4,
  STYLES: {
    BUTTON: "px-4 py-2 rounded-md neon-border text-sm text-cyan-200 hover:scale-105 transition",
    CONTAINER: "neon-border rounded-2xl p-6",
    HEADER: "text-4xl font-extrabold header-neon",
    SKELETON: "p-6 rounded-2xl neon-border neon-glow h-32"
  },
  MOTION_VARIANTS: {
    hidden: {},
    visible: { 
      transition: { staggerChildren: 0.06 } 
    }
  }
};