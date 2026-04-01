import cfReal1 from '@/assets/cf-real-1.png';
import cfReal2 from '@/assets/cf-real-2.png';
import cfReal3 from '@/assets/cf-real-3.png';
import cfReal4 from '@/assets/cf-real-4.png';
import cfReal5 from '@/assets/cf-real-5.png';
import cfReal6 from '@/assets/cf-real-6.png';

export const realImages = [cfReal1, cfReal2, cfReal3, cfReal4, cfReal5, cfReal6];

export const getRandomRealImage = () =>
  realImages[Math.floor(Math.random() * realImages.length)];
