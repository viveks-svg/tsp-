export interface PlanetaryPosition {
  longitude: number;
  rashi: string;
  rashiIndex: number;
  house: number;
  isRetrograde: boolean;
  nakshatra: string;
  nakshatraPada: number;
  degree: string;
  state: string;
  status: string;
}

export interface NakshatraResult {
  nakshatra: string;
  nakshatraIndex: number;
  pada: number;
  rulingLord: string;
  deity: string;
  gana: string;
  symbol: string;
  moonLongitude: number;
  nakshatraStart: number;
  nakshatraEnd: number;
}

export interface RashiResult {
  rashi: string;
  rashiEnglish: string;
  rashiIndex: number;
  rulingPlanet: string;
  element: string;
  quality: string;
  symbol: string;
  moonLongitude: number;
}

export interface LagnaResult {
  lagna: string;
  lagnaEnglish: string;
  lagnaIndex: number;
  lagnaLongitude: number;
  rulingPlanet: string;
}

export interface DashaPeriod {
  planet: string;
  startDate: string;
  endDate: string;
  durationYears: number;
  isActive: boolean;
}

export interface DashaResult {
  birthNakshatra: string;
  startingLord: string;
  balanceAtBirth: { years: number; months: number; days: number };
  mahadashas: DashaPeriod[];
  currentMahadasha: { planet: string; startDate: string; endDate: string };
  currentAntardasha: { planet: string; startDate: string; endDate: string };
}

export interface KundaliMatchingResult {
  person1: { nakshatra: string; rashi: string; gana: string; nadi: string; yoni: string };
  person2: { nakshatra: string; rashi: string; gana: string; nadi: string; yoni: string };
  gunaScore: number;
  breakdown: {
    varna: { score: number; max: 1; description: string };
    vashya: { score: number; max: 2; description: string };
    tara: { score: number; max: 3; description: string };
    yoni: { score: number; max: 4; description: string };
    grahaMaitri: { score: number; max: 5; description: string };
    gana: { score: number; max: 6; description: string };
    bhakoot: { score: number; max: 7; description: string };
    nadi: { score: number; max: 8; description: string };
  };
  doshas: {
    nadiDosha: boolean;
    bhakootDosha: boolean;
    mangalDosha: { person1: boolean; person2: boolean };
  };
  verdict: string;
  percentage: number;
}

export interface MangalDoshaResult {
  marsLongitude: number;
  marsHouse: number;
  isManglik: boolean;
  severity: "High" | "Medium" | "Low" | "None";
  cancellationFactors: string[];
  remedies: string[];
}

export interface AyanamsaResult {
  ayanamsaType: string;
  degrees: number;
  minutes: number;
  seconds: number;
  decimal: number;
  epoch: number;
}

export interface PanchangResult {
  tithi: string;
  karana: string;
  yoga: string;
  nakshatra: string;
  nakshatraLord: string;
  ascendant: string;
  ascendantLord: string;
  sunrise: string;
  sunset: string;
}

export interface AvakhadaResult {
  varna: string;
  vashya: string;
  yoni: string;
  gana: string;
  nadi: string;
  sign: string;
  signLord: string;
  charan: number;
  tatva: string;
  nameAlphabet: string;
  paya: string;
  yunja: string;
}

export interface ChartPosition {
  name: string;
  rashi: string;
  longitude: number;
  isRetrograde: boolean;
}

export interface BirthChartResult {
  name?: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: string;
  ayanamsa: number;
  ascendant: LagnaResult;
  planets: Record<string, PlanetaryPosition>;
  nakshatra: NakshatraResult;
  rashi: RashiResult;
  dasha: DashaResult;
  panchang: PanchangResult;
  avakhada: AvakhadaResult;
  chartHouses: ChartPosition[][];
  navamsaChartHouses: ChartPosition[][];
}
