import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Award,
  Info,
  ChevronRight,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface CropCriteria {
  name: string;
  emoji: string;
  category: string;
  gradeA: string[];
  gradeB: string[];
  gradeC: string[];
  reject: string[];
  shelfLife: string;
}

const CROPS_DATA: CropCriteria[] = [
  {
    name: 'Banana',
    emoji: '🍌',
    category: 'Fruit',
    gradeA: [
      'Clean epidermal surface with no rot or mechanical scars',
      'Uniform color development (Yellow / Greenish-Yellow)',
      'Intact peel structural integrity with zero soft spots',
      'Zero fungal spore colonies or active rot lesions',
      'Moisture level > 70% with high firmness score',
    ],
    gradeB: [
      'Minor cosmetic scratches (< 5% surface area)',
      'Slight color non-uniformity or mild speckling',
      'Intact peel structure with zero active decay',
      'Commercial quality suitable for regional APMC markets',
    ],
    gradeC: [
      'Moderate skin discoloration or bruising (5-15% area)',
      'Advanced maturity or overripe soft texture',
      'Reduced remaining shelf life (1-2 days remaining)',
      'Discounted commercial value for quick liquidation',
    ],
    reject: [
      'Active fungal spore growth (Colletotrichum / Crown rot)',
      'Severe surface rot or pulp breakdown',
      'Liquid oozing or active decay decomposition',
      'Unsafe for human consumption — Barred from trade',
    ],
    shelfLife: '5 - 9 Days (Ambient)',
  },
  {
    name: 'Tomato',
    emoji: '🍅',
    category: 'Vegetable',
    gradeA: [
      'Firm pericarp structure with glossy red epidermal skin',
      'Uniform sphericity and pericarp thickness',
      'Zero radial or concentric growth cracks',
      'Zero calyx fungal infection or dark lesions',
      'Optimal firmness for long-distance transport',
    ],
    gradeB: [
      'Minor surface russeting or light skin blemishes',
      'Slight color variation (Orange-Red to Red)',
      'Intact pericarp with zero soft rot or mold',
    ],
    gradeC: [
      'Noticeable growth cracking or minor sunscald',
      'Soft pericarp structure or overripe condition',
      'Short transport compatibility',
    ],
    reject: [
      'Severe fungal rot (Botrytis cinerea / Alternaria solani)',
      'Water-soaked soft rot (Pectobacterium / Erwinia)',
      'Mold colonies around calyx scar or pulp decomposition',
    ],
    shelfLife: '4 - 7 Days (Ambient)',
  },
  {
    name: 'Mango',
    emoji: '🥭',
    category: 'Fruit',
    gradeA: [
      'Smooth epicarp with vibrant cultivar-specific color',
      'Intact stem end scar with no latex burn',
      'Zero anthracnose spots or stem-end rot',
      'Firm pulp texture with aroma development',
    ],
    gradeB: [
      'Slight wind-rub scars (< 10% surface area)',
      'Minor color patchiness without pulp softening',
      'Free from active disease or internal breakdown',
    ],
    gradeC: [
      'Visible sap stain or sunburn spots',
      'Overripe soft pulp with limited shelf life',
      'Commercial grade for local processing',
    ],
    reject: [
      'Severe anthracnose (Colletotrichum gloeosporioides)',
      'Stem-end rot or internal pulp liquefaction',
      'Active fungal hyphae or fruit fly infestation',
    ],
    shelfLife: '6 - 12 Days (Ambient)',
  },
  {
    name: 'Onion',
    emoji: '🧅',
    category: 'Root Vegetable',
    gradeA: [
      'Dry, tight outer papery skin scales intact',
      'Firm bulb structure with single neck closure',
      'Zero sprouting or root regrowth',
      'Free from neck rot or black mold (Aspergillus niger)',
    ],
    gradeB: [
      'Slight skin peeling or minor shape irregularity',
      'Dry outer scale with firm core',
      'Commercially sound for storage and distribution',
    ],
    gradeC: [
      'Double or split bulbs, loose outer scales',
      'Mild neck softness without active wet rot',
      'Discounted grade for immediate market sale',
    ],
    reject: [
      'Black mold / Aspergillus niger spore infestation',
      'Bacterial soft rot or foul odor emission',
      'Sprouted green shoots with hollowed bulb core',
    ],
    shelfLife: '30 - 60 Days (Dry Storage)',
  },
  {
    name: 'Carrot',
    emoji: '🥕',
    category: 'Root Vegetable',
    gradeA: [
      'Straight, uniform taproot with vibrant orange pigmentation',
      'Crisp texture with high turgor pressure',
      'Zero root splitting, fork growth, or green shoulders',
      'Free from Sclerotinia white rot or cavity spot',
    ],
    gradeB: [
      'Minor root curvature or light surface scratches',
      'Slight green shoulder discoloration (< 5% length)',
      'Firm structure suitable for fresh market',
    ],
    gradeC: [
      'Noticeable root splitting or stubby root shape',
      'Fithy outer skin texture requiring heavy peeling',
      'Commercial grade for juice/processing',
    ],
    reject: [
      'Sclerotinia sclerotiorum white mold or cottony rot',
      'Black rot or mushy soft decay decomposition',
      'Severe rubbery wilting or pest tunnel damage',
    ],
    shelfLife: '7 - 14 Days (Ambient)',
  },
  {
    name: 'Okra',
    emoji: '𝫄',
    category: 'Vegetable',
    gradeA: [
      'Tender, bright green pods with intact tip snap',
      'Uniform pod length (7-10 cm) without fiber toughening',
      'Zero pod borer holes or yellow vein mosaic symptoms',
      'Crisp texture free from surface blackening',
    ],
    gradeB: [
      'Slight pod tip bend or light ridge friction mark',
      'Mild pod toughening near pedicel',
      'Commercially suitable for daily mandi auction',
    ],
    gradeC: [
      'Fibrous, over-mature pod structure',
      'Surface bruising or dark tip discoloration',
      'Lower culinary value grade',
    ],
    reject: [
      'Pod borer worm infestation or entry holes',
      'Severe pod mold or wet black rot',
      'Yellow Vein Mosaic Virus (YVMV) severe decay',
    ],
    shelfLife: '2 - 4 Days (Ambient)',
  },
  {
    name: 'Beetroot',
    emoji: '🍠',
    category: 'Root Vegetable',
    gradeA: [
      'Smooth, spherical taproot with deep ruby pigmentation',
      'Firm flesh without internal zoning or woody rings',
      'Clean root crown with zero leaf spot lesions',
      'Intact taproot tail free from scab',
    ],
    gradeB: [
      'Slight root asymmetry or skin roughness',
      'Minor surface scar without rot',
      'Good commercial standard for retail',
    ],
    gradeC: [
      'Irregular root growth or mild internal woodiness',
      'Dull outer skin requiring washing',
      'Processing grade value',
    ],
    reject: [
      'Cercospora leaf spot rot extending into root',
      'Wet root rot or foul decay breakdown',
      'Spongy dry rot or insect infestation',
    ],
    shelfLife: '10 - 20 Days (Ambient)',
  },
];

