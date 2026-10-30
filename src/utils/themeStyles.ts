import { ProjectColorTheme } from '../types.ts';

export interface NicheColorScheme {
  accent: string;
  headerBg: string;
  cardBg: string;
  stubBg: string;
  badgeBg: string;
  badgeText: string;
  pattern: string;
  border: string;
  textColor: string;
  subtleTextColor: string;
  seatFilled: string;
  seatOpenBorder: string;
  buttonClass: string;
  buttonBg: string;
  buttonHover: string;
  subtleBox: string;
  ticketCode: string;
  starColor: string;
  notchBg?: string;
}

export const NICHE_PROJECT_THEMES: Record<string, NicheColorScheme> = {
  // Picture 1 Swatch 1: Olive Moss Green
  moss: {
    accent: '#36241E',
    headerBg: '#B6C898',
    cardBg: '#C8D6AE',
    stubBg: '#BCCDA0',
    badgeBg: '#A6B884',
    badgeText: '#263311',
    pattern: 'pattern-dots',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#443630]',
    seatFilled: 'bg-[#36241E] text-[#C8D6AE]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#BCCDA0] border-2 border-[#36241E]',
    ticketCode: '04584378',
    starColor: '#D9A83A',
  },

  // Picture 1 Swatch 3: Dusty Mauve / Lilac Pink
  mauve: {
    accent: '#36241E',
    headerBg: '#D4A4B6',
    cardBg: '#DFB4C4',
    stubBg: '#D5A7B8',
    badgeBg: '#C28CA0',
    badgeText: '#36241E',
    pattern: 'pattern-stripes',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4B3039]',
    seatFilled: 'bg-[#36241E] text-[#DFB4C4]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#D5A7B8] border-2 border-[#36241E]',
    ticketCode: '09841256',
    starColor: '#D9A83A',
  },

  // Picture 2: Authentic Stand Up Show Peach / Coral Ticket
  coral: {
    accent: '#36241E',
    headerBg: '#E8A892',
    cardBg: '#F3BBA8',
    stubBg: '#E9AB96',
    badgeBg: '#DC9680',
    badgeText: '#36241E',
    pattern: 'pattern-grid',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4E271D]',
    seatFilled: 'bg-[#36241E] text-[#F3BBA8]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#E9AB96] border-2 border-[#36241E]',
    ticketCode: '04504378',
    starColor: '#D9A83A',
  },

  // Picture 1 Swatch 2: Deep Roasted Chocolate Ticket with Gold Accent
  espresso: {
    accent: '#D9A83A',
    headerBg: '#2A1B16',
    cardBg: '#36241E',
    stubBg: '#2C1D18',
    badgeBg: '#543D35',
    badgeText: '#F5EDE2',
    pattern: 'pattern-stars',
    border: 'border-[#D9A83A]',
    textColor: 'text-[#F5EDE2]',
    subtleTextColor: 'text-[#DECFC2]',
    seatFilled: 'bg-[#D9A83A] text-[#36241E]',
    seatOpenBorder: 'border-2 border-dashed border-[#D9A83A] text-[#D9A83A]',
    buttonClass: 'btn-retro-moss',
    buttonBg: '#5B6838',
    buttonHover: '#6D7C45',
    subtleBox: 'bg-[#432F28] border-2 border-[#D9A83A]',
    ticketCode: '07193420',
    starColor: '#D9A83A',
  },

  // Vintage Buttercream Ticket
  amber: {
    accent: '#36241E',
    headerBg: '#E4CB89',
    cardBg: '#EEDAA2',
    stubBg: '#E3C987',
    badgeBg: '#CEB26C',
    badgeText: '#36241E',
    pattern: 'pattern-dots',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4A3D1E]',
    seatFilled: 'bg-[#36241E] text-[#EEDAA2]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#E3C987] border-2 border-[#36241E]',
    ticketCode: '05183922',
    starColor: '#36241E',
  },

  // Vintage Periwinkle Fog Ticket
  periwinkle: {
    accent: '#36241E',
    headerBg: '#ADC3D4',
    cardBg: '#BDD1DF',
    stubBg: '#B0C5D5',
    badgeBg: '#96B2C5',
    badgeText: '#1F2F3B',
    pattern: 'pattern-cross',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#2D3A44]',
    seatFilled: 'bg-[#36241E] text-[#BDD1DF]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#B0C5D5] border-2 border-[#36241E]',
    ticketCode: '03829104',
    starColor: '#D9A83A',
  },

  // Vintage Blackberry Plum Ticket
  plum: {
    accent: '#36241E',
    headerBg: '#CBAABF',
    cardBg: '#D8BCD0',
    stubBg: '#CEADC3',
    badgeBg: '#BA94AD',
    badgeText: '#3A1E31',
    pattern: 'pattern-stars',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4A263F]',
    seatFilled: 'bg-[#36241E] text-[#D8BCD0]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#CEADC3] border-2 border-[#36241E]',
    ticketCode: '08347192',
    starColor: '#D9A83A',
  },

  // Aliases for seed projects
  caramel: {
    accent: '#36241E',
    headerBg: '#E8A892',
    cardBg: '#F3BBA8',
    stubBg: '#E9AB96',
    badgeBg: '#DC9680',
    badgeText: '#36241E',
    pattern: 'pattern-grid',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4E271D]',
    seatFilled: 'bg-[#36241E] text-[#F3BBA8]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#E9AB96] border-2 border-[#36241E]',
    ticketCode: '04504378',
    starColor: '#D9A83A',
  },
  cyan: {
    accent: '#36241E',
    headerBg: '#ADC3D4',
    cardBg: '#BDD1DF',
    stubBg: '#B0C5D5',
    badgeBg: '#96B2C5',
    badgeText: '#1F2F3B',
    pattern: 'pattern-cross',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#2D3A44]',
    seatFilled: 'bg-[#36241E] text-[#BDD1DF]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#B0C5D5] border-2 border-[#36241E]',
    ticketCode: '03829104',
    starColor: '#D9A83A',
  },
  rose: {
    accent: '#36241E',
    headerBg: '#D4A4B6',
    cardBg: '#DFB4C4',
    stubBg: '#D5A7B8',
    badgeBg: '#C28CA0',
    badgeText: '#36241E',
    pattern: 'pattern-stripes',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4B3039]',
    seatFilled: 'bg-[#36241E] text-[#DFB4C4]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#D5A7B8] border-2 border-[#36241E]',
    ticketCode: '09841256',
    starColor: '#D9A83A',
  },
  emerald: {
    accent: '#36241E',
    headerBg: '#B6C898',
    cardBg: '#C8D6AE',
    stubBg: '#BCCDA0',
    badgeBg: '#A6B884',
    badgeText: '#263311',
    pattern: 'pattern-dots',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#443630]',
    seatFilled: 'bg-[#36241E] text-[#C8D6AE]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#BCCDA0] border-2 border-[#36241E]',
    ticketCode: '04584378',
    starColor: '#D9A83A',
  },
  violet: {
    accent: '#36241E',
    headerBg: '#CBAABF',
    cardBg: '#D8BCD0',
    stubBg: '#CEADC3',
    badgeBg: '#BA94AD',
    badgeText: '#3A1E31',
    pattern: 'pattern-stars',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#4A263F]',
    seatFilled: 'bg-[#36241E] text-[#D8BCD0]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#CEADC3] border-2 border-[#36241E]',
    ticketCode: '08347192',
    starColor: '#D9A83A',
  },
  indigo: {
    accent: '#36241E',
    headerBg: '#ADC3D4',
    cardBg: '#BDD1DF',
    stubBg: '#B0C5D5',
    badgeBg: '#96B2C5',
    badgeText: '#1F2F3B',
    pattern: 'pattern-cross',
    border: 'border-[#36241E]',
    textColor: 'text-[#36241E]',
    subtleTextColor: 'text-[#2D3A44]',
    seatFilled: 'bg-[#36241E] text-[#BDD1DF]',
    seatOpenBorder: 'border-2 border-dashed border-[#36241E] text-[#36241E]',
    buttonClass: 'btn-retro-chocolate',
    buttonBg: '#36241E',
    buttonHover: '#4A342C',
    subtleBox: 'bg-[#B0C5D5] border-2 border-[#36241E]',
    ticketCode: '03829104',
    starColor: '#D9A83A',
  },
};

const THEME_CYCLE: ProjectColorTheme[] = [
  'moss',
  'mauve',
  'coral',
  'espresso',
  'amber',
  'periwinkle',
  'plum',
];

export function getProjectTheme(themeId?: ProjectColorTheme, index = 0): NicheColorScheme {
  if (themeId && NICHE_PROJECT_THEMES[themeId]) {
    return NICHE_PROJECT_THEMES[themeId];
  }
  const fallbackKey = THEME_CYCLE[index % THEME_CYCLE.length];
  return NICHE_PROJECT_THEMES[fallbackKey] || NICHE_PROJECT_THEMES.moss;
}
