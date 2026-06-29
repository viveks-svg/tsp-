export function getKundaliMockData(name: string, birthDate: string, birthTime: string, birthPlace: string) {
  const hour = parseInt(birthTime?.split(":")[0] || "12", 10);
  const lagnaIndex = (hour % 12) + 1;
  
  // Create a minimal mock data matching the new interface
  return {
    name,
    birthDate,
    birthTime,
    birthPlace,
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
    ayanamsa: 24.1,
    ascendant: { rashi: 'Aries', longitude: 10, rashiIndex: lagnaIndex - 1 },
    lagna: { rulingPlanet: 'Mars' },
    planets: {
      Sun: { rashi: 'Taurus', longitude: 45, house: ((lagnaIndex + 3) % 12) + 1, isRetrograde: false, nakshatra: 'Rohini', degree: '15° 0\' 0"', state: 'Yuva', status: 'Friendly' },
      Moon: { rashi: 'Virgo', longitude: 160, house: ((lagnaIndex + 8) % 12) + 1, isRetrograde: false, nakshatra: 'Hasta', degree: '10° 0\' 0"', state: 'Kumara', status: 'Enemy' },
      Mars: { rashi: 'Cancer', longitude: 100, house: 4, isRetrograde: false, nakshatra: 'Pushya', degree: '10° 0\' 0"', state: 'Kumara', status: 'Debilitated' },
    },
    panchang: {
      tithi: 'Pratipada',
      karana: 'Bava',
      yoga: 'Vishkambha',
      nakshatra: 'Ashwini',
      nakshatraLord: 'Ketu',
      ascendant: 'Aries',
      ascendantLord: 'Mars',
      sunrise: '06:00:00',
      sunset: '18:00:00'
    },
    avakhada: {
      varna: 'Kshatriya',
      vashya: 'Quadruped',
      yoni: 'Horse',
      gana: 'Deva',
      nadi: 'Aadi',
      sign: 'Aries',
      signLord: 'Mars',
      charan: 1,
      tatva: 'Fire',
      nameAlphabet: 'Chu',
      paya: 'Gold',
      yunja: 'Aadi'
    },
    dasha: {
      mahadashas: [
        { planet: 'Ketu', startDate: '2000-01-01', endDate: '2007-01-01', isActive: false },
        { planet: 'Venus', startDate: '2007-01-01', endDate: '2027-01-01', isActive: true },
        { planet: 'Sun', startDate: '2027-01-01', endDate: '2033-01-01', isActive: false },
      ]
    },
    chartHouses: Array.from({length: 12}, (_, i) => {
      const h: any[] = [];
      if (i === lagnaIndex - 1) h.push({ name: 'Asc', rashi: 'Aries', longitude: 10, isRetrograde: false });
      return h;
    }),
    navamsaChartHouses: Array.from({length: 12}, () => []),
  };
}
