// Real Geocoded Indian Coastal Infrastructure & Assets for SIH26070
// Authoritative positions for Major and Intermediate Ports along the Bay of Bengal & Arabian Sea coastline.

export interface IndianCoastalPort {
  id: string;
  name: string;
  state: string;
  coast: 'EAST' | 'WEST';
  lat: number;
  lon: number;
  type: 'MAJOR' | 'INTERMEDIATE';
  cargoType: string;
  annualTrafficMT: number;
  criticalityScore: number; // 1 to 5
}

export interface IndianCoastalState {
  name: string;
  coast: 'EAST' | 'WEST';
  keyDistricts: string[];
  latRange: [number, number];
  lonRange: [number, number];
}

export const INDIAN_COASTAL_STATES: IndianCoastalState[] = [
  {
    name: 'West Bengal',
    coast: 'EAST',
    keyDistricts: ['South 24 Parganas', 'North 24 Parganas', 'East Medinipur'],
    latRange: [21.5, 23.0],
    lonRange: [87.5, 89.2]
  },
  {
    name: 'Odisha',
    coast: 'EAST',
    keyDistricts: ['Jagatsinghpur', 'Kendrapara', 'Puri', 'Ganjam', 'Bhadrak', 'Balasore'],
    latRange: [19.0, 21.6],
    lonRange: [84.5, 87.5]
  },
  {
    name: 'Andhra Pradesh',
    coast: 'EAST',
    keyDistricts: ['Srikakulam', 'Vizianagaram', 'Visakhapatnam', 'East Godavari', 'West Godavari', 'Krishna', 'Nellore'],
    latRange: [13.5, 19.1],
    lonRange: [79.8, 84.8]
  },
  {
    name: 'Tamil Nadu & Puducherry',
    coast: 'EAST',
    keyDistricts: ['Chennai', 'Thiruvallur', 'Cuddalore', 'Nagapattinam', 'Ramanathapuram', 'Thoothukudi'],
    latRange: [8.1, 13.5],
    lonRange: [77.5, 80.4]
  },
  {
    name: 'Kerala',
    coast: 'WEST',
    keyDistricts: ['Thiruvananthapuram', 'Kollam', 'Alappuzha', 'Ernakulam', 'Kozhikode', 'Kannur'],
    latRange: [8.3, 12.8],
    lonRange: [74.9, 77.2]
  },
  {
    name: 'Karnataka',
    coast: 'WEST',
    keyDistricts: ['Dakshina Kannada', 'Udupi', 'Uttara Kannada'],
    latRange: [12.8, 15.0],
    lonRange: [74.0, 75.0]
  },
  {
    name: 'Goa',
    coast: 'WEST',
    keyDistricts: ['North Goa', 'South Goa'],
    latRange: [14.9, 15.8],
    lonRange: [73.7, 74.3]
  },
  {
    name: 'Maharashtra',
    coast: 'WEST',
    keyDistricts: ['Mumbai City', 'Mumbai Suburban', 'Thane', 'Raigad', 'Ratnagiri', 'Sindhudurg'],
    latRange: [15.8, 20.2],
    lonRange: [72.6, 73.5]
  },
  {
    name: 'Gujarat',
    coast: 'WEST',
    keyDistricts: ['Kutch', 'Jamnagar', 'Porbandar', 'Junagadh', 'Amreli', 'Bhavnagar', 'Surat', 'Valsad'],
    latRange: [20.1, 23.8],
    lonRange: [68.1, 73.0]
  }
];

