import { apiClient } from './apiClient';

export interface Crop {
  id: number;
  categoryId?: number;
  categoryName?: string;
  code: string;
  name: string;
  scientificName?: string;
  baseShelfLifeDays?: number;
  defaultStorageCondition?: string;
  isActive: boolean;
}

export interface CropVariety {
  id: number;
  cropId: number;
  cropName?: string;
  code: string;
  name: string;
  scientificName?: string;
  isActive: boolean;
}

export interface UpdateCropPayload {
  name?: string;
  scientificName?: string;
  baseShelfLifeDays?: number;
  defaultStorageCondition?: string;
  isActive?: boolean;
}

export interface CreateVarietyPayload {
  code?: string;
  name: string;
  scientificName?: string;
  isActive?: boolean;
}

export const FALLBACK_CROPS: Crop[] = [
  { id: 1, categoryId: 1, categoryName: 'Fruits', code: 'BANANA', name: 'Banana', scientificName: 'Musa acuminata', baseShelfLifeDays: 12, defaultStorageCondition: 'Cool, ventilated storage', isActive: true },
  { id: 2, categoryId: 1, categoryName: 'Fruits', code: 'MANGO', name: 'Mango', scientificName: 'Mangifera indica', baseShelfLifeDays: 14, defaultStorageCondition: 'Cool storage', isActive: true },
  { id: 3, categoryId: 2, categoryName: 'Vegetables', code: 'TOMATO', name: 'Tomato', scientificName: 'Solanum lycopersicum', baseShelfLifeDays: 10, defaultStorageCondition: 'Ambient / cool storage', isActive: true },
  { id: 4, categoryId: 3, categoryName: 'Root & Tuber Vegetables', code: 'ONION', name: 'Onion', scientificName: 'Allium cepa', baseShelfLifeDays: 30, defaultStorageCondition: 'Dry, well-ventilated storage', isActive: true },
  { id: 5, categoryId: 2, categoryName: 'Vegetables', code: 'BRINJAL', name: 'Brinjal / Eggplant', scientificName: 'Solanum melongena', baseShelfLifeDays: 7, defaultStorageCondition: 'Cool, humid storage', isActive: true },
  { id: 6, categoryId: 2, categoryName: 'Vegetables', code: 'BHENDI', name: 'Bhendi / Okra', scientificName: 'Abelmoschus esculentus', baseShelfLifeDays: 5, defaultStorageCondition: 'Cool, humid storage', isActive: true },
  { id: 7, categoryId: 2, categoryName: 'Vegetables', code: 'CHILLI', name: 'Green Chilli', scientificName: 'Capsicum annuum', baseShelfLifeDays: 10, defaultStorageCondition: 'Cool storage', isActive: true },
  { id: 8, categoryId: 2, categoryName: 'Vegetables', code: 'DRUMSTICK', name: 'Drumstick / Moringa', scientificName: 'Moringa oleifera', baseShelfLifeDays: 7, defaultStorageCondition: 'Cool, humid storage', isActive: true },
  { id: 9, categoryId: 2, categoryName: 'Vegetables', code: 'BOTTLE_GOURD', name: 'Bottle Gourd', scientificName: 'Lagenaria siceraria', baseShelfLifeDays: 14, defaultStorageCondition: 'Cool, dry storage', isActive: true },
  { id: 10, categoryId: 2, categoryName: 'Vegetables', code: 'BITTER_GOURD', name: 'Bitter Gourd', scientificName: 'Momordica charantia', baseShelfLifeDays: 8, defaultStorageCondition: 'Cool storage', isActive: true },
  { id: 11, categoryId: 2, categoryName: 'Vegetables', code: 'SNAKE_GOURD', name: 'Snake Gourd', scientificName: 'Trichosanthes cucumerina', baseShelfLifeDays: 7, defaultStorageCondition: 'Cool storage', isActive: true },
  { id: 12, categoryId: 3, categoryName: 'Root & Tuber Vegetables', code: 'CARROT', name: 'Carrot', scientificName: 'Daucus carota', baseShelfLifeDays: 21, defaultStorageCondition: 'Refrigerated storage', isActive: true },
  { id: 13, categoryId: 3, categoryName: 'Root & Tuber Vegetables', code: 'BEETROOT', name: 'Beetroot', scientificName: 'Beta vulgaris', baseShelfLifeDays: 20, defaultStorageCondition: 'Refrigerated / cool storage', isActive: true },
  { id: 14, categoryId: 3, categoryName: 'Root & Tuber Vegetables', code: 'TAPIOCA', name: 'Tapioca', scientificName: 'Manihot esculenta', baseShelfLifeDays: 15, defaultStorageCondition: 'Cool, dry storage', isActive: true },
];

