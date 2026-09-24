/**
 * AgriGrade AI — Crop Fallback & Default Image Catalog
 * Provides high-definition curated imagery and inline SVG fallbacks for all supported crops.
 */

const CROP_PHOTOS: Record<string, string> = {
  banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80',
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
  'small onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80',
  brinjal: 'https://images.unsplash.com/photo-1628773822503-930a8451871f?auto=format&fit=crop&w=800&q=80',
  eggplant: 'https://images.unsplash.com/photo-1628773822503-930a8451871f?auto=format&fit=crop&w=800&q=80',
  bhendi: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80',
  okra: 'https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=800&q=80',
  'green chilli': 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
  chilli: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=800&q=80',
  drumstick: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
  moringa: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
  'bottle gourd': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
  'bitter gourd': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
  'snake gourd': 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
  gourd: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  tapioca: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80',
  beetroot: 'https://images.unsplash.com/photo-1593105544559-ecb03bf2624b?auto=format&fit=crop&w=800&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80',
};

const BASE_API_URL = (import.meta.env.VITE_API_URL as string) || 'https://agrigrade-backend-0g8z.onrender.com/api/v1';
const BACKEND_BASE = BASE_API_URL.replace(/\/api\/v1\/?$/, '');

export function getInlineNeutralSvg(label: string = 'AGRICULTURAL PRODUCE'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#EEF8F0"/><stop offset="100%" stop-color="#E8F5E9"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/><rect x="10" y="10" width="580" height="380" rx="16" fill="none" stroke="#C5E6CC" stroke-width="2" stroke-dasharray="6 4"/><circle cx="300" cy="160" r="44" fill="#2E7D32" opacity="0.12"/><path d="M300 132 C284 132 272 144 272 160 C272 180 300 204 300 204 C300 204 328 180 328 160 C328 144 316 132 300 132 Z" fill="#2E7D32"/><circle cx="300" cy="158" r="8" fill="#FFFFFF"/><text x="300" y="245" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="18" fill="#1B5E20" text-anchor="middle" letter-spacing="1">${label.toUpperCase()}</text><text x="300" y="275" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="13" fill="#2E7D32" text-anchor="middle">AGRIGRADE AI QUALITY INSPECTED</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getCropFallbackImage(cropName?: string): string {
  if (!cropName) return CROP_PHOTOS.banana;

  const normalized = cropName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  for (const [key, photoUrl] of Object.entries(CROP_PHOTOS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return photoUrl;
    }
  }

  // Check keyword matches
  if (normalized.includes('tomato')) return CROP_PHOTOS.tomato;
  if (normalized.includes('onion')) return CROP_PHOTOS.onion;
  if (normalized.includes('mango')) return CROP_PHOTOS.mango;
  if (normalized.includes('banana') || normalized.includes('grand naine') || normalized.includes('g9')) return CROP_PHOTOS.banana;
  if (normalized.includes('brinjal') || normalized.includes('eggplant')) return CROP_PHOTOS.brinjal;
  if (normalized.includes('bhendi') || normalized.includes('okra')) return CROP_PHOTOS.bhendi;
  if (normalized.includes('chilli') || normalized.includes('chili')) return CROP_PHOTOS['green chilli'];
  if (normalized.includes('gourd')) return CROP_PHOTOS.gourd;
  if (normalized.includes('beet')) return CROP_PHOTOS.beetroot;
  if (normalized.includes('tapioca') || normalized.includes('tuber')) return CROP_PHOTOS.tapioca;
  if (normalized.includes('carrot')) return CROP_PHOTOS.carrot;

  return CROP_PHOTOS.banana;
}

export function resolveImageUrl(url?: string | null, cropName?: string): string {
  if (!url || url === 'null' || url.trim() === '') {
    return getCropFallbackImage(cropName);
  }

  // Intercept synthetic backend card placeholders, crop_image_ urls, or dummy SVG text boxes
  if (
    url.includes('crop_image') ||
    url.includes('crop_image_') ||
    url.includes('Batch%20501') ||
    url.includes('Batch%20502') ||
    url.includes('Batch%20') ||
    url.includes('AGRICULTURAL%20PRODUCE') ||
    url.includes('AgriGrade%20AI%20Quality') ||
    url.includes('data:image/svg+xml')
  ) {
    return getCropFallbackImage(cropName);
  }

  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${BACKEND_BASE}${url}`;
  }
  return `${BACKEND_BASE}/${url}`;
}

export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  cropName?: string,
  context?: { listingId?: number | string; listingCode?: string; batchId?: number | string; imageId?: number | string }
) {
  const target = e.currentTarget;
  const fallback = getCropFallbackImage(cropName);

  if (context) {
    console.warn(
      `[AgriGrade Image Handler] Failed to load image from ${target.src}. Using crop-matched fallback for ${cropName || 'Produce'}.`
    );
  }

  if (target.src !== fallback) {
    target.src = fallback;
  }
}

export function calculateDynamicShelfLife(cropName?: string, harvestDateStr?: string, assignedGrade?: string): number {
  if (!cropName) return 7;
  const nameLower = cropName.toLowerCase();

  let baseDays = 14;
  if (nameLower.includes('banana')) baseDays = 12;
  else if (nameLower.includes('mango')) baseDays = 14;
  else if (nameLower.includes('tomato')) baseDays = 10;
  else if (nameLower.includes('onion')) baseDays = 30;
  else if (nameLower.includes('brinjal') || nameLower.includes('eggplant')) baseDays = 7;
  else if (nameLower.includes('bhendi') || nameLower.includes('okra')) baseDays = 5;
  else if (nameLower.includes('chilli')) baseDays = 10;
  else if (nameLower.includes('drumstick') || nameLower.includes('moringa')) baseDays = 7;
  else if (nameLower.includes('gourd')) baseDays = 10;
  else if (nameLower.includes('carrot')) baseDays = 21;
  else if (nameLower.includes('beetroot')) baseDays = 20;
  else if (nameLower.includes('tapioca')) baseDays = 15;

  let gradeFactor = 1.0;
  if (assignedGrade) {
    const g = assignedGrade.toUpperCase();
    if (g.includes('REJECT')) return 0;
    if (g.includes('GRADE_A_PREMIUM') || g.includes('PREMIUM') || g === 'GRADE_A') gradeFactor = 1.2;
    else if (g.includes('GRADE_B')) gradeFactor = 0.85;
    else if (g.includes('GRADE_C')) gradeFactor = 0.65;
  }

  const effectiveDays = baseDays * gradeFactor;

  if (harvestDateStr) {
    const harvestDate = new Date(harvestDateStr);
    const now = new Date();
    if (!isNaN(harvestDate.getTime())) {
      const ageDays = Math.max(0, Math.floor((now.getTime() - harvestDate.getTime()) / (1000 * 3600 * 24)));
      return Math.max(0, Math.round(effectiveDays - ageDays));
    }
  }

  return Math.round(effectiveDays);
}

