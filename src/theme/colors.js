export const lightTheme = {
  // Base Surfaces (Pure crisp neutral white & slate canvas - Minimalist, NOT tinted!)
  background: '#F8FAFC',        // Modern clean neutral canvas
  card: '#FFFFFF',              // Pure crisp elevated white card
  cardSecondary: '#F8FAFC',     // Clean neutral container
  surfaceElevated: '#FFFFFF',   // 3D elevated floating tile
  surfaceDepressed: '#F1F5F9',  // Soft recessed container
  
  // Typography (Ultra-sharp high-contrast slate & charcoal)
  text: '#0F172A',              // Deep slate black
  textSecondary: '#475569',     // Neutral charcoal gray
  textMuted: '#94A3B8',         // Soft guide gray
  
  // Brand & Accents (Option 4: Eucalyptus Sage - Used Minimally)
  primary: '#059669',           // Muted Eucalyptus Forest
  primaryDark: '#047857',       // Deep Jade
  primaryLight: '#34D399',      // Soft luminous sage mint
  primaryLighter: '#A7F3D0',    // Delicate pastel sage
  primaryMuted: '#F0FDF4',      // Soft airy sage cream pod
  primarySoft: '#F0FDF4',       // Clean soft pod tint
  primaryBorder: '#A7F3D0',     // Delicate light sage border
  
  accent: '#10B981',            // Fresh Sage
  secondary: '#14B8A6',         // Eucalyptus Teal
  emeraldSoft: '#F0FDF4',       // Clean mint tint
  emeraldBorder: '#A7F3D0',     // Light mint border
  
  gold: '#F59E0B',              // Amber Gold
  goldLight: '#FEF3C7',
  
  // Eucalyptus Sage Gradients (Minimal on buttons & headers)
  gradientPrimary: ['#34D399', '#059669'],       // Soft eucalyptus gradient
  gradientPrimaryLight: ['#6EE7B7', '#10B981'],  // Gentle sage glow
  gradientLight: ['#F0FDF4', '#DCFCE7'],         // Subtle pod wash
  gradientBanner: ['#34D399', '#059669'],        // Clean banner gradient
  gradientBadge: ['#F0FDF4', '#DCFCE7'],         // Subtle pill badge gradient
  gradientEmerald: ['#34D399', '#059669'],
  gradientEmeraldLight: ['#F0FDF4', '#DCFCE7'],
  
  // 3D & Glassmorphic Tokens
  border: '#E2E8F0',            // Clean neutral border
  cardBorder: 'rgba(226, 232, 240, 0.9)',
  cardShadow: 'rgba(15, 23, 42, 0.05)',          // Very subtle neutral shadow
  glassBackground: 'rgba(255, 255, 255, 0.96)',
  glassBorder: 'rgba(226, 232, 240, 0.8)',
  glowPrimary: 'rgba(5, 150, 105, 0.18)',
  glowAccent: 'rgba(16, 185, 129, 0.16)',
  glowGold: 'rgba(245, 158, 11, 0.22)',
  
  // 3D Icon Pods (Subtle, clean pods)
  icon: '#475569',
  iconActive: '#059669',
  iconPodBg: '#F8FAFC',
  iconPodActiveBg: '#F0FDF4',
  iconPodBorder: '#A7F3D0',
  icon3DGlow: 'rgba(5, 150, 105, 0.14)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#FFFFFF',
  buttonBackground: '#059669',
  buttonGradient: ['#34D399', '#059669'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(255, 255, 255, 0.98)',
  tabBarBorder: 'rgba(226, 232, 240, 0.8)',

  // Feedback Colors
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export const darkTheme = {
  // Base Surfaces (Deep obsidian dark slate)
  background: '#0B0F14',        // Deep obsidian night
  card: '#121A16',              // Elevated dark slate
  cardSecondary: '#18241F',     // Tactile dark container
  surfaceElevated: '#1E2F28',   // 3D raised glowing card
  surfaceDepressed: '#0F1612',  // 3D inset recessed field
  
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
  
  accent: '#10B981',            // Fresh Sage
  secondary: '#14B8A6',
  emeraldSoft: '#064E3B',
  emeraldBorder: 'rgba(16, 185, 129, 0.3)',
  
  gold: '#FBBF24',
  goldLight: 'rgba(251, 191, 36, 0.15)',
  
  // Gradients
  gradientPrimary: ['#34D399', '#059669'],
  gradientPrimaryLight: ['#6EE7B7', '#10B981'],
  gradientLight: ['#18241F', '#101714'],
  gradientBanner: ['#34D399', '#059669'],
  gradientBadge: ['#1A2B23', '#111C17'],
  gradientEmerald: ['#34D399', '#059669'],
  gradientEmeraldLight: ['#064E3B', '#022C22'],
  
  // 3D & Glassmorphic Tokens
  border: 'rgba(226, 232, 240, 0.1)',
  cardBorder: 'rgba(52, 211, 153, 0.15)',
  cardShadow: 'rgba(0, 0, 0, 0.7)',
  glassBackground: 'rgba(18, 26, 22, 0.92)',
  glassBorder: 'rgba(52, 211, 153, 0.2)',
  glowPrimary: 'rgba(52, 211, 153, 0.3)',
  glowAccent: 'rgba(16, 185, 129, 0.25)',
  glowGold: 'rgba(251, 191, 36, 0.3)',
  
  // 3D Icon Pods
  icon: '#94A3B8',
  iconActive: '#34D399',
  iconPodBg: '#18241F',
  iconPodActiveBg: 'rgba(52, 211, 153, 0.18)',
  iconPodBorder: 'rgba(52, 211, 153, 0.35)',
  icon3DGlow: 'rgba(52, 211, 153, 0.3)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#121A16',
  buttonBackground: '#059669',
  buttonGradient: ['#34D399', '#059669'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(11, 15, 20, 0.95)',
  tabBarBorder: 'rgba(226, 232, 240, 0.1)',

  // Feedback Colors
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#F59E0B',
};
