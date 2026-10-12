export const lightTheme = {
  // Base Surfaces (Crisp neutral porcelain canvas & pure elevated white cards)
  background: '#F9F8F6',        // Subtle warm porcelain light canvas
  card: '#FFFFFF',              // Pure crisp elevated white card
  cardSecondary: '#F8F6F2',     // Subtle sand container
  surfaceElevated: '#FFFFFF',   // 3D elevated floating tile
  surfaceDepressed: '#F1EFEA',  // Soft recessed container
  
  // Typography (Ultra-sharp high-contrast slate & warm charcoal)
  text: '#111827',              // Deep slate black
  textSecondary: '#4B5563',     // Neutral charcoal gray
  textMuted: '#9CA3AF',         // Soft guide gray
  
  // Primary: Eucalyptus Sage Green
  primary: '#059669',           // Muted Eucalyptus Forest
  primaryDark: '#047857',       // Deep Jade
  primaryLight: '#34D399',      // Soft luminous sage mint
  primaryLighter: '#A7F3D0',    // Delicate pastel sage
  primaryMuted: '#F0FDF4',      // Soft airy sage pod
  primarySoft: '#F0FDF4',       // Clean soft pod tint
  primaryBorder: '#A7F3D0',     // Delicate light sage border
  
  // Secondary: Warm Sand & Latte (The complementary accent!)
  secondary: '#C89565',         // Warm Sand Latte
  sand: '#D4A373',              // Earthy Warm Sand
  sandDark: '#B88758',          // Deep Latte
  sandLight: '#E8CAAE',         // Soft Sand
  sandLighter: '#F5E6D8',       // Delicate Latte wash
  sandPod: '#FAF4ED',           // Creamy warm sand pod
  sandBorder: '#E8D4C1',        // Soft sand border
  
  accent: '#C89565',            // Warm Sand accent
  emeraldSoft: '#F0FDF4',       // Clean mint tint
  emeraldBorder: '#A7F3D0',     // Light mint border
  
  gold: '#D4A373',              // Warm Sand Gold
  goldLight: '#FAF4ED',
  
  // Gradients (Sage Green + Warm Sand Latte Pairings)
  gradientPrimary: ['#34D399', '#059669'],       // Eucalyptus Sage gradient
  gradientPrimaryLight: ['#6EE7B7', '#10B981'],  // Gentle sage glow
  gradientSecondary: ['#E2B890', '#C89565'],     // Warm Sand Latte gradient
  gradientSand: ['#E2B890', '#C89565'],          // Warm Sand gradient
  gradientLight: ['#F0FDF4', '#DCFCE7'],         // Subtle sage pod wash
  gradientBanner: ['#34D399', '#059669'],        // Clean sage banner
  gradientBadge: ['#FAF4ED', '#F5E6D8'],         // Warm latte pill badge gradient
  gradientEmerald: ['#34D399', '#059669'],
  gradientEmeraldLight: ['#F0FDF4', '#DCFCE7'],
  
  // 3D & Glassmorphic Tokens
  border: '#E8E5DF',            // Clean neutral border
  cardBorder: 'rgba(232, 229, 223, 0.9)',
  cardShadow: 'rgba(17, 24, 39, 0.05)',          // Very subtle neutral shadow
  glassBackground: 'rgba(255, 255, 255, 0.96)',
  glassBorder: 'rgba(232, 229, 223, 0.8)',
  glowPrimary: 'rgba(5, 150, 105, 0.18)',
  glowAccent: 'rgba(200, 149, 101, 0.18)',
  glowGold: 'rgba(212, 163, 115, 0.2)',
  
  // 3D Icon Pods
  icon: '#4B5563',
  iconActive: '#059669',
  iconPodBg: '#F9F8F6',
  iconPodActiveBg: '#F0FDF4',
  iconPodBorder: '#A7F3D0',
  icon3DGlow: 'rgba(5, 150, 105, 0.14)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#FFFFFF',
  buttonBackground: '#059669',
  buttonGradient: ['#34D399', '#059669'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(255, 255, 255, 0.98)',
  tabBarBorder: 'rgba(232, 229, 223, 0.8)',

  // Feedback Colors
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export const darkTheme = {
  // Base Surfaces (Deep obsidian dark slate)
  background: '#0F1210',        // Deep obsidian night
  card: '#161D18',              // Elevated dark slate
  cardSecondary: '#1C251F',     // Tactile dark container
  surfaceElevated: '#223028',   // 3D raised glowing card
  surfaceDepressed: '#111713',  // 3D inset recessed field
  
  // Typography
  text: '#F8FAFC',              // Brilliant white
  textSecondary: '#94A3B8',     // Neutral slate
  textMuted: '#64748B',         // Muted gray
  
  // Brand & Accents
  primary: '#34D399',           // Luminous Sage Mint
  primaryDark: '#059669',
  primaryLight: '#6EE7B7',
  primaryLighter: '#A7F3D0',
  primaryMuted: '#152E22',
  primarySoft: '#102219',
  primaryBorder: 'rgba(52, 211, 153, 0.3)',
  
  // Secondary: Warm Sand in Dark Mode
  secondary: '#D4A373',         // Warm Sand
  sand: '#D4A373',
  sandDark: '#C89565',
  sandLight: '#E8CAAE',
  sandLighter: '#3D2A1C',
  sandPod: '#261C14',           // Dark warm sand pod
  sandBorder: 'rgba(212, 163, 115, 0.35)',
  
  accent: '#D4A373',            // Warm Sand accent
  emeraldSoft: '#064E3B',
  emeraldBorder: 'rgba(16, 185, 129, 0.3)',
  
  gold: '#D4A373',
  goldLight: 'rgba(212, 163, 115, 0.15)',
  
  // Gradients
  gradientPrimary: ['#34D399', '#059669'],
  gradientPrimaryLight: ['#6EE7B7', '#10B981'],
  gradientSecondary: ['#E2B890', '#C89565'],
  gradientSand: ['#E2B890', '#C89565'],
  gradientLight: ['#1C251F', '#121814'],
  gradientBanner: ['#34D399', '#059669'],
  gradientBadge: ['#261C14', '#1A130E'],
  gradientEmerald: ['#34D399', '#059669'],
  gradientEmeraldLight: ['#064E3B', '#022C22'],
  
  // 3D & Glassmorphic Tokens
  border: 'rgba(232, 229, 223, 0.1)',
  cardBorder: 'rgba(52, 211, 153, 0.15)',
  cardShadow: 'rgba(0, 0, 0, 0.7)',
  glassBackground: 'rgba(22, 29, 24, 0.92)',
  glassBorder: 'rgba(52, 211, 153, 0.2)',
  glowPrimary: 'rgba(52, 211, 153, 0.3)',
  glowAccent: 'rgba(212, 163, 115, 0.25)',
  glowGold: 'rgba(212, 163, 115, 0.3)',
  
  // 3D Icon Pods
  icon: '#94A3B8',
  iconActive: '#34D399',
  iconPodBg: '#1C251F',
  iconPodActiveBg: 'rgba(52, 211, 153, 0.18)',
  iconPodBorder: 'rgba(52, 211, 153, 0.35)',
  icon3DGlow: 'rgba(52, 211, 153, 0.3)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#161D18',
  buttonBackground: '#059669',
  buttonGradient: ['#34D399', '#059669'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(15, 18, 16, 0.95)',
  tabBarBorder: 'rgba(232, 229, 223, 0.1)',

  // Feedback Colors
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#F59E0B',
};
