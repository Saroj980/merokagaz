'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import ScrollReveal from '@/components/ScrollReveal';
import { api, SiteSettings, CmsContent } from '@/lib/api';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Stamp,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  FileText,
  Building2,
  Scale,
  X,
  ChevronDown,
  Activity,
  Layers,
  Search,
} from 'lucide-react';

interface DocumentItem {
  id: string;
  slug: string;
  titleNe: string;
  titleEn: string;
  category: 'ird' | 'ocr' | 'legal' | 'ward';
  categoryLabelNe: string;
  categoryLabelEn: string;
  descriptionNe: string;
  descriptionEn: string;
  feeNe: string;
  feeEn: string;
  estimatedTimeNe: string;
  estimatedTimeEn: string;
  badgeNe?: string;
  badgeEn?: string;
  popular?: boolean;
  requirementsNe?: string[];
  requirementsEn?: string[];
  departmentNe?: string;
  departmentEn?: string;
}

const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: '1',
    slug: 'pan-registration-individual',
    titleNe: 'व्यक्तिगत स्थायी लेखा नम्बर (Individual PAN)',
    titleEn: 'Personal PAN Registration Form',
    category: 'ird',
    categoryLabelNe: 'IRD कर',
    categoryLabelEn: 'IRD Tax',
    departmentNe: 'आन्तरिक राजस्व विभाग (IRD)',
    departmentEn: 'Inland Revenue Department',
    descriptionNe: 'तलब, पेशा वा व्यवसायका लागि आवश्यक व्यक्तिगत प्यान नम्बर प्राप्त गर्ने आधिकारिक निवेदन फारम।',
    descriptionEn: 'Official application form for obtaining individual Permanent Account Number (PAN).',
    feeNe: 'निःशुल्क',
    feeEn: 'Free',
    estimatedTimeNe: '३ मिनेट',
    estimatedTimeEn: '3 mins',
    badgeNe: 'लोकप्रिय',
    badgeEn: 'Popular',
    popular: true,
    requirementsNe: ['नागरिकता प्रमाणपत्रको विवरण', 'पासपोर्ट साइजको फोटो', 'हालको ठेगाना'],
    requirementsEn: ['Citizenship Certificate details', 'Passport-size photo', 'Current residence address'],
  },
  {
    id: '2',
    slug: 'pan-vat-business',
    titleNe: 'व्यवसायिक प्यान तथा भ्याट दर्ता (Business PAN/VAT)',
    titleEn: 'Business PAN & VAT Registration',
    category: 'ird',
    categoryLabelNe: 'IRD कर',
    categoryLabelEn: 'IRD Tax',
    departmentNe: 'आन्तरिक राजस्व विभाग (IRD)',
    departmentEn: 'Inland Revenue Department',
    descriptionNe: 'नयाँ व्यवसाय, फर्म वा कम्पनीका लागि भ्याट तथा प्यान दर्ताको विवरण तयार गर्ने फारम।',
    descriptionEn: 'Official form to register VAT and PAN for new businesses, firms, or companies.',
    feeNe: 'रू १००',
    feeEn: 'NPR 100',
    estimatedTimeNe: '५ मिनेट',
    estimatedTimeEn: '5 mins',
    badgeNe: 'अत्यावश्यक',
    badgeEn: 'Essential',
    popular: true,
    requirementsNe: ['व्यवसाय दर्ता प्रमाणपत्र', 'व्यवसायको प्यान/कर चुक्ता', 'सञ्चालकको नागरिकता'],
    requirementsEn: ['Business Registration Certificate', 'PAN/Tax clearance', 'Proprietor/Director ID'],
  },
  {
    id: 'annual-suite',
    slug: 'annual-compliance-suite',
    titleNe: 'कम्पनी वार्षिक विवरण अभिलेख पूर्ण प्याकेज (४ कागजातहरू)',
    titleEn: 'Annual Compliance Complete Package (4-in-1 Suite)',
    category: 'ocr',
    categoryLabelNe: 'OCR कम्पनी',
    categoryLabelEn: 'OCR Company',
    departmentNe: 'कम्पनी रजिष्ट्रारको कार्यालय (OCR)',
    departmentEn: 'Office of the Company Registrar',
    descriptionNe: 'विषय:- वार्षिक विवरण अभिलेख गरी पाऊँ (दर्ता निवेदन, संचालक बैठक, साधारण सभा माइन्युट र दफा ५१ विवरण)।',
    descriptionEn: 'OCR Annual Return bundle: Cover Application, Board Meeting Minutes, AGM Minutes, and Section 51 Return.',
    feeNe: 'रू ४००',
    feeEn: 'NPR 400',
    estimatedTimeNe: '१० मिनेट',
    estimatedTimeEn: '10 mins',
    badgeNe: 'प्रमुख फिचर्ड',
    badgeEn: 'Featured Suite',
    popular: true,
    requirementsNe: ['कम्पनी दर्ता नम्बर तथा ठेगाना', 'सञ्चालक बैठक तथा साधारण सभा मिति', 'लेखापरीक्षकको नाम र पुँजी विवरण'],
    requirementsEn: ['Company Registration No & address', 'Meeting dates', 'Auditor & capital details'],
  },
  {
    id: 'corp-suite',
    slug: 'company-registration-suite',
    titleNe: 'कम्पनी दर्ता पूर्ण प्याकेज (MOA, AOA & दर्ता निवेदन)',
    titleEn: 'Complete Company Registration Suite (MOA, AOA & Application)',
    category: 'ocr',
    categoryLabelNe: 'OCR कम्पनी',
    categoryLabelEn: 'OCR Company',
    departmentNe: 'कम्पनी रजिष्ट्रारको कार्यालय (OCR)',
    departmentEn: 'Office of the Company Registrar',
    descriptionNe: 'कम्पनी दर्ताका लागि चाहिने प्रबन्धपत्र, नियमावली र दर्ता निवेदन एकै पटक एकसाथ तयार गर्नुहोस्।',
    descriptionEn: 'Generate all company registration documents (Application, MOA, AOA & Minutes) simultaneously.',
    feeNe: 'रू ९५०',
    feeEn: 'NPR 950',
    estimatedTimeNe: '५ मिनेट',
    estimatedTimeEn: '5 mins',
    badgeNe: '३-इन-१ प्याकेज',
    badgeEn: '3-in-1 Suite',
    popular: true,
    requirementsNe: ['कम्पनीको नाम र उद्देश्य', 'अधिकृत र जारी पुँजी', 'संस्थापक शेयरधनी र साक्षीको विवरण'],
    requirementsEn: ['Company name & objectives', 'Capital structure', 'Shareholders & witness ID details'],
  },
  {
    id: '3',
    slug: 'pvt-ltd-company-moa',
    titleNe: 'कम्पनी प्रबन्धपत्र (Memorandum of Association - MOA)',
    titleEn: 'Memorandum of Association (MOA - Pvt Ltd)',
    category: 'ocr',
    categoryLabelNe: 'OCR कम्पनी',
    categoryLabelEn: 'OCR Company',
    departmentNe: 'कम्पनी रजिष्ट्रारको कार्यालय (OCR)',
    departmentEn: 'Office of the Company Registrar',
    descriptionNe: 'कम्पनी रजिष्ट्रारको कार्यालयमा नयाँ प्राइभेट लिमिटेड कम्पनी दर्ताका लागि आवश्यक मानक प्रबन्धपत्र।',
    descriptionEn: 'Standard Memorandum of Association for registering a new Private Limited company at OCR.',
    feeNe: 'रू ५००',
    feeEn: 'NPR 500',
    estimatedTimeNe: '४ मिनेट',
    estimatedTimeEn: '4 mins',
    badgeNe: 'मानक ढाँचा',
    badgeEn: 'Standard Template',
    popular: true,
    requirementsNe: ['कम्पनीको नाम र उद्देश्य', 'अधिकृत तथा जारी पुँजी', 'शेयरधनीहरूको विवरण'],
    requirementsEn: ['Company proposed name & objectives', 'Authorized & issued capital', 'Shareholders list'],
  },
  {
    id: '4',
    slug: 'pvt-ltd-company-aoa',
    titleNe: 'कम्पनी नियमावली (Articles of Association - AOA)',
    titleEn: 'Articles of Association (AOA - Pvt Ltd)',
    category: 'ocr',
    categoryLabelNe: 'OCR कम्पनी',
    categoryLabelEn: 'OCR Company',
    departmentNe: 'कम्पनी रजिष्ट्रारको कार्यालय (OCR)',
    departmentEn: 'Office of the Company Registrar',
    descriptionNe: 'कम्पनीको आन्तरिक कार्यसञ्चालन तथा शेयरधनी सम्बन्धी आधिकारिक नियमावली।',
    descriptionEn: 'Official internal bylaws and regulations for shareholders and corporate governance.',
    feeNe: 'रू ५००',
    feeEn: 'NPR 500',
    estimatedTimeNe: '४ मिनेट',
    estimatedTimeEn: '4 mins',
    badgeNe: 'मानक ढाँचा',
    badgeEn: 'Standard Template',
    popular: true,
    requirementsNe: ['सञ्चालक समितिको संरचना', 'साधारण सभा सम्बन्धी नियम', 'शेयर हस्तान्तरण विधि'],
    requirementsEn: ['Board composition rules', 'General meeting procedures', 'Share transfer guidelines'],
  },
  {
    id: '5',
    slug: 'house-rent-agreement',
    titleNe: 'घर/कोठा बहाल सम्झौता (House Rent Agreement)',
    titleEn: 'Residential & Commercial Rent Agreement',
    category: 'legal',
    categoryLabelNe: 'करारनामा',
    categoryLabelEn: 'Legal Contract',
    departmentNe: 'स्थानीय तह / कानुनी प्रारूप',
    departmentEn: 'Local Ward / Legal Framework',
    descriptionNe: 'घरधनी र भाडामा बस्ने बीचको कानुनी सुरक्षा प्रत्याभूत गर्ने मानक भाडा सम्झौता।',
    descriptionEn: 'Standard legally binding lease deed protecting rights of tenant and landlord in Nepal.',
    feeNe: 'रू १५०',
    feeEn: 'NPR 150',
    estimatedTimeNe: '४ मिनेट',
    estimatedTimeEn: '4 mins',
    popular: true,
    requirementsNe: ['घरधनी र भाडावालाको नागरिकता', 'मासिक भाडा रकम र म्याद', 'धरौटी (Security Deposit) विवरण'],
    requirementsEn: ['Landlord & tenant IDs', 'Monthly rent & lease duration', 'Deposit terms'],
  },
  {
    id: '6',
    slug: 'director-update-resolution',
    titleNe: 'सञ्चालक हेरफेर निर्णय (Director Change Resolution)',
    titleEn: 'Board Resolution for Director Change',
    category: 'ocr',
    categoryLabelNe: 'OCR कम्पनी',
    categoryLabelEn: 'OCR Company',
    departmentNe: 'कम्पनी रजिष्ट्रारको कार्यालय (OCR)',
    departmentEn: 'Office of the Company Registrar',
    descriptionNe: 'कम्पनी रजिष्ट्रार कार्यालयमा नयाँ सञ्चालक थप वा हटाइएको जानकारी पेश गर्ने निर्णय ढाँचा।',
    descriptionEn: 'Official board meeting resolution template to notify OCR of appointment/resignation of directors.',
    feeNe: 'रू १५०',
    feeEn: 'NPR 150',
    estimatedTimeNe: '४ मिनेट',
    estimatedTimeEn: '4 mins',
    requirementsNe: ['सञ्चालक समितिको बैठक मिति', 'नयाँ सञ्चालकको स्वीकृति पत्र', 'राजिनामा दिने सञ्चालकको पत्र'],
    requirementsEn: ['Meeting date & attendees', 'New director consent', 'Resignation letter (if applicable)'],
  },
];

