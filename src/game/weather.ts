import { LevelWeather } from './types';

export function weatherCoinBonus(weather: LevelWeather | undefined, word: string): number {
  if (weather?.kind === 'rain') return word.length * Math.max(0, weather.coinBonusPerLetter ?? 1);
  if (weather?.kind === 'drought' && word.length >= 5) return word.length;
  return 0;
}

export function windStep(weather: LevelWeather | undefined, acceptedTurn: number): -1 | 0 | 1 {
  if ((weather?.kind !== 'wind' && weather?.kind !== 'storm') || weather.interval < 1 || acceptedTurn < 1 || acceptedTurn % weather.interval !== 0) return 0;
  return (acceptedTurn / weather.interval) % 2 === 1 ? 1 : -1;
}

export function weatherLabel(weather: LevelWeather | undefined): string | undefined {
  if (weather?.kind === 'rain') return 'RAIN BONUS';
  if (weather?.kind === 'wind') return `WIND EVERY ${weather.interval} WORDS`;
  if (weather?.kind === 'drought') return 'DROUGHT · 5+ LETTER BONUS';
  if (weather?.kind === 'storm') return `STORM EVERY ${weather.interval} WORDS`;
  return undefined;
}
