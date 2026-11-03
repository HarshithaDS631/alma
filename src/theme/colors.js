export const lightTheme = {
  // Base Surfaces (Crisp neutral porcelain canvas & pure elevated white cards)
  background: '#F8FAFC',        // Crisp refined slate porcelain canvas
  card: '#FFFFFF',              // Pure elevated white card
  cardSecondary: '#F1F5F9',     // Subtle tactile slate container
  surfaceElevated: '#FFFFFF',   // 3D elevated floating tile
  surfaceDepressed: '#E2E8F0',  // Soft recessed container
  
  // Typography (Ultra-sharp high-contrast deep navy slate & readable charcoal)
  text: '#0A192F',              // Deep Midnight Navy black (maximum visibility & contrast)
  textSecondary: '#334155',     // Crisp readable slate charcoal
  textMuted: '#64748B',         // Medium guide slate
  textGold: '#B45309',          // Rich readable amber-gold text
  textWhite: '#FFFFFF',         // Pure white for dark pill buttons
  
  // Primary: Royal Midnight Navy
  primary: '#0F2C59',           // Formal Royal Deep Navy
  primaryDark: '#0A192F',       // Midnight Navy
  primaryLight: '#1E3A8A',      // Royal Azure Blue
  primaryLighter: '#3B82F6',    // Electric Royal Accent
  primaryMuted: '#EFF6FF',      // Soft luminous icy navy wash
  primarySoft: '#F0F4FA',       // Clean soft navy tint
  primaryBorder: '#CBD5E1',     // Delicate high-contrast border
  
  // Secondary: Warm Imperial Gold (The prestigious academic accent)
  secondary: '#D4AF37',         // Warm Imperial Gold
  gold: '#D4AF37',              // Imperial Gold
  goldDark: '#B45309',          // Deep Burnished Gold (ultra-readable on light)
  goldLight: '#FDF6E2',         // Soft Champagne Cream
  goldLighter: '#FEF9C3',       // Delicate butter champagne
  goldPod: '#FAF5EB',           // Creamy warm gold pod
  goldBorder: 'rgba(212, 175, 55, 0.45)', // Refined gold hairline border
  accent: '#D4AF37',            // Imperial Gold accent
  
  // Backward-compatibility mappings
  sand: '#D4AF37',
  sandDark: '#B45309',
  sandLight: '#FDF6E2',
  sandLighter: '#FEF9C3',
  sandPod: '#FAF5EB',
  sandBorder: 'rgba(212, 175, 55, 0.45)',
  emeraldSoft: '#EFF6FF',
  emeraldBorder: 'rgba(30, 58, 138, 0.25)',
  
  // Gradients (Royal Midnight + Warm Imperial Gold Pairings)
  gradientPrimary: ['#0A192F', '#0F2C59', '#1E3A8A'],       // Royal Midnight gradient
  gradientPrimaryLight: ['#1E3A8A', '#3B82F6'],             // Luminous Royal Azure
  gradientSecondary: ['#F59E0B', '#D4AF37', '#C5A059'],     // Warm Imperial Gold gradient
  gradientGold: ['#F59E0B', '#D4AF37', '#C5A059'],          // Radiant gold
  gradientSand: ['#F59E0B', '#D4AF37'],
  gradientLight: ['#F0F4FA', '#EFF6FF'],                    // Subtle navy pod wash
  gradientBanner: ['#0A192F', '#0F2C59', '#1E3A8A'],        // Executive banner gradient
  gradientBadge: ['#FAF5EB', '#FDF6E2'],                    // Champagne pill badge gradient
  gradientEmerald: ['#0A192F', '#1E3A8A'],
  gradientEmeraldLight: ['#F0F4FA', '#EFF6FF'],
  
  // 3D & Glassmorphic Tokens
  border: '#E2E8F0',                                        // Clean crisp border
  cardBorder: 'rgba(212, 175, 55, 0.22)',                   // Subtle gold foil border
  cardShadow: 'rgba(10, 25, 47, 0.08)',                     // Subtle deep navy shadow
  glassBackground: 'rgba(255, 255, 255, 0.96)',
  glassBorder: 'rgba(212, 175, 55, 0.28)',
  glowPrimary: 'rgba(15, 44, 89, 0.18)',
  glowAccent: 'rgba(212, 175, 55, 0.25)',
  glowGold: 'rgba(212, 175, 55, 0.28)',
  
  // 3D Icon Pods
  icon: '#334155',
  iconActive: '#0F2C59',
  iconPodBg: '#F1F5F9',
  iconPodActiveBg: '#F0F4FA',
  iconPodBorder: 'rgba(212, 175, 55, 0.4)',
  icon3DGlow: 'rgba(15, 44, 89, 0.16)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#FFFFFF',
  buttonBackground: '#0F2C59',
  buttonGradient: ['#0A192F', '#0F2C59', '#1E3A8A'],
  buttonText: '#FFFFFF',
  buttonGold: '#D4AF37',
  tabBarBg: 'rgba(255, 255, 255, 0.98)',
  tabBarBorder: 'rgba(212, 175, 55, 0.25)',

  // Feedback Colors
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
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
  textGold: '#FDE68A',          // Radiant champagne gold for accents
  textWhite: '#FFFFFF',
  
  // Brand & Accents (Luminous Azure & Warm Imperial Gold)
  primary: '#3B82F6',           // Luminous Royal Azure
  primaryDark: '#1E3A8A',       // Royal Navy
  primaryLight: '#60A5FA',      // Soft Luminous Azure
  primaryLighter: '#93C5FD',    // Pastel Azure
  primaryMuted: '#0E1F3D',      // Deep royal pod wash
  primarySoft: '#0A192F',       // Midnight navy pod tint
  primaryBorder: 'rgba(59, 130, 246, 0.4)',
  
  // Secondary: Warm Imperial Gold in Dark Mode
  secondary: '#D4AF37',         // Warm Imperial Gold
  gold: '#D4AF37',              // Imperial Gold
  goldDark: '#C5A059',          // Warm Antique Gold
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
  
  // Gradients
  gradientPrimary: ['#0A192F', '#0F2C59', '#1E3A8A'],
  gradientPrimaryLight: ['#1E3A8A', '#3B82F6'],
  gradientSecondary: ['#F59E0B', '#D4AF37', '#C5A059'],
  gradientGold: ['#F59E0B', '#D4AF37', '#C5A059'],
  gradientSand: ['#F59E0B', '#D4AF37'],
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
  iconActive: '#FDE68A',
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
  warning: '#F59E0B',
};
