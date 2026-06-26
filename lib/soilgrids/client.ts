export interface SoilResponse {
  soilQualityIndex: number;
  phTop: number;
  organicCarbonTop: number;
  source: 'soilgrids';
  fetchedAt: string;
}

interface SoilDepthValues {
  mean: number;
}

interface SoilLayerDepth {
  label: string;
  values: SoilDepthValues;
}

interface SoilLayer {
  name: string;
  depths: SoilLayerDepth[];
}

export async function fetchSoilData(
  latitude: number,
  longitude: number
): Promise<SoilResponse> {
  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${longitude}&lat=${latitude}&property=phh2o,soc&depth=0-5cm&value=mean`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`SoilGrids API returned status ${response.status}`);
  }
  
  const data = await response.json();
  
  const layers = data.properties?.layers as SoilLayer[] | undefined;
  if (!layers) {
    throw new Error('SoilGrids API response is missing properties.layers');
  }
  
  const phLayer = layers.find((l) => l.name === 'phh2o');
  const phVal = phLayer?.depths?.find((d) => d.label === '0-5cm')?.values?.mean;
  
  const socLayer = layers.find((l) => l.name === 'soc');
  const socVal = socLayer?.depths?.find((d) => d.label === '0-5cm')?.values?.mean;
  
  if (phVal === undefined || socVal === undefined) {
    throw new Error('SoilGrids API response is missing phh2o or soc mean values for 0-5cm depth');
  }
  
  // SoilGrids pH is scaled by 10 (e.g. pH 6.5 is returned as 65)
  const ph = phVal / 10;
  
  // SoilGrids SOC is in dg/kg (decigrams per kilogram), divide by 10 to get g/kg
  const organicCarbon = socVal / 10;
  
  // Calculate pH Score
  let phScore = 30;
  if (ph >= 5.5 && ph <= 7.0) {
    phScore = 100;
  } else if ((ph >= 4.5 && ph < 5.5) || (ph > 7.0 && ph <= 7.5)) {
    phScore = 65;
  }
  
  // Calculate SOC Score
  const socScore = Math.min((organicCarbon / 30) * 100, 100);
  
  // Composite Soil Quality Index
  const soilQualityIndex = Math.round((phScore * 0.5) + (socScore * 0.5));
  
  return {
    soilQualityIndex,
    phTop: Math.round(ph * 10) / 10,
    organicCarbonTop: Math.round(organicCarbon * 10) / 10,
    source: 'soilgrids',
    fetchedAt: new Date().toISOString(),
  };
}
