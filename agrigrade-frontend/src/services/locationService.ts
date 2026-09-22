import { apiClient } from './apiClient';

export interface Country {
  id: number;
  name: string;
  code: string;
}

export interface State {
  id: number;
  countryId: number;
  name: string;
  code: string;
  type: string;
}

export interface District {
  id: number;
  stateId: number;
  name: string;
  code?: string;
}

export interface Taluk {
  id: number;
  districtId: number;
  name: string;
  code?: string;
}

export const TN_DISTRICTS_FALLBACK: District[] = [
  { id: 1, stateId: 1, name: 'Ariyalur', code: 'TN-AR' },
  { id: 2, stateId: 1, name: 'Chengalpattu', code: 'TN-CGL' },
  { id: 3, stateId: 1, name: 'Chennai', code: 'TN-CH' },
  { id: 4, stateId: 1, name: 'Coimbatore', code: 'TN-CO' },
  { id: 5, stateId: 1, name: 'Cuddalore', code: 'TN-CU' },
  { id: 6, stateId: 1, name: 'Dharmapuri', code: 'TN-DH' },
  { id: 7, stateId: 1, name: 'Dindigul', code: 'TN-DI' },
  { id: 8, stateId: 1, name: 'Erode', code: 'TN-ER' },
  { id: 9, stateId: 1, name: 'Kallakurichi', code: 'TN-KL' },
  { id: 10, stateId: 1, name: 'Kancheepuram', code: 'TN-KC' },
  { id: 11, stateId: 1, name: 'Karur', code: 'TN-KR' },
  { id: 12, stateId: 1, name: 'Krishnagiri', code: 'TN-KG' },
  { id: 13, stateId: 1, name: 'Madurai', code: 'TN-MA' },
  { id: 14, stateId: 1, name: 'Mayiladuthurai', code: 'TN-MY' },
  { id: 15, stateId: 1, name: 'Nagapattinam', code: 'TN-NG' },
  { id: 16, stateId: 1, name: 'Kanniyakumari', code: 'TN-KK' },
  { id: 17, stateId: 1, name: 'Namakkal', code: 'TN-NM' },
  { id: 18, stateId: 1, name: 'Nilgiris', code: 'TN-NI' },
  { id: 19, stateId: 1, name: 'Perambalur', code: 'TN-PE' },
  { id: 20, stateId: 1, name: 'Pudukkottai', code: 'TN-PU' },
  { id: 21, stateId: 1, name: 'Ramanathapuram', code: 'TN-RA' },
  { id: 22, stateId: 1, name: 'Ranipet', code: 'TN-RN' },
  { id: 23, stateId: 1, name: 'Salem', code: 'TN-SA' },
  { id: 24, stateId: 1, name: 'Sivaganga', code: 'TN-SI' },
  { id: 25, stateId: 1, name: 'Tenkasi', code: 'TN-TS' },
  { id: 26, stateId: 1, name: 'Thanjavur', code: 'TN-TJ' },
  { id: 27, stateId: 1, name: 'Theni', code: 'TN-TH' },
  { id: 28, stateId: 1, name: 'Thoothukudi', code: 'TN-TK' },
  { id: 29, stateId: 1, name: 'Tiruchirappalli', code: 'TN-TC' },
  { id: 30, stateId: 1, name: 'Tirunelveli', code: 'TN-TI' },
  { id: 31, stateId: 1, name: 'Tirupathur', code: 'TN-TP' },
  { id: 32, stateId: 1, name: 'Tiruppur', code: 'TN-TU' },
  { id: 33, stateId: 1, name: 'Tiruvallur', code: 'TN-TL' },
  { id: 34, stateId: 1, name: 'Tiruvannamalai', code: 'TN-TV' },
  { id: 35, stateId: 1, name: 'Tiruvarur', code: 'TN-TR' },
  { id: 36, stateId: 1, name: 'Vellore', code: 'TN-VE' },
  { id: 37, stateId: 1, name: 'Viluppuram', code: 'TN-VL' },
  { id: 38, stateId: 1, name: 'Virudhunagar', code: 'TN-VR' },
];

export const locationService = {
  getCountries: async (): Promise<Country[]> => {
    try {
      const response = await apiClient.get<Country[]>('/locations/countries');
      return Array.isArray(response) && response.length > 0
        ? response
        : [{ id: 1, name: 'India', code: 'IN' }];
    } catch {
      return [{ id: 1, name: 'India', code: 'IN' }];
    }
  },

  getStates: async (countryCode: string = 'IN'): Promise<State[]> => {
    try {
      const response = await apiClient.get<State[]>(`/locations/states?country=${countryCode}`);
      return Array.isArray(response) && response.length > 0
        ? response
        : [{ id: 1, countryId: 1, name: 'Tamil Nadu', code: 'TN', type: 'STATE' }];
    } catch {
      return [{ id: 1, countryId: 1, name: 'Tamil Nadu', code: 'TN', type: 'STATE' }];
    }
  },

  getDistricts: async (stateId: number = 1): Promise<District[]> => {
    try {
      const response = await apiClient.get<District[]>(`/locations/districts?stateId=${stateId}`);
      return Array.isArray(response) && response.length > 0
        ? response
        : TN_DISTRICTS_FALLBACK;
    } catch {
      return TN_DISTRICTS_FALLBACK;
    }
  },

  getTaluks: async (districtId: number): Promise<Taluk[]> => {
    try {
      const response = await apiClient.get<Taluk[]>(`/locations/taluks?districtId=${districtId}`);
      return Array.isArray(response) ? response : [];
    } catch {
      return [];
    }
  },
};
