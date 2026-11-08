// "Ink line" palette. Cobalt only ever means the viewer's own head.
export const P = {
  paper: '#F2EEE4',
  ink: '#151515',
  soft: '#B9B2A3',
  cobalt: '#2741E0',
  cobaltWash: 'rgba(39,65,224,0.14)',
};

export const FONT = { serif: 'Instrument Serif', hand: 'Kalam' };

const DIR = '/styles/ink-line/fonts';
export const FONTS = [
  { family: FONT.serif, url: `${DIR}/InstrumentSerif-Regular.ttf` },
  { family: FONT.hand, url: `${DIR}/Kalam-Bold.ttf`, weight: '700' },
];
