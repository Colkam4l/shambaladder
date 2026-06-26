export interface ClimateResponse {
  rainfallIndexLastSeason: number;
  droughtIndexLastSeason: number;
  climateRiskLevel: 'low' | 'medium' | 'high';
  source: 'open-meteo';
  fetchedAt: string;
}

export async function fetchClimateData(
  latitude: number,
  longitude: number
): Promise<ClimateResponse> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum,et0_fao_evapotranspiration&past_days=90&forecast_days=0`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API returned status ${response.status}`);
  }
  
  const data = await response.json();
  
  const p = (data.daily?.precipitation_sum || []) as number[];
  const et = (data.daily?.et0_fao_evapotranspiration || []) as number[];
  
  if (p.length === 0 || et.length === 0) {
    throw new Error('Open-Meteo API response is missing daily precipitation or evapotranspiration data');
  }
  
  const totalRainfall = p.reduce((sum, val) => sum + (val || 0), 0);
  
  // Calculate SPEI approximation
  const diffs = p.map((val, idx) => (val || 0) - (et[idx] || 0));
  const meanDiff = diffs.reduce((sum, val) => sum + val, 0) / diffs.length;
  const variance = diffs.reduce((sum, val) => sum + Math.pow(val - meanDiff, 2), 0) / diffs.length;
  const stddev = Math.sqrt(variance);
  
  let spei = stddev > 0.001 ? meanDiff / stddev : 0;
  spei = Math.round(spei * 100) / 100;
  
  let climateRiskLevel: 'low' | 'medium' | 'high' = 'low';
  if (spei < -1.0) {
    climateRiskLevel = 'high';
  } else if (spei < -0.5) {
    climateRiskLevel = 'medium';
  }
  
  return {
    rainfallIndexLastSeason: Math.round(totalRainfall),
    droughtIndexLastSeason: spei,
    climateRiskLevel,
    source: 'open-meteo',
    fetchedAt: new Date().toISOString(),
  };
}
