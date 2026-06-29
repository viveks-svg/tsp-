declare module 'swisseph' {
  export const SE_SUN: number;
  export const SE_MOON: number;
  export const SE_MARS: number;
  export const SE_MERCURY: number;
  export const SE_JUPITER: number;
  export const SE_VENUS: number;
  export const SE_SATURN: number;
  export const SE_TRUE_NODE: number;

  export const SE_SIDM_LAHIRI: number;

  export const SEFLG_SIDEREAL: number;
  export const SEFLG_SPEED: number;

  export const SE_GREG_CAL: number;

  export function swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void;
  export function swe_calc_ut(julday: number, planet: number, flag: number): { longitude: number; latitude: number; distance: number; speedInLongitude: number; speedInLatitude: number; speedInDistance: number };
  export function swe_houses(julday: number, lat: number, lng: number, hsys: string): { ascendant: number; mc: number; armc: number; vertex: number; house: number[] };
  export function swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number;
  export function swe_get_ayanamsa_ut(julday: number): number;
}