const LIVE_ACTIVITIES = [
  { cityNe: 'काठमाडौं', cityEn: 'Kathmandu', docNe: 'व्यक्तिगत PAN फारम सिर्जना भयो', docEn: 'Personal PAN Application generated', timeNe: 'भर्खरै', timeEn: 'Just now' },
  { cityNe: 'पोखरा', cityEn: 'Pokhara', docNe: 'घर बहाल सम्झौता डाउनलोड भयो', docEn: 'House Rent Agreement PDF downloaded', timeNe: '२ मिनेट अगाडि', timeEn: '2m ago' },
  { cityNe: 'ललितपुर', cityEn: 'Lalitpur', docNe: 'कम्पनी प्रबन्धपत्र (MOA) तयार भयो', docEn: 'Company MOA template customized', timeNe: '५ मिनेट अगाडि', timeEn: '5m ago' },
  { cityNe: 'विराटनगर', cityEn: 'Biratnagar', docNe: 'व्यवसायिक भ्याट फारम सम्पन्न भयो', docEn: 'Business VAT Form completed', timeNe: '९ मिनेट अगाडि', timeEn: '9m ago' },
  { cityNe: 'बुटवल', cityEn: 'Butwal', docNe: 'सञ्चालक हेरफेर निर्णय प्रमाणीकरण भयो', docEn: 'Director Resolution verified', timeNe: '१२ मिनेट अगाडि', timeEn: '12m ago' },
];

