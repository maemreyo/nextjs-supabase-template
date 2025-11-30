// This file is deprecated - we now use the official TextStyle from @tiptap/extension-text-style
// along with Color and FontSize extensions that add attributes to the TextStyle mark

import { clientLogger } from '@/services/logger';

clientLogger.warn(
  'TextStyleWithColor is deprecated. Please use TextStyle from @tiptap/extension-text-style with Color and FontSize extensions.',
  {
    replacement: 'TextStyle from @tiptap/extension-text-style',
    extensions: ['Color from @tiptap/extension-color', 'FontSize from @/lib/tiptap-extensions/font-size']
  }
);

// Re-export for backward compatibility (will be removed in future)
export { TextStyle } from '@tiptap/extension-text-style';
export { Color } from '@tiptap/extension-color';
export { FontSize } from './font-size';

// Deprecated export - do not use in new code
export const TextStyleWithColor = null;