// Strictly 2 Colors: Royal Midnight Navy Blue & Warm Imperial Gold
// Executive institutional luxury aesthetic - zero orange/amber, zero white-blank voids

export const lightTheme = {
  // Base Surfaces (Signature Deep Royal Navy Canvas)
  background: '#070D1E',        // Deep Obsidian Navy (no white blank page!)
  card: '#0D1B3A',              // Elevated Royal Navy card
  cardSecondary: '#13234A',     // Tactile navy container
  surfaceElevated: '#172B5C',   // 3D raised glowing card
  surfaceDepressed: '#050A18',  // Recessed field
  
  // Typography (Ultra-sharp high-contrast luminous white & radiant imperial gold)
  text: '#FFFFFF',              // Pure crisp white (maximum readability)
  textSecondary: '#E2E8F0',     // High-contrast ice slate
  textMuted: '#94A3B8',         // Clear secondary gray
  textGold: '#D4AF37',          // Pure Imperial Gold (NO orange)
  textWhite: '#FFFFFF',         // Pure white
  
  // Primary: Royal Midnight Navy
  primary: '#0F2C59',           // Formal Royal Deep Navy
  primaryDark: '#0A192F',       // Midnight Navy
  primaryLight: '#1E3A8A',      // Royal Azure Blue
  primaryLighter: '#3B82F6',    // Electric Royal Accent
  primaryMuted: '#102247',      // Luminous deep navy wash
  primarySoft: '#0A192F',       // Midnight navy tint
  primaryBorder: 'rgba(59, 130, 246, 0.4)',
  
  // Secondary: Pure Imperial Gold (The single prestige accent color - NO orange)
  secondary: '#D4AF37',         // Pure Imperial Gold
  gold: '#D4AF37',              // Imperial Gold
  goldDark: '#C5A059',          // Deep Antique Gold (NO orange)
  goldLight: 'rgba(212, 175, 55, 0.2)', // Soft gold glow wash
  goldLighter: '#FDE68A',       // Luminous Champagne Gold
  goldPod: '#16130B',           // Dark gold pod
  goldBorder: 'rgba(212, 175, 55, 0.5)', // Pure gold hairline border
  accent: '#D4AF37',            // Imperial Gold accent
  
  // Backward-compatibility mappings
  sand: '#D4AF37',
  sandDark: '#C5A059',
  sandLight: '#FDE68A',
  sandLighter: '#16130B',
  sandPod: '#16130B',
  sandBorder: 'rgba(212, 175, 55, 0.5)',
  emeraldSoft: '#102247',
  emeraldBorder: 'rgba(59, 130, 246, 0.35)',
  
  // Gradients (Strictly Blue & Gold - Zero Orange)
  gradientPrimary: ['#0A192F', '#0F2C59', '#1E3A8A'],       // Royal Midnight Blue gradient
  gradientPrimaryLight: ['#1E3A8A', '#3B82F6'],             // Luminous Royal Azure
  gradientSecondary: ['#C5A059', '#D4AF37', '#FFD700'],     // Pure Imperial Gold gradient (NO orange)
  gradientGold: ['#C5A059', '#D4AF37', '#FFD700'],          // Radiant gold shimmer
  gradientSand: ['#C5A059', '#D4AF37'],                     // Pure gold
  gradientLight: ['#0D1B3A', '#070D1E'],                    // Deep blue pod wash
  gradientBanner: ['#0A192F', '#0F2C59', '#1E3A8A'],        // Executive banner gradient
  gradientBadge: ['#16130B', '#261F0E'],                    // Champagne gold pill badge gradient
  gradientEmerald: ['#0A192F', '#1E3A8A'],
  gradientEmeraldLight: ['#102247', '#0A192F'],
  
  // 3D & Glassmorphic Tokens
  border: 'rgba(226, 232, 240, 0.15)',                     // Clean subtle border
  cardBorder: 'rgba(212, 175, 55, 0.35)',                   // Luxury gold foil border
  cardShadow: 'rgba(0, 0, 0, 0.75)',                       // Deep shadow
  glassBackground: 'rgba(13, 27, 58, 0.95)',
  glassBorder: 'rgba(212, 175, 55, 0.35)',
  glowPrimary: 'rgba(59, 130, 246, 0.35)',
  glowAccent: 'rgba(212, 175, 55, 0.35)',
  glowGold: 'rgba(212, 175, 55, 0.4)',
  
  // 3D Icon Pods
  icon: '#CBD5E1',
  iconActive: '#D4AF37',
  iconPodBg: '#13234A',
  iconPodActiveBg: 'rgba(212, 175, 55, 0.2)',
  iconPodBorder: 'rgba(212, 175, 55, 0.45)',
  icon3DGlow: 'rgba(212, 175, 55, 0.3)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#0D172E',
  buttonBackground: '#0F2C59',
  buttonGradient: ['#0A192F', '#0F2C59', '#1E3A8A'],
  buttonText: '#FFFFFF',
  buttonGold: '#D4AF37',
  tabBarBg: 'rgba(7, 13, 30, 0.98)',
  tabBarBorder: 'rgba(212, 175, 55, 0.28)',

  // Feedback Colors (Strictly Blue, Gold, Green for success, Red for danger)
  success: '#10B981',
  danger: '#EF4444',
  warning: '#D4AF37', // Pure Gold (NO orange)
};