const FAQS = [
  {
    qNe: 'के यी फारमहरू नेपाल सरकारका कार्यालयहरूमा मान्य हुन्छन्?',
    qEn: 'Are these generated forms accepted by Nepal Government offices?',
    aNe: 'हो, मेरो कागजका सम्पूर्ण फारम तथा ढाँचाहरू आन्तरिक राजस्व विभाग (IRD), कम्पनी रजिष्ट्रारको कार्यालय (OCR) र नेपाल सरकारको प्रचलित कानून अनुसार आधिकारिक ढाँचामा तयार पारिएका हुन्।',
    aEn: 'Yes, all templates strictly follow standard layouts mandated by the Inland Revenue Department (IRD), Office of the Company Registrar (OCR), and prevailing laws of Nepal.',
  },
  {
    qNe: 'फारम भर्न कति समय लाग्छ?',
    qEn: 'How long does it take to prepare a document?',
    aNe: 'औसतमा ३ देखि ७ मिनेट मात्र लाग्छ। आवश्यक विवरणहरू टाइप गरेपछि तुरुन्तै शुद्ध नेपाली युनिकोडमा प्रिन्ट-रेडी आधिकारिक PDF तयार हुन्छ।',
    aEn: 'On average, only 3 to 7 minutes. After entering basic details, a verified print-ready PDF with proper Nepali Unicode typography is generated immediately.',
  },
  {
    qNe: 'के मलाई कुनै एजेन्ट वा दलालको आवश्यकता पर्छ?',
    qEn: 'Do I need any middleman or external agent?',
    aNe: 'बिल्कुल पर्दैन! मेरो कागजको मुख्य उद्देश्य नै नागरिकहरूलाई कुनै मध्यस्थकर्ता बिना घरमै बसेर आफ्नै हातले आधिकारिक सरकारी कागजातहरू तयार गर्न सक्षम बनाउनु हो।',
    aEn: 'Not at all! Mero Kagaz is purpose-built to eliminate middleman dependencies, allowing citizens to generate official forms directly.',
  },
  {
    qNe: 'के मेरो व्यक्तिगत विवरण र कागजात सुरक्षित रहन्छ?',
    qEn: 'Is my personal information and document data safe?',
    aNe: 'पूर्ण रूपमा सुरक्षित छ। हामी २५६-बिट आधुनिक इन्क्रिप्सन प्रयोग गर्दछौं र तपाईंको व्यक्तिगत विवरणहरू कुनै पनि तेस्रो पक्षलाई साझा गरिँदैन।',
    aEn: 'Completely safe. We implement 256-bit encryption and strict privacy policies; your details are never shared with any third party.',
  },
];

function toEnglishNumber(val?: string | null): string {
  if (!val) return '';
  const devanagariToAscii: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  let result = val.replace(/[०-९]/g, (char) => devanagariToAscii[char] || char);
  result = result
    .replace(/मिनेट/g, 'Mins')
    .replace(/घण्टा|घन्टा/g, 'Hours')
    .replace(/दिन/g, 'Days')
    .replace(/सेकेन्ड/g, 'Secs')
    .replace(/अगाडि|अघि/g, 'ago');
  return result;
}

function toNepaliNumber(val?: string | null): string {
  if (!val) return '';
  const asciiToDevanagari: Record<string, string> = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };
  let result = val.replace(/[0-9]/g, (char) => asciiToDevanagari[char] || char);
  result = result
    .replace(/\bMins?\b/gi, 'मिनेट')
    .replace(/\bHours?\b/gi, 'घन्टा')
    .replace(/\bDays?\b/gi, 'दिन')
    .replace(/\bSecs?\b/gi, 'सेकेन्ड')
    .replace(/\bago\b/gi, 'अघि');
  return result;
}

