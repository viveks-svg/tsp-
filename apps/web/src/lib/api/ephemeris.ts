export interface PlanetaryPositionsInput {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

export interface BirthDetailsInput extends PlanetaryPositionsInput {}

export interface BirthChartInput extends BirthDetailsInput {
  name?: string;
}

export interface KundaliMatchingInput {
  person1: { name: string; birthDate: string; birthTime: string; birthPlace: string };
  person2: { name: string; birthDate: string; birthTime: string; birthPlace: string };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function fetchWithFallback<T>(endpoint: string, body: any): Promise<T> {
  const url = `${API_BASE_URL}/ephemeris/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Ephemeris API error: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPlanetaryPositions(data: PlanetaryPositionsInput) {
  return fetchWithFallback<any>('planetary-positions', data);
}

export async function fetchNakshatra(data: BirthDetailsInput) {
  return fetchWithFallback<any>('nakshatra', data);
}

export async function fetchRashi(data: BirthDetailsInput) {
  return fetchWithFallback<any>('rashi', data);
}

export async function fetchLagna(data: BirthDetailsInput) {
  return fetchWithFallback<any>('lagna', data);
}

export async function fetchDasha(data: BirthDetailsInput) {
  return fetchWithFallback<any>('dasha', data);
}

export async function fetchKundaliMatching(data: KundaliMatchingInput) {
  return fetchWithFallback<any>('kundali-matching', data);
}

export async function fetchMangalDosha(data: BirthDetailsInput) {
  return fetchWithFallback<any>('mangal-dosha', data);
}

export async function fetchAyanamsa(data: { birthDate: string }) {
  return fetchWithFallback<any>('ayanamsa', data);
}

export async function fetchBirthChart(data: BirthChartInput) {
  return fetchWithFallback<any>('birth-chart', data);
}

export async function fetchPlaces(query: string) {
  const url = `${API_BASE_URL}/geocoding/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  return response.json();
}