export const FALLBACK_VARIETIES: Record<number, CropVariety[]> = {
  1: [ // Banana
    { id: 101, cropId: 1, code: 'BANANA_ROBUSTA', name: 'Robusta', isActive: true },
    { id: 102, cropId: 1, code: 'BANANA_RASTHALI', name: 'Rasthali', isActive: true },
    { id: 103, cropId: 1, code: 'BANANA_POOVAN', name: 'Poovan', isActive: true },
    { id: 104, cropId: 1, code: 'BANANA_NENDRAN', name: 'Nendran', isActive: true },
    { id: 105, cropId: 1, code: 'BANANA_YELAKKI', name: 'Yelakki', isActive: true },
    { id: 106, cropId: 1, code: 'BANANA_G9', name: 'Grand Naine', isActive: true },
    { id: 107, cropId: 1, code: 'BANANA_MONTHAN', name: 'Monthan', isActive: true },
    { id: 108, cropId: 1, code: 'BANANA_KARPURAVALLI', name: 'Karpuravalli', isActive: true },
    { id: 109, cropId: 1, code: 'BANANA_NEY_POOVAN', name: 'Ney Poovan', isActive: true },
    { id: 110, cropId: 1, code: 'BANANA_RED', name: 'Red Banana', isActive: true },
  ],
  2: [ // Mango
    { id: 201, cropId: 2, code: 'MANGO_ALPHONSO', name: 'Alphonso', isActive: true },
    { id: 202, cropId: 2, code: 'MANGO_BANGANAPALLI', name: 'Banganapalli', isActive: true },
    { id: 203, cropId: 2, code: 'MANGO_TOTAPURI', name: 'Totapuri', isActive: true },
    { id: 204, cropId: 2, code: 'MANGO_KESAR', name: 'Kesar', isActive: true },
    { id: 205, cropId: 2, code: 'MANGO_DASHEHARI', name: 'Dashehari', isActive: true },
    { id: 206, cropId: 2, code: 'MANGO_NEELAM', name: 'Neelam', isActive: true },
    { id: 207, cropId: 2, code: 'MANGO_MALLIKA', name: 'Mallika', isActive: true },
    { id: 208, cropId: 2, code: 'MANGO_CHAUSA', name: 'Chausa', isActive: true },
    { id: 209, cropId: 2, code: 'MANGO_IMAM_PASAND', name: 'Imam Pasand', isActive: true },
    { id: 210, cropId: 2, code: 'MANGO_MALGOA', name: 'Malgoa', isActive: true },
  ],
  3: [ // Tomato
    { id: 301, cropId: 3, code: 'TOMATO_ARKA_RAKSHAK', name: 'Arka Rakshak', isActive: true },
    { id: 302, cropId: 3, code: 'TOMATO_ARKA_VIKAS', name: 'Arka Vikas', isActive: true },
    { id: 303, cropId: 3, code: 'TOMATO_ARKA_SAURABH', name: 'Arka Saurabh', isActive: true },
    { id: 304, cropId: 3, code: 'TOMATO_PUSA_RUBY', name: 'Pusa Ruby', isActive: true },
    { id: 305, cropId: 3, code: 'TOMATO_PUSA_HYBRID_4', name: 'Pusa Hybrid-4', isActive: true },
    { id: 306, cropId: 3, code: 'TOMATO_NAMDHARI', name: 'Namdhari', isActive: true },
    { id: 307, cropId: 3, code: 'TOMATO_VAISHNAVI', name: 'Vaishnavi', isActive: true },
    { id: 308, cropId: 3, code: 'TOMATO_ABHINAV', name: 'Abhinav', isActive: true },
    { id: 309, cropId: 3, code: 'TOMATO_CO3', name: 'CO-3 (Hybrid Country)', isActive: true },
  ],
  4: [ // Onion
    { id: 401, cropId: 4, code: 'ONION_N53', name: 'N-53', isActive: true },
    { id: 402, cropId: 4, code: 'ONION_AGRIFOUND_LIGHT_RED', name: 'Agrifound Light Red', isActive: true },
    { id: 403, cropId: 4, code: 'ONION_AGRIFOUND_DARK_RED', name: 'Agrifound Dark Red', isActive: true },
    { id: 404, cropId: 4, code: 'ONION_BHIMA_SUPER', name: 'Bhima Super', isActive: true },
    { id: 405, cropId: 4, code: 'ONION_BHIMA_KIRAN', name: 'Bhima Kiran', isActive: true },
    { id: 406, cropId: 4, code: 'ONION_BHIMA_SHAKTI', name: 'Bhima Shakti', isActive: true },
    { id: 407, cropId: 4, code: 'ONION_PUSA_RED', name: 'Pusa Red', isActive: true },
    { id: 408, cropId: 4, code: 'ONION_SHALLOT', name: 'Small Onion / Shallot', isActive: true },
  ],
  5: [ // Brinjal / Eggplant
    { id: 501, cropId: 5, code: 'BRINJAL_PUSA_PURPLE_LONG', name: 'Pusa Purple Long', isActive: true },
    { id: 502, cropId: 5, code: 'BRINJAL_PUSA_PURPLE_ROUND', name: 'Pusa Purple Round', isActive: true },
    { id: 503, cropId: 5, code: 'BRINJAL_ARKA_NIDHI', name: 'Arka Nidhi', isActive: true },
    { id: 504, cropId: 5, code: 'BRINJAL_ARKA_KESHAV', name: 'Arka Keshav', isActive: true },
    { id: 505, cropId: 5, code: 'BRINJAL_ARKA_NEELKANTH', name: 'Arka Neelkanth', isActive: true },
    { id: 506, cropId: 5, code: 'BRINJAL_UJALA', name: 'Ujala', isActive: true },
    { id: 507, cropId: 5, code: 'BRINJAL_BLACK_BEAUTY', name: 'Black Beauty', isActive: true },
  ],
  6: [ // Bhendi / Okra
    { id: 601, cropId: 6, code: 'BHENDI_ARKA_ANAMIKA', name: 'Arka Anamika', isActive: true },
    { id: 602, cropId: 6, code: 'BHENDI_ARKA_ABHAY', name: 'Arka Abhay', isActive: true },
    { id: 603, cropId: 6, code: 'BHENDI_PUSA_SAWANI', name: 'Pusa Sawani', isActive: true },
    { id: 604, cropId: 6, code: 'BHENDI_PUSA_A4', name: 'Pusa A-4', isActive: true },
    { id: 605, cropId: 6, code: 'BHENDI_PARBHANI_KRANTI', name: 'Parbhani Kranti', isActive: true },
    { id: 606, cropId: 6, code: 'BHENDI_VIJAY', name: 'Vijay', isActive: true },
    { id: 607, cropId: 6, code: 'BHENDI_VARSHA', name: 'Varsha', isActive: true },
  ],
  7: [ // Green Chilli
    { id: 701, cropId: 7, code: 'CHILLI_PUSA_JWALA', name: 'Pusa Jwala', isActive: true },
    { id: 702, cropId: 7, code: 'CHILLI_PANT_C1', name: 'Pant C-1', isActive: true },
    { id: 703, cropId: 7, code: 'CHILLI_ARKA_LOHIT', name: 'Arka Lohit', isActive: true },
    { id: 704, cropId: 7, code: 'CHILLI_BYADAGI', name: 'Byadagi', isActive: true },
    { id: 705, cropId: 7, code: 'CHILLI_G4', name: 'G-4', isActive: true },
    { id: 706, cropId: 7, code: 'CHILLI_LCA235', name: 'LCA-235', isActive: true },
    { id: 707, cropId: 7, code: 'CHILLI_KASHI_ANMOL', name: 'Kashi Anmol', isActive: true },
  ],
  8: [ // Drumstick / Moringa
    { id: 801, cropId: 8, code: 'DRUMSTICK_PKM1', name: 'PKM-1', isActive: true },
    { id: 802, cropId: 8, code: 'DRUMSTICK_PKM2', name: 'PKM-2', isActive: true },
    { id: 803, cropId: 8, code: 'DRUMSTICK_ODC3', name: 'ODC-3', isActive: true },
    { id: 804, cropId: 8, code: 'DRUMSTICK_BHAGYA', name: 'Bhagya', isActive: true },
    { id: 805, cropId: 8, code: 'DRUMSTICK_DHANRAJ', name: 'Dhanraj', isActive: true },
    { id: 806, cropId: 8, code: 'DRUMSTICK_CO1', name: 'Coimbatore-1', isActive: true },
    { id: 807, cropId: 8, code: 'DRUMSTICK_CO2', name: 'Coimbatore-2', isActive: true },
  ],
  9: [ // Bottle Gourd
    { id: 901, cropId: 9, code: 'BOTTLE_GOURD_ARKA_BAHAR', name: 'Arka Bahar', isActive: true },
    { id: 902, cropId: 9, code: 'BOTTLE_GOURD_PUSA_NAVEEN', name: 'Pusa Naveen', isActive: true },
    { id: 903, cropId: 9, code: 'BOTTLE_GOURD_PUSA_SUMMER', name: 'Pusa Summer Prolific Long', isActive: true },
    { id: 904, cropId: 9, code: 'BOTTLE_GOURD_PUNJAB_LONG', name: 'Punjab Long', isActive: true },
    { id: 905, cropId: 9, code: 'BOTTLE_GOURD_KASHI_GANGA', name: 'Kashi Ganga', isActive: true },
  ],
  10: [ // Bitter Gourd
    { id: 1001, cropId: 10, code: 'BITTER_GOURD_PRIYA', name: 'Priya', isActive: true },
    { id: 1002, cropId: 10, code: 'BITTER_GOURD_PREETHI', name: 'Preethi', isActive: true },
    { id: 1003, cropId: 10, code: 'BITTER_GOURD_ARKA_HARIT', name: 'Arka Harit', isActive: true },
    { id: 1004, cropId: 10, code: 'BITTER_GOURD_PUSA_DO_MAUSAMI', name: 'Pusa Do Mausami', isActive: true },
    { id: 1005, cropId: 10, code: 'BITTER_GOURD_COIMBATORE_LONG', name: 'Coimbatore Long', isActive: true },
    { id: 1006, cropId: 10, code: 'BITTER_GOURD_MDU1', name: 'MDU-1', isActive: true },
  ],
  11: [ // Snake Gourd
    { id: 1101, cropId: 11, code: 'SNAKE_GOURD_COIMBATORE_LONG', name: 'Coimbatore Long', isActive: true },
    { id: 1102, cropId: 11, code: 'SNAKE_GOURD_CO1', name: 'CO-1', isActive: true },
    { id: 1103, cropId: 11, code: 'SNAKE_GOURD_CO2', name: 'CO-2', isActive: true },
    { id: 1104, cropId: 11, code: 'SNAKE_GOURD_PKM1', name: 'PKM-1', isActive: true },
    { id: 1105, cropId: 11, code: 'SNAKE_GOURD_ARKA_PRABHATH', name: 'Arka Prabhath', isActive: true },
  ],
  12: [ // Carrot
    { id: 1201, cropId: 12, code: 'CARROT_PUSA_KESAR', name: 'Pusa Kesar', isActive: true },
    { id: 1202, cropId: 12, code: 'CARROT_PUSA_RUDHIRA', name: 'Pusa Rudhira', isActive: true },
    { id: 1203, cropId: 12, code: 'CARROT_NEW_KURODA', name: 'New Kuroda', isActive: true },
    { id: 1204, cropId: 12, code: 'CARROT_NANTES', name: 'Nantes', isActive: true },
    { id: 1205, cropId: 12, code: 'CARROT_CHANTENAY', name: 'Chantenay', isActive: true },
  ],
  13: [ // Beetroot
    { id: 1301, cropId: 13, code: 'BEETROOT_DETROIT_DARK_RED', name: 'Detroit Dark Red', isActive: true },
    { id: 1302, cropId: 13, code: 'BEETROOT_CRIMSON_GLOBE', name: 'Crimson Globe', isActive: true },
    { id: 1303, cropId: 13, code: 'BEETROOT_EARLY_WONDER', name: 'Early Wonder', isActive: true },
    { id: 1304, cropId: 13, code: 'BEETROOT_RUBY_QUEEN', name: 'Ruby Queen', isActive: true },
    { id: 1305, cropId: 13, code: 'BEETROOT_CYLINDRA', name: 'Cylindra', isActive: true },
  ],
  14: [ // Tapioca
    { id: 1401, cropId: 14, code: 'TAPIOCA_H165', name: 'H-165', isActive: true },
    { id: 1402, cropId: 14, code: 'TAPIOCA_H226', name: 'H-226', isActive: true },
    { id: 1403, cropId: 14, code: 'TAPIOCA_SREE_JAYA', name: 'Sree Jaya', isActive: true },
    { id: 1404, cropId: 14, code: 'TAPIOCA_SREE_VIJAYA', name: 'Sree Vijaya', isActive: true },
    { id: 1405, cropId: 14, code: 'TAPIOCA_SREE_ATHULYA', name: 'Sree Athulya', isActive: true },
    { id: 1406, cropId: 14, code: 'TAPIOCA_M4', name: 'M4', isActive: true },
  ],
};

