export const lightTheme = {
  // Base Surfaces (Soft luminous warm white porcelain & pure elevated white cards)
  background: '#FBF9F7',        // Soft luminous warm white canvas
  card: '#FFFFFF',              // Pure crisp elevated white card
  cardSecondary: '#FFF8F5',     // Gentle pastel peach container
  surfaceElevated: '#FFFFFF',   // 3D elevated floating tile
  surfaceDepressed: '#FFF1EB',  // Soft recessed apricot container
  
  // Typography (Ultra-sharp high-contrast slate & warm charcoal)
  text: '#1E1A17',              // Deep warm slate black
  textSecondary: '#5C554F',     // Neutral charcoal gray
  textMuted: '#9E958D',         // Soft guide gray
  
  // Brand & Accents (Soft Pastel Peach & Apricot - Gentle, Light & Subtle)
  primary: '#FA8257',           // Soft luminous apricot peach
  primaryDark: '#D96738',       // Warm terracotta peach
  primaryLight: '#FFB592',      // Very soft pastel peach
  primaryLighter: '#FFE5D9',    // Delicate airy peach tint
  primaryMuted: '#FFF8F5',      // Softest airy cream pod
  primarySoft: '#FFF8F5',       // Clean soft pod tint
  primaryBorder: '#FED7AA',     // Delicate light peach border
  
  accent: '#FA8257',            // Soft Apricot
  secondary: '#FFB592',         // Light Peach
  emeraldSoft: '#F0FDF4',       // Clean mint tint (for verified badges)
  emeraldBorder: '#A7F3D0',     // Light mint border
  
  gold: '#F59E0B',              // Amber Gold
  goldLight: '#FEF3C7',
  
  // Soft Pastel Peach Gradients (Gentle, airy, light)
  gradientPrimary: ['#FFB592', '#FA8257'],       // Soft pastel peach-to-apricot gradient
  gradientPrimaryLight: ['#FFCDB4', '#FFB592'],  // Luminous pastel glow
  gradientLight: ['#FFF8F5', '#FFF1EB'],         // Subtle soft peach wash
  gradientBanner: ['#FFB592', '#FA8257'],        // Soft banner gradient
  gradientBadge: ['#FFF8F5', '#FFF1EB'],         // Delicate pill badge gradient
  gradientEmerald: ['#10B981', '#059669'],       // Success/verified gradient
  gradientEmeraldLight: ['#F0FDF4', '#DCFCE7'],  // Soft verified wash
  
  // 3D & Glassmorphic Tokens
  border: '#EFE9E4',            // Clean neutral warm border
  cardBorder: 'rgba(239, 233, 228, 0.95)',
  cardShadow: 'rgba(30, 26, 23, 0.05)',          // Very subtle soft card shadow
  glassBackground: 'rgba(255, 255, 255, 0.96)',
  glassBorder: 'rgba(239, 233, 228, 0.8)',
  glowPrimary: 'rgba(250, 130, 87, 0.2)',
  glowAccent: 'rgba(250, 130, 87, 0.16)',
  glowGold: 'rgba(245, 158, 11, 0.22)',
  
  // 3D Icon Pods (Soft pastel pods)
  icon: '#5C554F',
  iconActive: '#FA8257',
  iconPodBg: '#FFF8F5',
  iconPodActiveBg: '#FFF1EB',
  iconPodBorder: '#FED7AA',
  icon3DGlow: 'rgba(250, 130, 87, 0.14)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#FFFFFF',
  buttonBackground: '#FA8257',
  buttonGradient: ['#FFB592', '#FA8257'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(255, 255, 255, 0.98)',
  tabBarBorder: 'rgba(239, 233, 228, 0.8)',

  // Feedback Colors
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
};

export const darkTheme = {
  // Base Surfaces (Deep obsidian warm dark slate)
  background: '#120F0D',        // Deep obsidian bronze night
  card: '#1C1714',              // Elevated dark slate
  cardSecondary: '#241E1A',     // Tactile dark container
  surfaceElevated: '#2E2621',   // 3D raised glowing card
  surfaceDepressed: '#17120F',  // 3D inset recessed field
  
  // Typography
  text: '#FDFBF9',              // Brilliant warm white
  textSecondary: '#A89F97',     // Neutral warm slate
  textMuted: '#786F67',         // Muted gray
  
  // Brand & Accents
  primary: '#FFB592',           // Luminous Soft Peach
  primaryDark: '#FA8257',
  primaryLight: '#FFCDB4',
  primaryLighter: '#FFE5D9',
  primaryMuted: '#2D1E16',
  primarySoft: '#211610',
  primaryBorder: 'rgba(255, 181, 146, 0.3)',
  
  accent: '#FA8257',            // Soft Apricot
  secondary: '#FFB592',
  emeraldSoft: '#064E3B',
  emeraldBorder: 'rgba(16, 185, 129, 0.3)',
  
  gold: '#FBBF24',
  goldLight: 'rgba(251, 191, 36, 0.15)',
  
  // Gradients
  gradientPrimary: ['#FFB592', '#FA8257'],
  gradientPrimaryLight: ['#FFCDB4', '#FFB592'],
  gradientLight: ['#241E1A', '#17120F'],
  gradientBanner: ['#FFB592', '#FA8257'],
  gradientBadge: ['#2A1D16', '#1A110D'],
  gradientEmerald: ['#10B981', '#059669'],
  gradientEmeraldLight: ['#064E3B', '#022C22'],
  
  // 3D & Glassmorphic Tokens
  border: 'rgba(255, 181, 146, 0.15)',
  cardBorder: 'rgba(255, 181, 146, 0.2)',
  cardShadow: 'rgba(0, 0, 0, 0.7)',
  glassBackground: 'rgba(28, 23, 20, 0.92)',
  glassBorder: 'rgba(255, 181, 146, 0.22)',
  glowPrimary: 'rgba(255, 181, 146, 0.25)',
  glowAccent: 'rgba(250, 130, 87, 0.2)',
  glowGold: 'rgba(251, 191, 36, 0.3)',
  
  // 3D Icon Pods
  icon: '#A89F97',
  iconActive: '#FFB592',
  iconPodBg: '#241E1A',
  iconPodActiveBg: 'rgba(255, 181, 146, 0.18)',
  iconPodBorder: 'rgba(255, 181, 146, 0.35)',
  icon3DGlow: 'rgba(255, 181, 146, 0.3)',
  
  // Inputs & Interactive Buttons
  inputBackground: '#1C1714',
  buttonBackground: '#FA8257',
  buttonGradient: ['#FFB592', '#FA8257'],
  buttonText: '#FFFFFF',
  tabBarBg: 'rgba(18, 15, 13, 0.95)',
  tabBarBorder: 'rgba(255, 181, 146, 0.12)',

  // Feedback Colors
  success: '#10B981',
  danger: '#F43F5E',
  warning: '#FBBF24',
};
