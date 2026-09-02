/**
 * GEN Z Foods "Bold & Youthful" theme, mirroring genz-web tokens.
 * Near-black background, red + lemon-yellow accents, Anton display font.
 */
export const colors = {
  bg: '#0a0a0a',
  surface: '#141414',
  surfaceAlt: '#1c1c1c',
  border: '#2a2a2a',
  red: '#ff1f2d',
  yellow: '#ffe000',
  text: '#f5f5f5',
  textDim: '#a3a3a3',
  textMuted: '#6f6f6f',
  success: '#22c55e',
  danger: '#ff1f2d',
  overlay: 'rgba(0,0,0,0.75)',
} as const;

export const fonts = {
  display: 'Anton_400Regular',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemibold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;