export const QualityGradingGuidePage: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Banana');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeCrop = CROPS_DATA.find((c) => c.name.toLowerCase() === selectedCrop.toLowerCase()) || CROPS_DATA[0];

  const filteredCrops = CROPS_DATA.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FCFBF5] text-[#17201A] p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C5E6CC] pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#2E7D32] uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" /> Official Standard Guide
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B5E20]">
              How AgriGrade AI Grades Your Produce
            </h1>
            <p className="text-sm text-[#526158] mt-1 max-w-2xl">
              Understand our deterministic 10-step AI computer vision grading pipeline and crop-specific commercial quality standards.
            </p>
          </div>

          <Link
            to="/farmer/dashboard"
            className="px-4 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] text-xs font-bold rounded-xl hover:bg-[#2E7D32] hover:text-white transition-all flex items-center gap-1.5"
          >
            Back to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Essential Rule Alert Banner */}
        <div className="p-5 bg-emerald-50 border-2 border-[#2E7D32] rounded-3xl shadow-sm space-y-2">
          <h3 className="font-extrabold text-base text-[#1B5E20] flex items-center gap-2">
            <Info className="w-5 h-5 text-[#2E7D32]" /> Crucial Separation Rule: Official Mandi Reference vs AI Estimated Price
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-xs text-[#17201A] pt-1">
            <div className="bg-white p-3.5 border border-[#C5E6CC] rounded-2xl space-y-1">
              <span className="font-extrabold text-[#1B5E20] block uppercase text-[11px]">1. Official Mandi Reference Price</span>
              <p className="text-[#526158]">
                Real public market rates sourced directly from <strong className="text-gray-900">data.gov.in</strong> (Government of India Open Data).
                It represents regional APMC auction rates and is <strong>NEVER altered or zeroed</strong> because of individual harvest quality.
              </p>
            </div>

            <div className="bg-white p-3.5 border border-[#C5E6CC] rounded-2xl space-y-1">
              <span className="font-extrabold text-[#2E7D32] block uppercase text-[11px]">2. AI Estimated Selling Price</span>
              <p className="text-[#526158]">
                Quality-adjusted realization range calculated specifically for your analyzed harvest batch.
                For <strong className="text-red-700">REJECT</strong> produce (severe rot/fungus), the AI Selling Price is strictly <strong className="text-red-700">₹0.00 – ₹0.00 / kg</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Step AI Pipeline Section */}
      <div className="max-w-6xl mx-auto space-y-4">
        <h2 className="text-xl font-extrabold text-[#1B5E20] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#2E7D32]" /> The 10-Step AI Grading Pipeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            { step: '1', title: 'Image Capture', desc: 'Farmer uploads clear harvest evidence photos.' },
            { step: '2', title: 'Image Validation', desc: 'SHA-256 hash & minimum 50x50 resolution check.' },
            { step: '3', title: 'Crop Identification', desc: '18-class CNN identifies produce type.' },
            { step: '4', title: 'Variety Validation', desc: 'Validates expected crop vs image pixels.' },
            { step: '5', title: 'Maturity Analysis', desc: 'EfficientNet-B0 measures ripeness stage.' },
            { step: '6', title: 'Defect Detection', desc: 'YOLOv8 scans surface scarring & blemishes.' },
            { step: '7', title: 'Disease / Fungal Check', desc: 'Gemini Vision checks rot & fungal spores.' },
            { step: '8', title: 'Quality Scoring', desc: 'Deterministic 0-100 score assignment.' },
            { step: '9', title: 'Shelf-Life Estimate', desc: 'Predicts ambient & cold storage duration.' },
            { step: '10', title: 'Mandi Arbitrage', desc: 'Fetches data.gov.in rates & calculates AI price.' },
          ].map((s) => (
            <div key={s.step} className="p-4 bg-white border border-[#C5E6CC] rounded-2xl space-y-1.5 hover:shadow-md transition-all">
              <span className="w-6 h-6 bg-[#2E7D32] text-white rounded-full flex items-center justify-center font-extrabold text-xs">
                {s.step}
              </span>
              <h4 className="font-extrabold text-sm text-[#17201A]">{s.title}</h4>
              <p className="text-[11px] text-[#526158] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Crop-Specific Standards Section */}
      <div className="max-w-6xl mx-auto space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#1B5E20] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#2E7D32]" /> Crop-Specific Commercial Grading Criteria
            </h2>
            <p className="text-xs text-[#526158]">
              Select a crop to explore Grade A, Grade B, Grade C, and REJECT parameters.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search crop (e.g. Tomato)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#C5E6CC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2E7D32] w-full sm:w-64"
            />
          </div>
        </div>

        {/* Crop Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filteredCrops.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCrop(c.name)}
              className={`px-4 py-2 rounded-2xl font-bold text-xs shrink-0 flex items-center gap-2 transition-all ${
                activeCrop.name.toLowerCase() === c.name.toLowerCase()
                  ? 'bg-[#1B5E20] text-white shadow-md'
                  : 'bg-white border border-[#C5E6CC] text-[#526158] hover:bg-[#EEF8F0] hover:text-[#1B5E20]'
              }`}
            >
              <span className="text-lg">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Active Crop Detail Card */}
        <div className="bg-white border-2 border-[#2E7D32] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#C5E6CC] pb-4 gap-2">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{activeCrop.emoji}</span>
              <div>
                <h3 className="text-2xl font-black text-[#1B5E20]">{activeCrop.name} Commercial Standard</h3>
                <p className="text-xs text-[#526158]">
                  Category: <span className="font-semibold text-gray-900">{activeCrop.category}</span> • Expected Ambient Shelf Life: <span className="font-semibold text-[#2E7D32]">{activeCrop.shelfLife}</span>
                </p>
              </div>
            </div>
            <span className="px-3.5 py-1 bg-[#EEF8F0] text-[#1B5E20] border border-[#C5E6CC] text-xs font-black rounded-full self-start sm:self-auto">
              AgriGrade V4 Specification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Grade A */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-[#1B5E20] text-white font-extrabold text-[10px] rounded-full uppercase">
                  Grade A Premium
                </span>
                <span className="font-black text-emerald-800">90-100 Pts</span>
              </div>
              <ul className="space-y-2 text-[#17201A]">
                {activeCrop.gradeA.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Grade B */}
            <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-amber-700 text-white font-extrabold text-[10px] rounded-full uppercase">
                  Grade B Standard
                </span>
                <span className="font-black text-amber-800">70-89 Pts</span>
              </div>
              <ul className="space-y-2 text-[#17201A]">
                {activeCrop.gradeB.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Grade C */}
            <div className="p-4 bg-orange-50/60 border border-orange-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-orange-700 text-white font-extrabold text-[10px] rounded-full uppercase">
                  Grade C Commercial
                </span>
                <span className="font-black text-orange-800">40-69 Pts</span>
              </div>
              <ul className="space-y-2 text-[#17201A]">
                {activeCrop.gradeC.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* REJECT */}
            <div className="p-4 bg-red-50 border border-red-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-[10px] rounded-full uppercase">
                  REJECTED
                </span>
                <span className="font-black text-red-700">0 Pts</span>
              </div>
              <ul className="space-y-2 text-red-900">
                {activeCrop.reject.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityGradingGuidePage;