export const INDIAN_COASTAL_PORTS: IndianCoastalPort[] = [
  // EAST COAST (Bay of Bengal)
  {
    id: 'in-kol-hld',
    name: 'Haldia Port (Kolkata Port Trust)',
    state: 'West Bengal',
    coast: 'EAST',
    lat: 22.021,
    lon: 88.061,
    type: 'MAJOR',
    cargoType: 'Petroleum, Coal, Chemicals',
    annualTrafficMT: 48.6,
    criticalityScore: 5
  },
  {
    id: 'in-pdp',
    name: 'Paradip Port',
    state: 'Odisha',
    coast: 'EAST',
    lat: 20.264,
    lon: 86.671,
    type: 'MAJOR',
    cargoType: 'Iron Ore, Thermal Coal, Crude',
    annualTrafficMT: 135.3,
    criticalityScore: 5
  },
  {
    id: 'in-dhm',
    name: 'Dhamra Port',
    state: 'Odisha',
    coast: 'EAST',
    lat: 20.803,
    lon: 86.974,
    type: 'INTERMEDIATE',
    cargoType: 'Bulk, Minerals',
    annualTrafficMT: 35.0,
    criticalityScore: 4
  },
  {
    id: 'in-gpl',
    name: 'Gopalpur Port',
    state: 'Odisha',
    coast: 'EAST',
    lat: 19.308,
    lon: 84.965,
    type: 'INTERMEDIATE',
    cargoType: 'Fertilizers, Steel, Ilmenite',
    annualTrafficMT: 12.0,
    criticalityScore: 3
  },
  {
    id: 'in-vtg',
    name: 'Visakhapatnam Port',
    state: 'Andhra Pradesh',
    coast: 'EAST',
    lat: 17.686,
    lon: 83.218,
    type: 'MAJOR',
    cargoType: 'Petroleum, Iron Ore, Containers, Naval Dockyard',
    annualTrafficMT: 73.7,
    criticalityScore: 5
  },
  {
    id: 'in-gvr',
    name: 'Gangavaram Port',
    state: 'Andhra Pradesh',
    coast: 'EAST',
    lat: 17.625,
    lon: 83.235,
    type: 'INTERMEDIATE',
    cargoType: 'Coal, Steel, Bulk',
    annualTrafficMT: 38.0,
    criticalityScore: 4
  },
  {
    id: 'in-kkn',
    name: 'Kakinada Deepwater Port',
    state: 'Andhra Pradesh',
    coast: 'EAST',
    lat: 16.983,
    lon: 82.283,
    type: 'INTERMEDIATE',
    cargoType: 'Rice, Fertilizer, Offshore Supply',
    annualTrafficMT: 20.5,
    criticalityScore: 4
  },
  {
    id: 'in-kpt',
    name: 'Krishnapatnam Port',
    state: 'Andhra Pradesh',
    coast: 'EAST',
    lat: 14.254,
    lon: 80.124,
    type: 'INTERMEDIATE',
    cargoType: 'Coal, Fertilizer, Containers',
    annualTrafficMT: 50.0,
    criticalityScore: 4
  },
  {
    id: 'in-enn',
    name: 'Kamarajar (Ennore) Port',
    state: 'Tamil Nadu & Puducherry',
    coast: 'EAST',
    lat: 13.256,
    lon: 80.332,
    type: 'MAJOR',
    cargoType: 'Thermal Coal, Automobiles, LNG',
    annualTrafficMT: 43.5,
    criticalityScore: 5
  },
  {
    id: 'in-maa',
    name: 'Chennai Port',
    state: 'Tamil Nadu & Puducherry',
    coast: 'EAST',
    lat: 13.084,
    lon: 80.297,
    type: 'MAJOR',
    cargoType: 'Containers, Automobiles, POL',
    annualTrafficMT: 48.0,
    criticalityScore: 5
  },
  {
    id: 'in-tut',
    name: 'V.O. Chidambaranar (Tuticorin) Port',
    state: 'Tamil Nadu & Puducherry',
    coast: 'EAST',
    lat: 8.751,
    lon: 78.188,
    type: 'MAJOR',
    cargoType: 'Containers, Coal, Copper Ore',
    annualTrafficMT: 38.0,
    criticalityScore: 4
  },

  // WEST COAST (Arabian Sea)
  {
    id: 'in-cok',
    name: 'Cochin Port (Vallarpadam)',
    state: 'Kerala',
    coast: 'WEST',
    lat: 9.965,
    lon: 76.267,
    type: 'MAJOR',
    cargoType: 'Container Transshipment, Crude, LNG',
    annualTrafficMT: 35.2,
    criticalityScore: 5
  },
  {
    id: 'in-nml',
    name: 'New Mangalore Port',
    state: 'Karnataka',
    coast: 'WEST',
    lat: 12.928,
    lon: 74.819,
    type: 'MAJOR',
    cargoType: 'POL, LPG, Iron Ore Pellets',
    annualTrafficMT: 41.4,
    criticalityScore: 4
  },
  {
    id: 'in-mrn',
    name: 'Mormugao Port',
    state: 'Goa',
    coast: 'WEST',
    lat: 15.412,
    lon: 73.801,
    type: 'MAJOR',
    cargoType: 'Iron Ore, Coal, Cruise Terminals',
    annualTrafficMT: 20.6,
    criticalityScore: 4
  },
  {
    id: 'in-jnp',
    name: 'Jawaharlal Nehru Port (JNPT / Nhava Sheva)',
    state: 'Maharashtra',
    coast: 'WEST',
    lat: 18.949,
    lon: 72.951,
    type: 'MAJOR',
    cargoType: 'Premier Container Gateway of India',
    annualTrafficMT: 76.0,
    criticalityScore: 5
  },
  {
    id: 'in-bom',
    name: 'Mumbai Port Trust',
    state: 'Maharashtra',
    coast: 'WEST',
    lat: 18.945,
    lon: 72.842,
    type: 'MAJOR',
    cargoType: 'POL, Chemical, General Cargo',
    annualTrafficMT: 63.6,
    criticalityScore: 5
  },
  {
    id: 'in-mun',
    name: 'Mundra Port',
    state: 'Gujarat',
    coast: 'WEST',
    lat: 22.744,
    lon: 69.704,
    type: 'MAJOR',
    cargoType: 'Largest Private Commercial Port, Containers, Coal',
    annualTrafficMT: 155.0,
    criticalityScore: 5
  },
  {
    id: 'in-ixy',
    name: 'Deendayal (Kandla) Port',
    state: 'Gujarat',
    coast: 'WEST',
    lat: 23.003,
    lon: 70.219,
    type: 'MAJOR',
    cargoType: 'Crude Oil, Dry Bulk, Grains',
    annualTrafficMT: 137.5,
    criticalityScore: 5
  }
];

// Helper: Haversine distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Find exposed Indian coastal assets within radius buffer (km) of a track
export function getExposedIndianAssets(trackPoints: Array<{ lat: number; lon: number }>, radiusKm: number = 250) {
  const exposedPorts: Array<IndianCoastalPort & { minDistanceKm: number }> = [];
  const exposedStates = new Set<string>();

  INDIAN_COASTAL_PORTS.forEach(port => {
    let minD = Infinity;
    trackPoints.forEach(pt => {
      const d = calculateDistanceKm(pt.lat, pt.lon, port.lat, port.lon);
      if (d < minD) minD = d;
    });

    if (minD <= radiusKm) {
      exposedPorts.push({
        ...port,
        minDistanceKm: minD
      });
      exposedStates.add(port.state);
    }
  });

  // Sort by closest proximity
  exposedPorts.sort((a, b) => a.minDistanceKm - b.minDistanceKm);

  return {
    exposedPorts,
    exposedStates: Array.from(exposedStates),
    totalExposedTrafficMT: exposedPorts.reduce((acc, p) => acc + p.annualTrafficMT, 0),
    highestCriticalityPort: exposedPorts.length > 0 ? exposedPorts[0] : null
  };
}
