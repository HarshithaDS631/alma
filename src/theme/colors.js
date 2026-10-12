export const lightTheme = {
  // Base Surfaces (Clean crisp neutral slate/white canvas - pure, elegant, NOT over-tinted)
  background: '#F8FAFC',        // Modern neutral light canvas
  card: '#FFFFFF',              // Pure crisp elevated white card
  cardSecondary: '#F8FAFC',     // Neutral clean container
  surfaceElevated: '#FFFFFF',   // 3D elevated floating tile
  surfaceDepressed: '#F1F5F9',  // Soft recessed container
  
  // Typography (Ultra-sharp high-contrast slate & charcoal)
  text: '#0F172A',              // Deep slate black
  textSecondary: '#475569',     // Neutral charcoal gray
  textMuted: '#94A3B8',         // Soft guide gray
  
  // Brand & Accents (Orange Health Signature Coral & Sunset Gradient)
  primary: '#FF5A36',           // Orange Health Signature Vibrant Coral
  primaryDark: '#E03D1A',       // Deep sunset coral
  primaryLight: '#FF7A5C',      // Luminous coral orange
  primaryLighter: '#FFD8CF',    // Delicate pastel peach
  primaryMuted: '#FFF5F2',      // Soft airy coral cream pod
  primarySoft: '#FFF5F2',       // Clean soft pod tint
  primaryBorder: '#FED7AA',     // Delicate light peach border
  
  accent: '#FF432A',            // Punchy coral
  secondary: '#FF7A5C',         // Soft Tangerine
  emeraldSoft: '#F0FDF4',       // Clean mint tint (for verified badges)
  emeraldBorder: '#A7F3D0',     // Light mint border
  
  gold: '#F59E0B',              // Amber Gold
  goldLight: '#FEF3C7',
  
  // Exact Orange Health Labs Gradients (Used tastefully on CTAs and key headers)
  gradientPrimary: ['#FF6B35', '#FF432A'],       // Orange Health signature coral gradient
  gradientPrimaryLight: ['#FF885B', '#FF5A36'],  // Radiant coral glow
  gradientLight: ['#FFF5F2', '#FFEAE4'],         // Soft subtle peach wash for badges
  gradientBanner: ['#FF6B35', '#FF432A'],        // Vibrant banner gradient
  gradientBadge: ['#FFF5F2', '#FFEAE4'],         // Subtle pill badge gradient
  gradientEmerald: ['#10B981', '#059669'],       // Success/verified gradient
  gradientEmeraldLight: ['#F0FDF4', '#DCFCE7'],  // Soft verified wash
  
  // 3D & Glassmorphic Tokens
  border: '#E2E8F0',            // Clean neutral slate border
  cardBorder: 'rgba(226, 232, 240, 0.9)',
  cardShadow: 'rgba(15, 23, 42, 0.06)',          // Crisp neutral card shadow
  glassBackground: 'rgba(255, 255, 255, 0.96)',
  glassBorder: 'rgba(226, 232, 240, 0.8)',
  glowPrimary: 'rgba(255, 90, 54, 0.22)',
  glowAccent: 'rgba(255, 67, 42, 0.18)',
  glowGold: 'rgba(245, 158, 11, 0.22)',
  
  // 3D Icon Pods (Subtle, clean pods)
  icon: '#475569',
  iconActive: '#FF5A36',
  iconPodBg: '#F8FAFC',
  iconPodActiveBg: '#FFF1EE',
  iconPodBorder: '#FFD8CF',
  icon3DGlow: 'rgba(255, 90, 54, 0.16)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#FFFFFF',
  buttonBackground: '#FF5A36',
  buttonGradient: ['#FF6B35', '#FF432A'],
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
  background: '#0B0F17',        // Deep obsidian night
  card: '#131B26',              // Elevated dark slate
  cardSecondary: '#192331',     // Tactile dark container
  surfaceElevated: '#1F2C3D',   // 3D raised glowing card
  surfaceDepressed: '#0F1520',  // 3D inset recessed field
  
  // Typography
  text: '#F8FAFC',              // Brilliant white
  textSecondary: '#94A3B8',     // Neutral slate
  textMuted: '#64748B',         // Muted gray
  
  // Brand & Accents
  primary: '#FF6B35',           // Radiant Orange Health Coral
  primaryDark: '#FF432A',
  primaryLight: '#FF885B',
  primaryLighter: '#FFB299',
  primaryMuted: '#2D1812',
  primarySoft: '#1F120E',
  primaryBorder: 'rgba(255, 107, 53, 0.3)',
  
  accent: '#FF5A36',            // Signature Coral
  secondary: '#FF7A5C',
  emeraldSoft: '#064E3B',
  emeraldBorder: 'rgba(16, 185, 129, 0.3)',
  
  gold: '#FBBF24',
  goldLight: 'rgba(251, 191, 36, 0.15)',
  
  // Gradients
  gradientPrimary: ['#FF6B35', '#FF432A'],
  gradientPrimaryLight: ['#FF885B', '#FF5A36'],
  gradientLight: ['#192331', '#111722'],
  gradientBanner: ['#FF6B35', '#FF432A'],
  gradientBadge: ['#2A1813', '#1C110D'],
  gradientEmerald: ['#10B981', '#059669'],
  gradientEmeraldLight: ['#064E3B', '#022C22'],
  
  // 3D & Glassmorphic Tokens
  border: 'rgba(226, 232, 240, 0.1)',
  cardBorder: 'rgba(255, 107, 53, 0.15)',
  cardShadow: 'rgba(0, 0, 0, 0.7)',
  glassBackground: 'rgba(19, 27, 38, 0.92)',
  glassBorder: 'rgba(255, 107, 53, 0.2)',
  glowPrimary: 'rgba(255, 107, 53, 0.3)',
  glowAccent: 'rgba(255, 90, 54, 0.25)',
  glowGold: 'rgba(251, 191, 36, 0.3)',
  
  // 3D Icon Pods
  icon: '#94A3B8',
  iconActive: '#FF6B35',
  iconPodBg: '#192331',
  iconPodActiveBg: 'rgba(255, 107, 53, 0.18)',
  iconPodBorder: 'rgba(255, 107, 53, 0.35)',
  icon3DGlow: 'rgba(255, 107, 53, 0.3)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#131B26',
  buttonBackground: '#FF5A36',
  buttonGradient: ['#FF6B35', '#FF432A'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(11, 15, 23, 0.95)',
  tabBarBorder: 'rgba(226, 232, 240, 0.1)',

  // Feedback Colors
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#FBBF24',
};
