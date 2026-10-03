// Brand colours and fonts — matched to the website's design tokens.
export const C = {
  cream: '#f7f0e7',
  cream2: '#efe4d6',
  sand: '#e3d0bb',
  cocoa: '#6b4636',
  espresso: '#2a1a14',
  ink: '#170f0b',
  gold: '#c49a5a',
  gold2: '#e2c08a',
  muted: '#8a7366',
  white: '#fffdfa',
  error: '#b3261e',
  ok: '#17663a',
};

export const F = {
  display: 'BodoniModa_400Regular',
  displayItalic: 'BodoniModa_400Regular_Italic',
  body: 'Manrope_500Medium',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy: 'Manrope_800ExtraBold',
};

export const naira = (n: number) => '₦' + Number(n).toLocaleString('en-NG');
