export const CROP_TRANSLATIONS_TA: Record<string, string> = {
  // Crops
  'Banana': 'வாழைப்பழம்',
  'Mango': 'மாம்பழம்',
  'Tomato': 'தக்காளி',
  'Onion': 'வெங்காயம்',
  'Brinjal': 'கத்திரிக்காய்',
  'Brinjal / Eggplant': 'கத்திரிக்காய்',
  'Bhendi': 'வெண்டைக்காய்',
  'Bhendi / Okra': 'வெண்டைக்காய்',
  'Okra': 'வெண்டைக்காய்',
  'Green Chilli': 'பச்சை மிளகாய்',
  'Drumstick': 'முருங்கைக்காய்',
  'Drumstick / Moringa': 'முருங்கைக்காய்',
  'Beetroot': 'பீட்ரூட்',
  'Bottle Gourd': 'சுரைக்காய்',
  'Bitter Gourd': 'பாகற்காய்',
  'Snake Gourd': 'புடலங்காய்',
  'Carrot': 'கேரட்',
  'Tapioca': 'மரவள்ளிக்கிழங்கு',
  'Coconut': 'தேங்காய்',
  'Guava': 'கொய்யா',
  'Papaya': 'பப்பாளி',
  'Watermelon': 'தர்பூசணி',
  'Pomegranate': 'மாதுளை',
  'Turmeric': 'மஞ்சள்',
  'Ginger': 'இஞ்சி',
  'Garlic': 'பூண்டு',
  'Potato': 'உருளைக்கிழங்கு',
  'Cabbage': 'முட்டைக்கோஸ்',
  'Cauliflower': 'காலிபிளவர்',
};

export const VARIETY_TRANSLATIONS_TA: Record<string, string> = {
  // Varieties
  'Grand Naine': 'கிராண்ட் நைன்',
  'Poovan': 'பூவன்',
  'Rasthali': 'ரஸ்தாளி',
  'Karpooravalli': 'கற்பூரவள்ளி',
  'Nendran': 'நேந்திரன்',
  'Agrifound Dark Red': 'அக்ரிஃபவுண்ட் டார்க் ரெட்',
  'Red Onion': 'சிவப்பு வெங்காயம்',
  'Small Onion': 'சின்ன வெங்காயம் (சாம்பார் வெங்காயம்)',
  'Bellary Onion': 'பெல்லாரி வெங்காயம்',
  'Alphonso': 'அல்போன்சா',
  'Banganapalli': 'பங்கனபள்ளி',
  'Neelum': 'நீலம்',
  'Sendura': 'செந்தூரா',
  'Malgova': 'மல்கோவா',
  'CO-3 Hybrid Country': 'CO-3 நாட்டு தக்காளி',
  'Hybrid Country': 'ஹைபிரிட் நாட்டு தக்காளி',
  'Vaishnavi': 'வைஷ்ணவி',
  'PKM-1': 'PKM-1 முருங்கை',
  'Ruby Queen': 'ரூபி குயின்',
  'Arka Anamika': 'அர்கா அநாமிகா',
  'G4 Chilli': 'G4 பச்சை மிளகாய்',
  'Local Variety': 'உள்ளூர் ரகம்',
  'Standard Variety': 'தரப்படுத்தப்பட்ட ரகம்',
};

export const USER_NAME_TRANSLATIONS_TA: Record<string, string> = {
  'Natshathra Murugesh': 'நட்சத்திரா முருகேஷ்',
  'Muthu Farmer': 'முத்து விவசாயி',
  'Chat Farmer': 'உரையாடல் விவசாயி',
  'kanbaba': 'கன்பாபா',
  'Farmer': 'விவசாயி',
  'Buyer': 'வாங்குபவர்',
  'Admin': 'நிர்வாகி',
};

/**
 * Translates a crop name into Tamil if language is 'ta'
 */
export const translateCrop = (cropName?: string, lang: string = 'en'): string => {
  if (!cropName) return '';
  if (lang !== 'ta') return cropName;

  const key = cropName.trim();
  if (CROP_TRANSLATIONS_TA[key]) {
    return CROP_TRANSLATIONS_TA[key];
  }

  // Case-insensitive lookup fallback
  const lowerKey = key.toLowerCase();
  for (const [enKey, taVal] of Object.entries(CROP_TRANSLATIONS_TA)) {
    if (enKey.toLowerCase() === lowerKey) {
      return taVal;
    }
  }

  return cropName;
};

/**
 * Translates a variety name into Tamil if language is 'ta'
 */
export const translateVariety = (varietyName?: string, lang: string = 'en'): string => {
  if (!varietyName) return '';
  if (lang !== 'ta') return varietyName;

  const key = varietyName.trim();
  if (VARIETY_TRANSLATIONS_TA[key]) {
    return VARIETY_TRANSLATIONS_TA[key];
  }

  // Case-insensitive lookup fallback
  const lowerKey = key.toLowerCase();
  for (const [enKey, taVal] of Object.entries(VARIETY_TRANSLATIONS_TA)) {
    if (enKey.toLowerCase() === lowerKey) {
      return taVal;
    }
  }

  return varietyName;
};

/**
 * Translates a user/farmer/buyer name into Tamil if language is 'ta'
 */
export const translateUserName = (userName?: string, lang: string = 'en'): string => {
  if (!userName) return '';
  if (lang !== 'ta') return userName;

  const key = userName.trim();
  if (USER_NAME_TRANSLATIONS_TA[key]) {
    return USER_NAME_TRANSLATIONS_TA[key];
  }

  // Check if name contains 'Farmer' or 'Buyer'
  let translated = key;
  translated = translated.replace(/Farmer/gi, 'விவசாயி');
  translated = translated.replace(/Buyer/gi, 'வாங்குபவர்');
  return translated;
};
