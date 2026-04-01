import programFuncional from '@/assets/program-funcional.jpg';
import programPilatex from '@/assets/program-pilatex.jpg';
import programRumba from '@/assets/program-rumba.jpg';
import programCrossfit from '@/assets/program-crossfit.jpg';
import programYoga from '@/assets/program-yoga.jpg';
import programSpinning from '@/assets/program-spinning.jpg';
import programGap from '@/assets/program-gap.jpg';
import programBoxeo from '@/assets/program-boxeo.jpg';
import gymReal from '@/assets/gym-real.jpg';

const programImages: Record<string, string> = {
  FUNCIONAL: programFuncional,
  PILATEX: programPilatex,
  RUMBA: programRumba,
  CROSSFIT: programCrossfit,
  YOGA: programYoga,
  SPINNING: programSpinning,
  GAP: programGap,
  BOXEO: programBoxeo,
};

export const getProgramImage = (program: string): string => {
  return programImages[program.toUpperCase()] || gymReal;
};

export default programImages;
