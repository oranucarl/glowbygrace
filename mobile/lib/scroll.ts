// Shared scroll feel: iPhone bounces at the ends (even on short screens);
// Android shows its native stretch effect at the edges.
import { Platform } from 'react-native';

export const bounceY = {
  bounces: true,
  alwaysBounceVertical: true,
  overScrollMode: 'always' as const,
  decelerationRate: 'normal' as const,
  showsVerticalScrollIndicator: false,
};

export const bounceX = {
  bounces: true,
  alwaysBounceHorizontal: true,
  overScrollMode: 'always' as const,
  decelerationRate: 'normal' as const,
  showsHorizontalScrollIndicator: false,
};

// long product lists: render in small batches and drop off-screen views on Android
export const listTuning = {
  initialNumToRender: 6,
  maxToRenderPerBatch: 6,
  windowSize: 7,
  removeClippedSubviews: Platform.OS === 'android',
};