export const cropService = {
  async getCrops(): Promise<Crop[]> {
    try {
      const data = await apiClient.get<Crop[]>('/crops');
      if (Array.isArray(data) && data.length > 0) {
        return data.filter((c) => c.isActive !== false);
      }
    } catch (err) {
      console.warn('Backend /crops API failed, using fallback:', err);
    }
    return FALLBACK_CROPS;
  },

  async getAllCrops(): Promise<Crop[]> {
    return this.getCrops();
  },

  async getVarietiesByCropId(cropId: number): Promise<CropVariety[]> {
    try {
      const data = await apiClient.get<CropVariety[]>(`/crops/${cropId}/varieties`);
      if (Array.isArray(data) && data.length > 0) {
        return data.filter((v) => v.isActive !== false);
      }
    } catch (err) {
      console.warn(`Backend /crops/${cropId}/varieties API failed, using fallback:`, err);
    }
    return FALLBACK_VARIETIES[cropId] || [];
  },

  async getAllVarieties(): Promise<CropVariety[]> {
    const crops = await this.getCrops();
    const allVars: CropVariety[] = [];
    for (const crop of crops) {
      const varieties = await this.getVarietiesByCropId(crop.id);
      allVars.push(...varieties);
    }
    return allVars;
  },

  async updateCrop(id: number, payload: UpdateCropPayload): Promise<Crop> {
    return apiClient.put<Crop>(`/crops/${id}`, payload);
  },

  async addVariety(cropId: number, payload: CreateVarietyPayload): Promise<CropVariety> {
    return apiClient.post<CropVariety>(`/crops/${cropId}/varieties`, payload);
  },
};
