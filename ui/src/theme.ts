export const ColorPrimary = '#794C39';
export const ColorSecondary = '#2A2C2D';

export const ColorBackground = '#C39568';

const ColorLink = '#005DFF';
const ColorHighlight = '#B3D6FF';

const ColorDanger = '#b52513';
const ColorSuccess = '#6986af';
const ColorWarning = '#C39568';
const ColorNeutral = '#2A2C2D';
const ColorInfo = '#794C39';

export default {
  palette: {
    primary: {
      main: ColorPrimary,
    },
    secondary: {
      main: ColorSecondary,
    },
    status: {
      danger: ColorDanger,
      success: ColorSuccess,
      warning: ColorWarning,
      neutral: ColorNeutral,
      info: ColorInfo,
    },
    typography: {
      link: ColorLink,
      highlight: ColorHighlight,
    } as any,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 2048,
    },
  },
};
