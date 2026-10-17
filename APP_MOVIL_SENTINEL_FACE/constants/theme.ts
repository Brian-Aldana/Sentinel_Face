import { Platform } from 'react-native';

type GradientTuple = [string, string];

const pastelPink   = '#E8A0C8';
const pastelPurple = '#C3A0F0';
const bgDark       = '#12101E';

import { useSettingsStore } from '../store/settingsStore';

export const Colors = {
  light: {
    pinkNeon:    '#D05090',
    purpleNeon:  '#8050D0',
    blueNeon:    '#287AB0',
    greenNeon:   '#208A68',
    adminGold:   '#B08018',
    redAlert:    '#C04040',
    yellowWarn:  '#A07810',

    text:        '#121020',
    textMuted:   '#524E68',
    textSubtle:  '#7A7490',

    background:  '#F5F4FA',
    surface:     '#FFFFFF',
    cardBg:      '#FFFFFF',
    inputBg:     '#EBE8F4',
    overlay:     'rgba(245,244,250,0.85)',

    border:       '#E0DCEE',
    borderStrong: '#B8B3CE',

    tint:            '#8050D0',
    icon:            '#7A7490',
    tabIconDefault:  '#B8B3CE',
    tabIconSelected: '#8050D0',

    success: '#208A68',
    warning: '#A07810',
    error:   '#C04040',
    info:    '#287AB0',

    gradients: {
      primary:   ['#8050D0', '#D05090'] as GradientTuple,
      admin:     ['#8050D0', '#6C3CA0'] as GradientTuple,
      success:   ['#208A68', '#287AB0'] as GradientTuple,
      danger:    ['#C04040', '#D87858'] as GradientTuple,
      overlay:   ['rgba(245,244,250,0.1)', 'rgba(245,244,250,0.7)'] as GradientTuple,
      adminDash: ['rgba(128,80,208,0.12)', 'rgba(128,80,208,0.04)'] as GradientTuple,
      card:      ['rgba(128,80,208,0.08)', 'rgba(208,80,144,0.03)'] as GradientTuple,
      bg:        ['#F5F4FA', '#E5E2F3'] as GradientTuple,
    }
  },

  dark: {
    pinkNeon:    pastelPink,
    purpleNeon:  pastelPurple,
    blueNeon:    '#90D0F0',
    greenNeon:   '#7BC4A8',
    adminGold:   '#E8C87A',
    redAlert:    '#D49090',
    yellowWarn:  '#E8D080',

    text:        '#EDE8F5',
    textMuted:   '#C8C0D8',
    textSubtle:  '#8A8498',

    background:  bgDark,
    surface:     '#1E1B2E',
    cardBg:      '#252235',
    inputBg:     'rgba(0,0,0,0.35)',
    overlay:     'rgba(18,16,30,0.85)',

    border:       '#3A3550',
    borderStrong: '#6B6480',

    tint:            pastelPink,
    icon:            '#8A8498',
    tabIconDefault:  '#3A3550',
    tabIconSelected: pastelPink,

    success: '#7BC4A8',
    warning: '#E8D080',
    error:   '#D49090',
    info:    '#90D0F0',

    gradients: {
      primary:   [pastelPurple, pastelPink]                             as GradientTuple,
      admin:     ['#C3A0F0',    '#A080D8']                              as GradientTuple,
      success:   ['#7BC4A8',    '#90D0F0']                              as GradientTuple,
      danger:    ['#D49090',    '#E0A880']                              as GradientTuple,
      overlay:   ['rgba(18,16,30,0.1)',   'rgba(18,16,30,0.7)']        as GradientTuple,
      adminDash: ['rgba(195,160,240,0.14)', 'rgba(195,160,240,0.05)']  as GradientTuple,
      card:      ['rgba(195,160,240,0.12)', 'rgba(232,160,200,0.06)']  as GradientTuple,
      bg:        ['#12101E', '#1A1630']                                 as GradientTuple,
    }
  },

  Gradients: {
    primary:   [pastelPurple, pastelPink]                             as GradientTuple,
    admin:     ['#C3A0F0',    '#A080D8']                              as GradientTuple,
    success:   ['#7BC4A8',    '#90D0F0']                              as GradientTuple,
    danger:    ['#D49090',    '#E0A880']                              as GradientTuple,
    overlay:   ['rgba(18,16,30,0.1)',   'rgba(18,16,30,0.7)']        as GradientTuple,
    adminDash: ['rgba(195,160,240,0.14)', 'rgba(195,160,240,0.05)']  as GradientTuple,
    card:      ['rgba(195,160,240,0.12)', 'rgba(232,160,200,0.06)']  as GradientTuple,
    bg:        ['#12101E', '#1A1630']                                 as GradientTuple,
  },

  Status: {
    success: '#7BC4A8',
    warning: '#E8D080',
    error:   '#D49090',
    info:    '#90D0F0',
  },
};

export function useThemeColors() {
  const darkMode = useSettingsStore((s) => s.darkMode);
  return Colors[darkMode ? 'dark' : 'light'];
}

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});