export const darkTheme = {
  // Base Surfaces (Deep obsidian midnight navy)
  background: '#070C18',        // Deep Obsidian Midnight Black-Navy
  card: '#0A1224',              // Elevated Midnight Slate card
  cardSecondary: '#131D38',     // Tactile dark navy container
  surfaceElevated: '#172342',   // 3D raised glowing card
  surfaceDepressed: '#050912',  // 3D inset recessed field
  
  // Typography (Luminous brilliant white & high-contrast crisp text)
  text: '#FFFFFF',              // Pure luminous white (maximum visibility)
  textSecondary: '#E2E8F0',     // High-contrast soft pearl slate (ultra readable)
  textMuted: '#94A3B8',         // Clear secondary gray
  textGold: '#D4AF37',          // Pure Imperial Gold (NO orange)
  textWhite: '#FFFFFF',
  
  // Brand & Accents (Luminous Azure & Warm Imperial Gold)
  primary: '#3B82F6',           // Luminous Royal Azure
  primaryDark: '#1E3A8A',       // Royal Navy
  primaryLight: '#60A5FA',      // Soft Luminous Azure
  primaryLighter: '#93C5FD',    // Pastel Azure
  primaryMuted: '#0E1F3D',      // Deep royal pod wash
  primarySoft: '#0A192F',       // Midnight navy pod tint
  primaryBorder: 'rgba(59, 130, 246, 0.4)',
  
  // Secondary: Warm Imperial Gold in Dark Mode (NO orange)
  secondary: '#D4AF37',         // Warm Imperial Gold
  gold: '#D4AF37',              // Imperial Gold
  goldDark: '#C5A059',          // Warm Antique Gold (NO orange)
  goldLight: 'rgba(212, 175, 55, 0.2)', // Soft gold glow wash
  goldLighter: '#FDE68A',       // Luminous Champagne
  goldPod: '#1A150A',           // Deep dark gold pod
  goldBorder: 'rgba(212, 175, 55, 0.45)', // Gilded border
  accent: '#D4AF37',            // Imperial Gold accent
  
  // Backward-compatibility mappings
  sand: '#D4AF37',
  sandDark: '#C5A059',
  sandLight: '#FDE68A',
  sandLighter: '#1A150A',
  sandPod: '#1A150A',
  sandBorder: 'rgba(212, 175, 55, 0.45)',
  emeraldSoft: '#0E1F3D',
  emeraldBorder: 'rgba(59, 130, 246, 0.35)',
  
  // Gradients (Strictly Blue & Gold - Zero Orange)
  gradientPrimary: ['#0A192F', '#0F2C59', '#1E3A8A'],
  gradientPrimaryLight: ['#1E3A8A', '#3B82F6'],
  gradientSecondary: ['#C5A059', '#D4AF37', '#FFD700'], // Pure gold (NO orange)
  gradientGold: ['#C5A059', '#D4AF37', '#FFD700'],      // Pure gold (NO orange)
  gradientSand: ['#C5A059', '#D4AF37'],
  gradientLight: ['#131D38', '#0A1224'],
  gradientBanner: ['#0A192F', '#0F2C59', '#1E3A8A'],
  gradientBadge: ['#1A150A', '#2D220B'],
  gradientEmerald: ['#0A192F', '#1E3A8A'],
  gradientEmeraldLight: ['#0E1F3D', '#0A192F'],
  
  // 3D & Glassmorphic Tokens
  border: 'rgba(226, 232, 240, 0.12)',
  cardBorder: 'rgba(212, 175, 55, 0.3)',                    // Luxury gold hairline border
  cardShadow: 'rgba(0, 0, 0, 0.85)',
  glassBackground: 'rgba(10, 18, 36, 0.94)',
  glassBorder: 'rgba(212, 175, 55, 0.35)',
  glowPrimary: 'rgba(59, 130, 246, 0.35)',
  glowAccent: 'rgba(212, 175, 55, 0.35)',
  glowGold: 'rgba(212, 175, 55, 0.4)',
  
  // 3D Icon Pods
  icon: '#CBD5E1',
  iconActive: '#D4AF37',
  iconPodBg: '#131D38',
  iconPodActiveBg: 'rgba(212, 175, 55, 0.18)',
  iconPodBorder: 'rgba(212, 175, 55, 0.45)',
  icon3DGlow: 'rgba(212, 175, 55, 0.3)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#0D172E',
  buttonBackground: '#0F2C59',
  buttonGradient: ['#0A192F', '#0F2C59', '#1E3A8A'],
  buttonText: '#FFFFFF',
  buttonGold: '#D4AF37',
  tabBarBg: 'rgba(7, 12, 24, 0.97)',
  tabBarBorder: 'rgba(212, 175, 55, 0.28)',

  // Feedback Colors
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#D4AF37', // Pure Gold (NO orange)
};