export default function HomePage() {
  const { t, lang } = useLanguage();
  const isNe = lang === 'ne';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ird' | 'ocr' | 'legal' | 'ward'>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Dynamic Data from Backend API (with graceful fallback)
  const [dynamicDocs, setDynamicDocs] = useState<DocumentItem[]>([]);
  const [dynamicSettings, setDynamicSettings] = useState<SiteSettings | null>(null);
  const [dynamicCms, setDynamicCms] = useState<CmsContent | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic documents, settings, and CMS content from backend
  useEffect(() => {
    api.documents.list()
      .then((docs) => {
        if (Array.isArray(docs) && docs.length > 0) {
          const mapped: DocumentItem[] = docs.map((doc) => {
            const catSlug = doc.category?.slug?.toLowerCase() || '';
            const dept = (doc.department || '').toUpperCase();
            const category: 'ird' | 'ocr' | 'legal' | 'ward' =
              catSlug.includes('ward') || dept === 'WARD'
                ? 'ward'
                : catSlug.includes('ocr') || dept === 'OCR'
                ? 'ocr'
                : catSlug.includes('legal') || dept === 'LEGAL'
                ? 'legal'
                : 'ird';

            const fee = Number(doc.price) === 0 ? 'निःशुल्क' : `NPR ${Number(doc.price).toLocaleString()}`;
            const feeEn = Number(doc.price) === 0 ? 'Free' : `NPR ${Number(doc.price).toLocaleString()}`;

            return {
              id: String(doc.id),
              slug: doc.slug,
              titleNe: doc.name_np || doc.name,
              titleEn: doc.name,
              category,
              categoryLabelNe:
                category === 'ird'
                  ? 'IRD कर'
                  : category === 'ocr'
                  ? 'OCR कम्पनी'
                  : category === 'legal'
                  ? 'कानुनी लिखत'
                  : 'वडा सिफारिस',
              categoryLabelEn:
                category === 'ird'
                  ? 'IRD Tax'
                  : category === 'ocr'
                  ? 'OCR Company'
                  : category === 'legal'
                  ? 'Legal Deed'
                  : 'Ward / Local',
              departmentNe: doc.category?.name_np || doc.department || 'नेपाल सरकार',
              departmentEn: doc.category?.name || doc.department || 'Government of Nepal',
              descriptionNe: doc.description_np || doc.description || '',
              descriptionEn: doc.description || '',
              feeNe: fee,
              feeEn: feeEn,
              estimatedTimeNe: doc.processing_time || '५ मिनेट',
              estimatedTimeEn: doc.processing_time || '5 mins',
              badgeNe: Number(doc.price) === 0 ? 'निःशुल्क' : 'अत्यावश्यक',
              badgeEn: Number(doc.price) === 0 ? 'Free' : 'Essential',
              popular: Boolean(
                (doc as any).is_popular ??
                (doc.slug.includes('suite') ||
                 doc.slug.includes('pan') ||
                 doc.slug.includes('moa') ||
                 doc.slug.includes('aoa') ||
                 doc.slug.includes('rent') ||
                 Number(doc.id) <= 6)
              ),
              requirementsNe: doc.requirements || [],
              requirementsEn: doc.requirements || [],
            };
          });
          setDynamicDocs(mapped);
        }
      })
      .catch(() => {});

    api.settings.get()
      .then((settings) => {
        if (settings) {
          setDynamicSettings(settings);
        }
      })
      .catch(() => {});

    api.cms.get()
      .then((cmsData) => {
        if (cmsData) {
          setDynamicCms(cmsData);
        }
      })
      .catch(() => {});
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allDocs = dynamicDocs.length > 0 ? dynamicDocs : SAMPLE_DOCUMENTS;

  const filteredDocs = useMemo(() => {
    return allDocs.filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const title = isNe ? doc.titleNe : doc.titleEn;
      const desc = isNe ? doc.descriptionNe : doc.descriptionEn;
      const cat = isNe ? doc.categoryLabelNe : doc.categoryLabelEn;
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        cat.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [allDocs, searchQuery, selectedCategory, isNe]);

  // Suggested documents for search dropdown
  const suggestedDocs = useMemo(() => {
    if (!searchQuery.trim()) {
      return allDocs.slice(0, 4);
    }
    return filteredDocs.slice(0, 5);
  }, [allDocs, searchQuery, filteredDocs]);

  // CMS Content variables (with standard translation fallback)
  const heroTrustBadge = dynamicCms
    ? (isNe ? dynamicCms.hero.badge_ne : dynamicCms.hero.badge_en)
    : t('heroTrustBadge');
  const heroTitlePrefix = dynamicCms
    ? (isNe ? dynamicCms.hero.title_prefix_ne : dynamicCms.hero.title_prefix_en)
    : t('heroTitlePrefix');
  const heroTitleHighlight = dynamicCms
    ? (isNe ? dynamicCms.hero.title_highlight_ne : dynamicCms.hero.title_highlight_en)
    : t('heroTitleHighlight');
  const heroTitleSuffix = dynamicCms
    ? (isNe ? dynamicCms.hero.title_suffix_ne : dynamicCms.hero.title_suffix_en)
    : t('heroTitleSuffix');
  const heroSubtitle = dynamicCms
    ? (isNe ? dynamicCms.hero.subtitle_ne : dynamicCms.hero.subtitle_en)
    : t('heroSubtitle');

  const deptPreTitle = dynamicCms
    ? (isNe ? dynamicCms.departments.pre_title_ne : dynamicCms.departments.pre_title_en)
    : t('deptPreTitle');
  const deptMainTitle = dynamicCms
    ? (isNe ? dynamicCms.departments.main_title_ne : dynamicCms.departments.main_title_en)
    : t('deptMainTitle');
  const deptSubtitle = dynamicCms
    ? (isNe ? dynamicCms.departments.subtitle_ne : dynamicCms.departments.subtitle_en)
    : t('deptSubtitle');
  const deptIrdTitle = dynamicCms
    ? (isNe ? dynamicCms.departments.ird_title_ne : dynamicCms.departments.ird_title_en)
    : t('deptIrdTitle');
  const deptIrdDesc = dynamicCms
    ? (isNe ? dynamicCms.departments.ird_desc_ne : dynamicCms.departments.ird_desc_en)
    : t('deptIrdDesc');
  const deptOcrTitle = dynamicCms
    ? (isNe ? dynamicCms.departments.ocr_title_ne : dynamicCms.departments.ocr_title_en)
    : t('deptOcrTitle');
  const deptOcrDesc = dynamicCms
    ? (isNe ? dynamicCms.departments.ocr_desc_ne : dynamicCms.departments.ocr_desc_en)
    : t('deptOcrDesc');
  const deptLegalTitle = dynamicCms
    ? (isNe ? dynamicCms.departments.legal_title_ne : dynamicCms.departments.legal_title_en)
    : t('deptLegalTitle');
  const deptLegalDesc = dynamicCms
    ? (isNe ? dynamicCms.departments.legal_desc_ne : dynamicCms.departments.legal_desc_en)
    : t('deptLegalDesc');

  const workflowPreTitle = dynamicCms
    ? (isNe ? dynamicCms.how_it_works.pre_title_ne : dynamicCms.how_it_works.pre_title_en)
    : t('workflowPreTitle');
  const workflowTitle = dynamicCms
    ? (isNe ? dynamicCms.how_it_works.main_title_ne : dynamicCms.how_it_works.main_title_en)
    : t('workflowTitle');
  const workflowSubtitle = dynamicCms
    ? (isNe ? dynamicCms.how_it_works.subtitle_ne : dynamicCms.how_it_works.subtitle_en)
    : t('workflowSubtitle');
  const workflowSteps = dynamicCms?.how_it_works?.steps?.length
    ? dynamicCms.how_it_works.steps.map((st, i) => ({
        num: isNe ? (i === 0 ? '१' : i === 1 ? '२' : '३') : String(st.step || i + 1),
        title: isNe ? st.title_ne : st.title_en,
        desc: isNe ? st.desc_ne : st.desc_en,
        bg: i === 0 ? 'bg-[#123B5D] text-white' : i === 1 ? 'bg-[#18A999] text-white' : 'bg-[#F4B942] text-slate-900',
      }))
    : [
        { num: isNe ? '१' : '1', title: t('step1Title'), desc: t('step1Desc'), bg: 'bg-[#123B5D] text-white' },
        { num: isNe ? '२' : '2', title: t('step2Title'), desc: t('step2Desc'), bg: 'bg-[#18A999] text-white' },
        { num: isNe ? '३' : '3', title: t('step3Title'), desc: t('step3Desc'), bg: 'bg-[#F4B942] text-slate-900' },
      ];

  const activeFaqs = dynamicCms?.faqs && dynamicCms.faqs.length > 0 ? dynamicCms.faqs : FAQS;

  const ctaBadge = dynamicCms
    ? (isNe ? dynamicCms.cta_banner.badge_ne : dynamicCms.cta_banner.badge_en)
    : t('ctaBadge');
  const ctaTitle = dynamicCms
    ? (isNe ? dynamicCms.cta_banner.title_ne : dynamicCms.cta_banner.title_en)
    : t('ctaTitle');
  const ctaSubtitle = dynamicCms
    ? (isNe ? dynamicCms.cta_banner.subtitle_ne : dynamicCms.cta_banner.subtitle_en)
    : t('ctaSubtitle');
  const ctaBtn1Text = dynamicCms
    ? (isNe ? dynamicCms.cta_banner.btn1_text_ne : dynamicCms.cta_banner.btn1_text_en)
    : t('ctaExploreBtn');
  const ctaBtn1Link = dynamicCms?.cta_banner?.btn1_link || '/documents';
  const ctaBtn2Text = dynamicCms
    ? (isNe ? dynamicCms.cta_banner.btn2_text_ne : dynamicCms.cta_banner.btn2_text_en)
    : t('ctaPanBtn');
  const ctaBtn2Link = dynamicCms?.cta_banner?.btn2_link || '/documents/pan-registration-individual/form';

  // Living Stats Values & Labels (strictly localized to Nepali or English)
  const stat1Value = isNe
    ? (dynamicSettings?.stats?.stat1_value_ne || dynamicSettings?.stats?.stat1_value || t('stat1Value'))
    : (dynamicSettings?.stats?.stat1_value_en || toEnglishNumber(dynamicSettings?.stats?.stat1_value || t('stat1Value')));
  const stat1Label = isNe
    ? (dynamicSettings?.stats?.stat1_label_ne || t('stat1Label'))
    : (dynamicSettings?.stats?.stat1_label_en || t('stat1Label'));

  const stat2Value = isNe
    ? (dynamicSettings?.stats?.stat2_value_ne || dynamicSettings?.stats?.stat2_value || t('stat2Value'))
    : (dynamicSettings?.stats?.stat2_value_en || toEnglishNumber(dynamicSettings?.stats?.stat2_value || t('stat2Value')));
  const stat2Label = isNe
    ? (dynamicSettings?.stats?.stat2_label_ne || t('stat2Label'))
    : (dynamicSettings?.stats?.stat2_label_en || t('stat2Label'));

  const stat3Value = isNe
    ? (dynamicSettings?.stats?.stat3_value_ne || dynamicSettings?.stats?.stat3_value || t('stat3Value'))
    : (dynamicSettings?.stats?.stat3_value_en || toEnglishNumber(dynamicSettings?.stats?.stat3_value || t('stat3Value')));
  const stat3Label = isNe
    ? (dynamicSettings?.stats?.stat3_label_ne || t('stat3Label'))
    : (dynamicSettings?.stats?.stat3_label_en || t('stat3Label'));

  const stat4Value = isNe
    ? (dynamicSettings?.stats?.stat4_value_ne || dynamicSettings?.stats?.stat4_value || t('stat4Value'))
    : (dynamicSettings?.stats?.stat4_value_en || toEnglishNumber(dynamicSettings?.stats?.stat4_value || t('stat4Value')));
  const stat4Label = isNe
    ? (dynamicSettings?.stats?.stat4_label_ne || t('stat4Label'))
    : (dynamicSettings?.stats?.stat4_label_en || t('stat4Label'));

  return (
    <div className="space-y-16 pb-20 overflow-hidden">
      {/* ─── 1. Refined GovTech SaaS Hero Section ─── */}
      <section className="relative overflow-hidden bg-[#071927] px-4 pt-16 pb-24 text-white sm:px-6 lg:px-8">
        {/* Deep Architectural Mesh & Gradient Lighting */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-15%,#164E7A_0%,#0C2740_45%,#071927_100%)]"></div>

        {/* Ambient Glowing Aurora Blooms */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] sm:w-[980px] h-[360px] rounded-full bg-gradient-to-b from-teal-400/25 via-[#18A999]/15 to-transparent blur-3xl"></div>
        <div className="pointer-events-none absolute -top-10 -left-20 w-[420px] h-[420px] rounded-full bg-sky-500/15 blur-3xl animate-pulse-soft"></div>
        <div className="pointer-events-none absolute top-10 -right-20 w-[420px] h-[420px] rounded-full bg-amber-400/15 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-slate-950/60 to-transparent"></div>

        {/* Modern Engineering Blueprint Grid with Radial Falloff */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 35%, black 25%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 35%, black 25%, transparent 85%)',
          }}
        />

        {/* Subtle Concentric Alignment Rings */}
        <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full border border-teal-300/[0.07] animate-pulse-soft"></div>
        <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 w-[1080px] h-[1080px] rounded-full border border-white/[0.03]"></div>

        {/* Floating Glassmorphic Verification Badges (Desktop Flanks) */}
        {/* Left Flank Card */}
        <div className="animate-float-slow pointer-events-none hidden xl:flex absolute left-6 2xl:left-14 top-28 z-10 flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-3.5 shadow-2xl backdrop-blur-xl w-60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">
                {isNe ? 'सरकारी ढाँचा प्रमाणित' : 'Government Verified'}
              </div>
              <div className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{isNe ? 'आधिकारिक ढाँचा (Standard)' : 'IRD & OCR Standard'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300 border-t border-white/10 pt-2 font-mono">
            <span>नेपाल सरकार ऐन, २०६३</span>
            <span className="text-teal-300 font-bold">● Valid</span>
          </div>
        </div>

        {/* Right Flank Card */}
        <div className="animate-float-delayed pointer-events-none hidden xl:flex absolute right-6 2xl:right-14 top-36 z-10 flex-col gap-2 rounded-2xl border border-white/15 bg-white/[0.08] p-3.5 shadow-2xl backdrop-blur-xl w-60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">
                {isNe ? 'तुरुन्त प्रिन्ट-तयार PDF' : 'Instant Print-Ready PDF'}
              </div>
              <div className="text-[10px] text-teal-300 font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-amber-300" />
                <span>{isNe ? 'औसत ३ देखि ५ मिनेट' : 'Ready in 3-5 Mins'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-300 border-t border-white/10 pt-2 font-mono">
            <span>Kalimati Unicode</span>
            <span className="text-amber-300 font-bold">A4 Print</span>
          </div>
        </div>

        <div className="relative mx-auto max-w-4xl text-center z-10">
          {/* Trust Badge Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-4 py-1.5 text-xs font-semibold text-[#E6F6F3] backdrop-blur-md shadow-inner transition hover:bg-teal-500/25">
            <span className="text-base">🇳🇵</span>
            <span>{heroTrustBadge}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#18A999] animate-pulse"></span>
          </div>

          {/* Main Title with Clean Hierarchy */}
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
            {heroTitlePrefix}{' '}
            <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
              {heroTitleHighlight}
            </span>{' '}
            {heroTitleSuffix}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
            {heroSubtitle}
          </p>

          {/* Clean Search Input with Ambient Glow */}
          <div ref={searchContainerRef} className="relative mx-auto mt-8 max-w-2xl text-left group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/30 via-amber-400/20 to-teal-500/30 opacity-70 blur-xl pointer-events-none transition duration-500 group-hover:opacity-100"></div>
            <div className="relative flex items-center rounded-2xl border border-white/25 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md transition-all focus-within:border-[#18A999] focus-within:ring-4 focus-within:ring-[#18A999]/30">
              <span className="pl-4 text-slate-400">
                <Search className="h-5 w-5 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full bg-transparent px-3 py-3 text-sm font-outfit text-[#17212B] placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mr-2 rounded-lg p-1 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Link
                href={`/documents${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`}
                className="btn-shimmer shrink-0 rounded-xl bg-[#18A999] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#148C7E] active:scale-95"
              >
                {t('searchButton')}
              </Link>
            </div>

            {/* Quick search tags */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400 font-medium">{t('searchPopularLabel')}</span>
              {(isNe
                ? dynamicSettings?.popular_tags_ne || ['व्यक्तिगत PAN', 'कम्पनी MOA', 'VAT फारम', 'घर बहाल सम्झौता']
                : dynamicSettings?.popular_tags_en || ['Personal PAN', 'Company MOA', 'VAT Form', 'Rent Agreement']
              ).map(tag => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-slate-200 transition-all hover:bg-[#18A999] hover:text-white hover:border-[#18A999] active:scale-95"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Living Key Metrics Counters (Now Truly Bilingual & Visually Enhanced) */}
          <div className="mt-12 grid grid-cols-2 gap-3.5 sm:gap-4.5 border-t border-white/10 pt-8 sm:grid-cols-4">
            {/* Stat 1 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] hover:border-amber-400/40 p-4.5 backdrop-blur-xl transition-all duration-300 shadow-xl group hover:-translate-y-1">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-200 opacity-80" />
              <p className="text-2xl font-extrabold text-[#F4B942] sm:text-3xl font-outfit tracking-tight">
                {stat1Value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-200">
                {stat1Label}
              </p>
            </div>

            {/* Stat 2 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] hover:border-teal-400/40 p-4.5 backdrop-blur-xl transition-all duration-300 shadow-xl group hover:-translate-y-1">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#18A999] to-teal-200 opacity-80" />
              <p className="text-2xl font-extrabold text-[#2dd4bf] sm:text-3xl font-outfit tracking-tight">
                {stat2Value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-200">
                {stat2Label}
              </p>
            </div>

            {/* Stat 3 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] hover:border-sky-400/40 p-4.5 backdrop-blur-xl transition-all duration-300 shadow-xl group hover:-translate-y-1">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 to-cyan-200 opacity-80" />
              <p className="text-2xl font-extrabold text-white sm:text-3xl font-outfit tracking-tight">
                {stat3Value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-200">
                {stat3Label}
              </p>
            </div>

            {/* Stat 4 */}
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] hover:bg-white/[0.12] hover:border-amber-300/40 p-4.5 backdrop-blur-xl transition-all duration-300 shadow-xl group hover:-translate-y-1">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-rose-300 opacity-80" />
              <p className="text-2xl font-extrabold text-[#F4B942] sm:text-3xl font-outfit tracking-tight">
                {stat4Value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-slate-200">
                {stat4Label}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Real-Time Activity Ticker ─── */}
      <div className="-mt-8 mx-auto max-w-6xl px-4 z-20 relative">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="shrink-0 flex items-center gap-2 rounded-xl bg-[#123B5D] px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <Activity className="h-3.5 w-3.5 text-[#18A999] animate-pulse" />
              <span>{isNe ? 'प्रत्यक्ष गतिविधि' : 'Live Activity'}</span>
            </div>
            <div className="overflow-hidden whitespace-nowrap mask-gradient flex-1">
              <div className="animate-marquee gap-8 py-0.5 text-xs text-slate-600">
                {(dynamicSettings?.live_activities || LIVE_ACTIVITIES)
                  .concat(dynamicSettings?.live_activities || LIVE_ACTIVITIES)
                  .map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-[#123B5D]">{isNe ? item.cityNe : item.cityEn}:</span>
                    <span>{isNe ? item.docNe : item.docEn}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-outfit">
                      {isNe ? item.timeNe : item.timeEn}
                    </span>
                    <span className="text-slate-300 ml-3">•</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2.5. Curated Popular & Essential Documents Showcase (Above Department Cards) ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#18A999]">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{isNe ? 'अत्यावश्यक तथा लोकप्रिय कागजातहरू' : 'Popular & Essential Documents'}</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-[#123B5D] sm:text-3xl">
              {isNe ? 'सबैभन्दा धेरै प्रयोग गरिएका आधिकारिक ढाँचाहरू' : 'Most Popular Statutory Templates'}
            </h2>
          </div>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#18A999] hover:text-[#148C7E] transition group"
          >
            <span>{isNe ? 'सबै कागजातहरू हेर्नुहोस्' : 'Browse All Documents'}</span>
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {allDocs.filter(d => d.popular).slice(0, 4).map((doc) => {
            const title = isNe ? doc.titleNe : doc.titleEn;
            const desc = isNe ? doc.descriptionNe : doc.descriptionEn;
            const fee = isNe ? doc.feeNe : doc.feeEn;
            const badge = isNe ? doc.badgeNe : doc.badgeEn;
            return (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:border-teal-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-[#148C7E]">
                      {badge || (isNe ? 'लोकप्रिय' : 'Popular')}
                    </span>
                    <span className="text-xs font-bold text-[#123B5D] font-outfit">
                      {fee}
                    </span>
                  </div>

                  <Link href={`/documents/${doc.slug}/form`} className="block">
                    <h3 className="text-sm font-bold text-[#123B5D] group-hover:text-[#18A999] transition leading-snug line-clamp-2">
                      {title}
                    </h3>
                  </Link>

                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    ⏱️ {isNe ? doc.estimatedTimeNe : doc.estimatedTimeEn}
                  </span>
                  <Link
                    href={`/documents/${doc.slug}/form`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#18A999] hover:text-[#148C7E] transition"
                  >
                    <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. Government Department Cards with Interactive Hover Reaction ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="animate-slide-up" className="mb-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#18A999]">{deptPreTitle}</span>
          <h2 className="mt-1 text-2xl font-bold text-[#123B5D] sm:text-3xl">{deptMainTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">{deptSubtitle}</p>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: IRD */}
          <ScrollReveal delay="delay-100" className="h-full">
            <div
              onClick={() => setSelectedCategory('ird')}
              role="button"
              className={`group card-elevate rounded-3xl border p-7 cursor-pointer bg-white transition-all duration-300 h-full flex flex-col justify-between ${
                selectedCategory === 'ird'
                  ? 'border-[#18A999] ring-2 ring-[#18A999] shadow-xl'
                  : 'border-slate-200/90 hover:border-[#18A999]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123B5D]/10 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-[#123B5D] group-hover:text-white shadow-2xs">
                    🏛️
                  </div>
                  <span className="rounded-full border border-teal-200/70 bg-teal-50/80 px-3 py-1 text-xs font-bold text-[#18A999] font-outfit transition-all duration-300 group-hover:bg-[#18A999] group-hover:text-white group-hover:scale-105 shadow-2xs">
                    {allDocs.filter(d => d.category === 'ird').length} Forms
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#123B5D] group-hover:text-[#18A999] transition-colors duration-200">
                  {deptIrdTitle}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {deptIrdDesc}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#18A999] border-t border-slate-50 pt-3">
                <span className="transition-all group-hover:translate-x-1">{t('deptCardCta')}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-2 text-sm">&rarr;</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: OCR */}
          <ScrollReveal delay="delay-200" className="h-full">
            <div
              onClick={() => setSelectedCategory('ocr')}
              role="button"
              className={`group card-elevate rounded-3xl border p-7 cursor-pointer bg-white transition-all duration-300 h-full flex flex-col justify-between ${
                selectedCategory === 'ocr'
                  ? 'border-[#18A999] ring-2 ring-[#18A999] shadow-xl'
                  : 'border-slate-200/90 hover:border-[#18A999]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#18A999]/10 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-[#18A999] group-hover:text-white shadow-2xs">
                    🏢
                  </div>
                  <span className="rounded-full border border-teal-200/70 bg-teal-50/80 px-3 py-1 text-xs font-bold text-[#18A999] font-outfit transition-all duration-300 group-hover:bg-[#18A999] group-hover:text-white group-hover:scale-105 shadow-2xs">
                    {allDocs.filter(d => d.category === 'ocr').length} Forms
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#123B5D] group-hover:text-[#18A999] transition-colors duration-200">
                  {deptOcrTitle}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {deptOcrDesc}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#18A999] border-t border-slate-50 pt-3">
                <span className="transition-all group-hover:translate-x-1">{t('deptCardCta')}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-2 text-sm">&rarr;</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3: Legal & Contracts */}
          <ScrollReveal delay="delay-300" className="h-full">
            <div
              onClick={() => setSelectedCategory('legal')}
              role="button"
              className={`group card-elevate rounded-3xl border p-7 cursor-pointer bg-white transition-all duration-300 h-full flex flex-col justify-between ${
                selectedCategory === 'legal'
                  ? 'border-[#18A999] ring-2 ring-[#18A999] shadow-xl'
                  : 'border-slate-200/90 hover:border-[#18A999]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4B942]/15 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-[#F4B942] group-hover:text-slate-900 shadow-2xs">
                    ⚖️
                  </div>
                  <span className="rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-xs font-bold text-[#DFA32B] font-outfit transition-all duration-300 group-hover:bg-[#DFA32B] group-hover:text-white group-hover:scale-105 shadow-2xs">
                    {allDocs.filter(d => d.category === 'legal').length} Forms
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#123B5D] group-hover:text-[#18A999] transition-colors duration-200">
                  {deptLegalTitle}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {deptLegalDesc}
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-[#18A999] border-t border-slate-50 pt-3">
                <span className="transition-all group-hover:translate-x-1">{t('deptCardCta')}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-2 text-sm">&rarr;</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── 4. Reactive Filterable Document Directory ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="animate-fade-in" className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-[#123B5D] flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#18A999]" />
              <span>{isNe ? 'उपलब्ध कागजात तथा फारमहरू' : 'Available Documents & Forms'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isNe
                ? `कुल ${filteredDocs.length} आधिकारिक फारमहरू उपलब्ध`
                : `Showing ${filteredDocs.length} official templates`}
            </p>
          </div>

          {/* Interactive Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: t('filterAll'), count: allDocs.length },
              { id: 'ird', label: t('filterIrd'), count: allDocs.filter(d => d.category === 'ird').length },
              { id: 'ocr', label: t('filterOcr'), count: allDocs.filter(d => d.category === 'ocr').length },
              { id: 'legal', label: t('filterLegal'), count: allDocs.filter(d => d.category === 'legal').length },
              ...(allDocs.some(d => d.category === 'ward')
                ? [{ id: 'ward', label: isNe ? 'वडा सिफारिस' : 'Ward & Local', count: allDocs.filter(d => d.category === 'ward').length }]
                : []),
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`group widget-click inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
                  selectedCategory === tab.id
                    ? 'bg-[#123B5D] text-white shadow-lg shadow-[#123B5D]/25 ring-2 ring-[#123B5D]/20 scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#18A999]/40 hover:bg-slate-50 hover:scale-[1.02]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-outfit font-bold transition-transform duration-300 group-hover:scale-110 ${
                    selectedCategory === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Documents Grid with Tactile Cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc, idx) => {
            const title = isNe ? doc.titleNe : doc.titleEn;
            const categoryLabel = isNe ? doc.categoryLabelNe : doc.categoryLabelEn;
            const desc = isNe ? doc.descriptionNe : doc.descriptionEn;
            const fee = isNe ? doc.feeNe : doc.feeEn;
            const time = isNe ? doc.estimatedTimeNe : doc.estimatedTimeEn;
            const badge = isNe ? doc.badgeNe : doc.badgeEn;
            const staggerDelay = idx % 3 === 0 ? 'delay-100' : idx % 3 === 1 ? 'delay-200' : 'delay-300';

            return (
              <ScrollReveal key={doc.id} delay={staggerDelay as any} animation="animate-slide-up" className="h-full">
                <div
                  className="group card-elevate flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs hover:border-[#18A999]/50 h-full"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full badge-shimmer-teal border border-teal-200/70 px-3 py-1 text-xs font-bold text-[#18A999] font-outfit transition-transform duration-300 group-hover:scale-105 shadow-2xs">
                        {categoryLabel}
                      </span>
                      {badge && (
                        <span className="rounded-full animate-badge-pulse badge-shimmer-gold border border-amber-300/80 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 flex items-center gap-1.5 shadow-2xs">
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          <span>{badge}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-base font-bold text-[#123B5D] leading-snug group-hover:text-[#18A999] transition-colors duration-200">
                      {title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3.5">
                      <span className="flex items-center gap-1.5 font-medium group-hover:text-slate-700 transition-colors">
                        <Clock className="h-3.5 w-3.5 text-slate-400 transition-transform duration-500 group-hover:rotate-45" />
                        <span>{time}</span>
                      </span>
                      <span className="text-base font-extrabold text-[#123B5D] font-outfit group-hover:text-[#18A999] transition-colors">
                        {fee}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="group/btn widget-click inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-white hover:border-[#18A999] hover:text-[#18A999] hover:shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-400 transition-transform duration-300 group-hover/btn:scale-125 group-hover/btn:text-[#18A999]" />
                        <span>{isNe ? 'पूर्वावलोकन' : 'Quick View'}</span>
                      </button>
                      <Link
                        href={`/documents/${doc.slug}/form`}
                        className="group/fill btn-shimmer widget-click inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] py-2.5 text-xs font-bold text-white shadow-md shadow-teal-500/20 transition-all hover:shadow-lg hover:shadow-teal-500/30"
                      >
                        <span>{t('cardFormBtn')}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/fill:translate-x-1.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {filteredDocs.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
            <span className="text-4xl">📄</span>
            <p className="mt-3 text-base font-semibold text-[#123B5D]">
              {isNe ? 'कुनै कागजात फेला परेन' : 'No documents found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isNe
                ? 'खोजी शब्द फेरेर पुनः प्रयास गर्नुहोस् वा सबै कागजात सूची हेर्नुहोस्।'
                : 'Try adjusting your search terms or filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-xl bg-[#123B5D] px-4 py-2 text-xs font-semibold text-white"
            >
              {isNe ? 'फिल्टर हटाउनुहोस्' : 'Reset Filters'}
            </button>
          </div>
        )}
      </section>

      {/* ─── 5. "How It Works" with Animated Connection Line & Stepper ─── */}
      <section className="bg-white py-16 border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="animate-slide-up" className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#18A999]">{workflowPreTitle}</span>
            <h2 className="mt-1 text-2xl font-bold text-[#123B5D] sm:text-3xl">{workflowTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">{workflowSubtitle}</p>
          </ScrollReveal>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {workflowSteps.map((step, idx) => {
              const delay = idx === 0 ? 'delay-100' : idx === 1 ? 'delay-200' : 'delay-300';
              return (
                <ScrollReveal key={idx} animation="animate-slide-up" delayClass={delay as any}>
                  <div className="card-elevate relative rounded-3xl bg-[#E6F6F3]/50 p-8 text-center border border-teal-100/90 shadow-xs hover:border-[#18A999] h-full flex flex-col items-center">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} text-xl font-bold shadow-md transition group-hover:scale-110`}>
                      {step.num}
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#123B5D]">{step.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      {step.desc}
                    </p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── 6. Interactive FAQ Section (Accordion) ─── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <ScrollReveal animation="animate-fade-in" className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#18A999]">
            {isNe ? 'प्रायः सोधिने प्रश्नहरू' : 'Frequently Asked Questions'}
          </span>
          <h2 className="mt-1 text-2xl font-bold text-[#123B5D] sm:text-3xl">
            {isNe ? 'तपाईंका जिज्ञासा र स्पष्टीकरण' : 'Got Questions? We have answers.'}
          </h2>
        </ScrollReveal>

        <div className="space-y-3">
          {activeFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            const delay = ((idx % 4) + 1) * 100;
            return (
              <ScrollReveal
                key={idx}
                animation="animate-slide-up"
                delayClass={`delay-${delay}` as any}
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all shadow-xs hover:border-[#18A999]/50">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-[#123B5D] hover:text-[#18A999] transition"
                  >
                    <span>{isNe ? faq.qNe : faq.qEn}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#18A999]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs leading-relaxed text-slate-600 border-t border-slate-50 animate-in fade-in duration-200 whitespace-pre-line">
                      {isNe ? faq.aNe : faq.aEn}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ─── 7. Interactive Bottom CTA Banner ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="animate-slide-up" delayClass="delay-200">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#123B5D] via-[#0E2E4A] to-[#123B5D] p-8 sm:p-12 text-white shadow-2xl">
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-80 w-80 rounded-full bg-[#18A999]/30 blur-3xl animate-float-slow"></div>
            <div className="pointer-events-none absolute -top-10 left-10 h-72 w-72 rounded-full bg-[#F4B942]/20 blur-3xl animate-float-delayed"></div>

            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#18A999] px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{ctaBadge}</span>
              </span>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-4xl leading-tight">
                {ctaTitle}
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                {ctaSubtitle}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={ctaBtn1Link}
                  className="btn-shimmer widget-click rounded-xl bg-[#18A999] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#148C7E] flex items-center gap-2"
                >
                  <span>{ctaBtn1Text}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={ctaBtn2Link}
                  className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  {ctaBtn2Text}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── 8. Quick Preview Modal (Tactile Delight) ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#E6F6F3] px-3 py-0.5 text-xs font-semibold text-[#18A999]">
                {isNe ? previewDoc.categoryLabelNe : previewDoc.categoryLabelEn}
              </span>
              <span className="text-xs text-slate-400 font-outfit">
                ⏱️ {isNe ? previewDoc.estimatedTimeNe : previewDoc.estimatedTimeEn}
              </span>
            </div>

            <h3 className="mt-3 text-lg font-bold text-[#123B5D]">
              {isNe ? previewDoc.titleNe : previewDoc.titleEn}
            </h3>

            <p className="mt-1 text-xs text-slate-500 font-medium">
              🏛️ {isNe ? previewDoc.departmentNe : previewDoc.departmentEn}
            </p>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {isNe ? previewDoc.descriptionNe : previewDoc.descriptionEn}
            </p>

            {/* Checklist of requirements */}
            <div className="mt-4 rounded-2xl bg-[#F7F9FC] p-4 border border-slate-100">
              <p className="text-xs font-bold text-[#123B5D] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#18A999]" />
                <span>{isNe ? 'आवश्यक विवरणहरू' : 'Key Requirements:'}</span>
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(isNe ? previewDoc.requirementsNe : previewDoc.requirementsEn)?.map((req, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#18A999]"></span>
                    <span>{req}</span>
                  </li>
                )) || (
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#18A999]"></span>
                    <span>{isNe ? 'नागरिकता तथा सम्पर्क विवरण' : 'Citizenship and contact info'}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Pricing & Actions */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{isNe ? 'लागत' : 'Cost'}</p>
                <p className="text-base font-bold text-[#123B5D] font-outfit">
                  {isNe ? previewDoc.feeNe : previewDoc.feeEn}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isNe ? 'बन्द गर्नुहोस्' : 'Close'}
                </button>
                <Link
                  href={`/documents/${previewDoc.slug}/form`}
                  onClick={() => setPreviewDoc(null)}
                  className="btn-shimmer inline-flex items-center gap-1.5 rounded-xl bg-[#18A999] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#148C7E]"
                >
                  <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
