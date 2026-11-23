'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import ScrollReveal from '@/components/ScrollReveal';
import { api, SiteSettings, CmsContent } from '@/lib/api';
import {
  ShieldCheck,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  Building2,
  Scale,
  X,
  ChevronDown,
  Layers,
  Search,
  Check,
  FileCheck,
  Landmark,
  FileText,
  Printer,
  QrCode,
  CreditCard,
  Smartphone,
  Lock,
  Download,
  BadgeCheck,
  FileEdit,
  UserCheck,
  HelpCircle,
  FileSpreadsheet,
  Award,
  Users,
  AlertCircle,
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
    badgeNe: '४-इन-१ प्याकेज',
    badgeEn: '4-in-1 Suite',
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

const FAQS = [
  {
    id: 'legal-validity',
    iconType: 'legal',
    qNe: 'के यी फारमहरू नेपाल सरकारका कार्यालयहरूमा मान्य हुन्छन्?',
    qEn: 'Are these generated forms accepted by Nepal Government offices?',
    aNe: 'हो, शतप्रतिशत मान्य हुन्छन्। मेरो कागजका सम्पूर्ण फारम तथा ढाँचाहरू आन्तरिक राजस्व विभाग (IRD), कम्पनी रजिष्ट्रारको कार्यालय (OCR), मुलुकी देवानी संहिता, र स्थानीय वडा कार्यालयका प्रचलित ऐन र मानक अनुसूची अनुसार तयार गरिएका हुन्।',
    aEn: 'Yes, 100% legally valid. All templates strictly adhere to statutory layouts and schedules mandated by the Inland Revenue Department (IRD), Office of the Company Registrar (OCR), and prevailing laws of Nepal.',
  },
  {
    id: 'time-download',
    iconType: 'time',
    qNe: 'फारम भर्न कति समय लाग्छ र कसरी प्राप्त हुन्छ?',
    qEn: 'How long does it take to prepare and download a document?',
    aNe: 'औसतमा ३ देखि ५ मिनेट मात्र लाग्छ। आवश्यक विवरणहरू टाइप गरेपछि तुरुन्तै शुद्ध कालिमाटी युनिकोडमा प्रिन्ट-रेडी आधिकारिक A4 PDF सिधै कम्प्युटर वा मोबाइलमा डाउनलोड हुन्छ।',
    aEn: 'On average, only 3 to 5 minutes. After entering basic details, a verified print-ready A4 PDF with standard Nepali Kalimati Unicode typography is generated immediately for download.',
  },
  {
    id: 'payment-methods',
    iconType: 'payment',
    qNe: 'भुक्तानी कुन-कुन माध्यमबाट गर्न सकिन्छ?',
    qEn: 'Which payment methods are supported?',
    aNe: 'तपाईंले नेपालका प्रमुख डिजिटल भुक्तानी माध्यमहरू जस्तै eSewa, Khalti, र connectIPS मार्फत सुरक्षित रूपमा तत्काल भुक्तानी गर्न सक्नुहुन्छ। धेरैजसो आधारभूत फारमहरू निःशुल्क उपलब्ध छन्।',
    aEn: 'We support all major digital payment options including eSewa, Khalti, and connectIPS. Many basic administrative forms are completely free of charge.',
  },
  {
    id: 'no-middlemen',
    iconType: 'middlemen',
    qNe: 'के मलाई कुनै एजेन्ट, दलाल वा लेखापढीको आवश्यकता पर्छ?',
    qEn: 'Do I need any middleman or external agent?',
    aNe: 'बिल्कुल पर्दैन! मेरो कागजको मुख्य उद्देश्य नै नागरिकहरूलाई कुनै मध्यस्थकर्ता बिना घरमै बसेर आफ्नै हातले आधिकारिक सरकारी कागजातहरू तयार गर्न सक्षम बनाउनु हो, जसले तपाईंको हजारौं रुपैयाँ दलाल शुल्क बचत गर्छ।',
    aEn: 'Not at all! Mero Kagaz is purpose-built to eliminate middleman dependencies, allowing individuals and businesses to generate official paperwork directly from home.',
  },
  {
    id: 'data-privacy',
    iconType: 'privacy',
    qNe: 'के मेरो व्यक्तिगत विवरण र कागजात सुरक्षित रहन्छ?',
    qEn: 'Is my personal information and document data safe?',
    aNe: 'पूर्ण रूपमा सुरक्षित छ। हामी बैंक-स्तरको २५६-बिट आधुनिक इन्क्रिप्सन प्रयोग गर्दछौं। तपाईंको व्यक्तिगत विवरणहरू कुनै पनि तेस्रो पक्षलाई साझा गरिँदैन र कागजात उत्पादन प्रयोजनका लागि मात्र प्रयोग हुन्छ।',
    aEn: 'Completely safe. We implement bank-grade 256-bit encryption and strict privacy protocols. Your details are never shared with any third party.',
  },
  {
    id: 'edit-mistake',
    iconType: 'edit',
    qNe: 'फारम भर्दा कुनै विवरण गल्ती भएमा पछि सच्याउन मिल्छ?',
    qEn: 'Can I edit my document details if I make a mistake?',
    aNe: 'मिल्छ! फारम भर्दा लाइभ पूर्वावलोकन (Preview) मा विवरण हेर्न सकिन्छ। साथै, डाउनलोड गरिसकेपछि पनि आफ्नो प्रयोगकर्ता ड्यासबोर्ड वा अर्डर पृष्ठबाट विवरण सच्याएर पुनः निःशुल्क डाउनलोड गर्न सकिन्छ।',
    aEn: 'Yes! You can review details in the live preview before generating. Furthermore, you can edit and re-download your document from your user dashboard at any time.',
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

export default function HomePage() {
  const { t, lang } = useLanguage();
  const isNe = lang === 'ne';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ocr' | 'ird' | 'legal' | 'ward'>('all');
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

            const fee = Number(doc.price) === 0 ? 'निःशुल्क' : `रू ${Number(doc.price).toLocaleString()}`;
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
              badgeNe: Number(doc.price) === 0 ? 'निःशुल्क' : (doc.slug.includes('suite') ? 'प्याकेज' : 'आधिकारिक'),
              badgeEn: Number(doc.price) === 0 ? 'Free' : (doc.slug.includes('suite') ? 'Suite' : 'Official'),
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

    api.settings.get().then(s => s && setDynamicSettings(s)).catch(() => {});
    api.cms.get().then(c => c && setDynamicCms(c)).catch(() => {});
  }, []);

  const allDocs = dynamicDocs.length > 0 ? dynamicDocs : SAMPLE_DOCUMENTS;

  const filteredDocs = useMemo(() => {
    return allDocs.filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const title = isNe ? doc.titleNe : doc.titleEn;
      const desc = isNe ? doc.descriptionNe : doc.descriptionEn;
      const cat = isNe ? doc.categoryLabelNe : doc.categoryLabelEn;
      const dept = isNe ? (doc.departmentNe || '') : (doc.departmentEn || '');
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        desc.toLowerCase().includes(query) ||
        cat.toLowerCase().includes(query) ||
        dept.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [allDocs, searchQuery, selectedCategory, isNe]);

  // Content variables (Authentic Nepali GovTech tone)
  const heroTrustBadge = isNe
    ? 'नेपाल सरकारका निकायहरूद्वारा स्वीकृत मानक ढाँचा • १००% कानुनी मान्यता'
    : 'Nepal Government & Statutory Compliant • 100% Legally Valid';
  const heroTitle = isNe
    ? 'सरकारी तथा कानुनी कागजातहरू'
    : 'Official Nepal Government & Legal Documents';
  const heroHighlight = isNe
    ? 'अब आफ्नै हातले सजिलै बनाउनुहोस्'
    : 'Prepared Easily Without Any Middlemen';
  const heroSubtitle = isNe
    ? 'आन्तरिक राजस्व (प्यान/भ्याट दर्ता), कम्पनी रजिष्ट्रार (प्रबन्धपत्र/नियमावली), वडा कार्यालयका सिफारिस तथा घर बहाल सम्झौता जस्ता सरकारी कागजातहरू दलाल वा लेखापढीको महँगो शुल्क बिना शुद्ध कालिमाटी युनिकोडमा ३ देखि ५ मिनेटमै तयार गरी प्रिन्ट-रेडी PDF डाउनलोड गर्नुहोस्।'
    : 'Generate verified IRD Tax forms (PAN/VAT), OCR Company Registration (MOA/AOA), Ward applications, and Rent Agreements directly in standard Nepali Kalimati Unicode—ready to print and submit.';

  const stat1Value = isNe ? '१५+' : '15+';
  const stat1Label = isNe ? 'सरकारी ढाँचाहरू' : 'Official Templates';
  const stat2Value = isNe ? '३-५ मिनेट' : '3-5 Mins';
  const stat2Label = isNe ? 'औसत फारम भर्ने समय' : 'Avg. Completion Time';
  const stat3Value = isNe ? '१००%' : '100%';
  const stat3Label = isNe ? 'कालिमाटी युनिकोड A4' : 'Print-Ready Kalimati A4';
  const stat4Value = isNe ? '०' : '0';
  const stat4Label = isNe ? 'दलाल वा मध्यस्थकर्ता' : 'Zero Middleman Fees';

  return (
    <div className="space-y-16 pb-24 overflow-x-hidden max-w-full">
      {/* ─── 1. Enhanced, Luminous & Appealing Hero Banner ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/40 via-white to-[#F8FAFC] px-4 pt-16 pb-16 text-slate-900 sm:px-6 lg:px-8 border-b border-slate-200/80">
        {/* Soft, delicate backdrop ambient glow */}
        <div className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-full max-w-[850px] h-[400px] bg-gradient-to-b from-teal-100/50 via-teal-50/20 to-transparent blur-3xl rounded-full" />
        <div className="pointer-events-none absolute top-1/2 -right-10 w-[280px] sm:w-[350px] h-[350px] bg-sky-100/30 blur-3xl rounded-full" />

        <div className="relative mx-auto max-w-4xl text-center z-10">
          {/* Subtle GovTech Trust Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/90 px-3.5 py-1.5 text-xs font-bold text-[#148C7E] shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-[#18A999] animate-pulse" />
            <img
              src="/assets/nepal-flag.gif"
              alt="नेपालको झण्डा"
              className="h-4 w-auto object-contain shrink-0 inline-block drop-shadow-2xs"
            />
            <span>{isNe ? 'नेपाल सरकार स्वीकृत आधिकारिक प्रारूप • १००% कानुनी मान्यता' : 'Official Nepal Statutory Standards • 100% Legally Valid'}</span>
          </div>

          {/* Bold, Catchy & Engaging Headline */}
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#123B5D] sm:text-5xl lg:text-6xl sm:leading-[1.15]">
            {isNe ? 'सरकारी तथा कानुनी कागजातहरू' : 'Government & Legal Paperwork'} <br />
            <span className="bg-gradient-to-r from-[#18A999] via-[#148C7E] to-[#123B5D] bg-clip-text text-transparent">
              {isNe ? 'अब आफ्नै हातले सजिलै बनाउनुहोस्' : 'Prepared Easily Without Any Middlemen'}
            </span>
          </h1>

          {/* Clean, High-Clarity Citizen Subtitle */}
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base font-normal">
            {isNe
              ? 'दलाल र लेखापढीको महँगो शुल्क बिना—प्यान (PAN), कम्पनी दर्ता (MOA/AOA), घर बहाल सम्झौता र वडा सिफारिसहरू शुद्ध कालिमाटी युनिकोडमा ३ मिनेटमै तयार गरी प्रिन्ट-रेडी PDF डाउनलोड गर्नुहोस्।'
              : 'Generate verified PAN forms, OCR company registration suites, and rent agreements in standard Kalimati Unicode within minutes—100% legal, print-ready, and middleman-free.'}
          </p>

          {/* Clean, High-Contrast Floating Search Box */}
          <div ref={searchContainerRef} className="relative mx-auto mt-8 max-w-2xl text-left">
            <div className="relative flex items-center rounded-2xl border-2 border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-200/60 transition-all focus-within:border-[#18A999] focus-within:ring-4 focus-within:ring-teal-100">
              <span className="pl-3.5 text-slate-400">
                <Search className="h-5 w-5 text-[#18A999]" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={isNe ? 'कुन फारम खोज्दै हुनुहुन्छ? (उदा: PAN, MOA, घर बहाल सम्झौता...)' : 'Search official forms (e.g. PAN, MOA, Rent Deed, Annual Return)...'}
                className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mr-2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Link
                href={`#document-directory`}
                onClick={() => {
                  document.getElementById('document-directory')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="shrink-0 rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] px-6 py-3 text-xs font-bold text-white shadow-md shadow-teal-500/20 transition hover:from-[#148C7E] hover:to-[#0f6c61]"
              >
                {t('searchButton')}
              </Link>
            </div>

            {/* Quick Department Shortcuts */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400">{isNe ? 'लोकप्रिय ढाँचाहरू:' : 'Popular:'}</span>
              {[
                { label: isNe ? 'व्यक्तिगत PAN' : 'Individual PAN', q: 'PAN', icon: <Landmark className="h-3 w-3 text-teal-600" /> },
                { label: isNe ? 'कम्पनी MOA/AOA' : 'Company MOA/AOA', q: 'MOA', icon: <Building2 className="h-3 w-3 text-blue-600" /> },
                { label: isNe ? 'घर बहाल सम्झौता' : 'Rent Deed', q: 'बहाल', icon: <FileText className="h-3 w-3 text-emerald-600" /> },
                { label: isNe ? 'वार्षिक अनुपालन (४-इन-१)' : 'Annual Suite (4-in-1)', q: 'वार्षिक', icon: <Layers className="h-3 w-3 text-amber-600" /> },
              ].map(tag => (
                <button
                  type="button"
                  key={tag.label}
                  onClick={() => {
                    setSearchQuery(tag.q);
                    document.getElementById('document-directory')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs transition hover:border-[#18A999] hover:text-[#18A999] hover:bg-teal-50/50"
                >
                  {tag.icon}
                  <span>{tag.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4 Key Platform Stats Banner */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto pt-4 border-t border-slate-200/70">
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-2xs text-center backdrop-blur-xs">
              <span className="text-xl sm:text-2xl font-black text-[#123B5D] font-outfit">{stat1Value}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat1Label}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-2xs text-center backdrop-blur-xs">
              <span className="text-xl sm:text-2xl font-black text-[#18A999] font-outfit">{stat2Value}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat2Label}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-2xs text-center backdrop-blur-xs">
              <span className="text-xl sm:text-2xl font-black text-[#123B5D] font-outfit">{stat3Value}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat3Label}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 shadow-2xs text-center backdrop-blur-xs">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-outfit">{stat4Value}</span>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat4Label}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Unified, Clean Document Catalog ─── */}
      <section id="document-directory" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-2">
        {/* Section Header with Clean Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#18A999]">
              {isNe ? 'कागजात निर्देशिका' : 'DOCUMENT DIRECTORY'}
            </span>
            <h2 className="mt-1 text-2xl font-extrabold text-[#123B5D] sm:text-3xl">
              {isNe ? 'उपलब्ध आधिकारिक फारम तथा ढाँचाहरू' : 'Statutory Templates & Forms'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? `नेपाल सरकारका विभिन्न निकायका लागि कुल ${filteredDocs.length} आधिकारिक फारमहरू उपलब्ध छन्।`
                : `Showing ${filteredDocs.length} verified government-compliant statutory templates.`}
            </p>
          </div>

          {/* Clean Segmented Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: isNe ? 'सबै फारमहरू' : 'All Documents', count: allDocs.length, icon: <Layers className="h-3.5 w-3.5" /> },
              { id: 'ocr', label: isNe ? 'कम्पनी दर्ता (OCR)' : 'Company (OCR)', count: allDocs.filter(d => d.category === 'ocr').length, icon: <Building2 className="h-3.5 w-3.5" /> },
              { id: 'ird', label: isNe ? 'कर तथा प्यान (IRD)' : 'Tax (IRD)', count: allDocs.filter(d => d.category === 'ird').length, icon: <Landmark className="h-3.5 w-3.5" /> },
              { id: 'legal', label: isNe ? 'करारनामा (Legal)' : 'Contracts', count: allDocs.filter(d => d.category === 'legal').length, icon: <Scale className="h-3.5 w-3.5" /> },
              ...(allDocs.some(d => d.category === 'ward')
                ? [{ id: 'ward', label: isNe ? 'वडा सिफारिस' : 'Ward Office', count: allDocs.filter(d => d.category === 'ward').length, icon: <FileText className="h-3.5 w-3.5" /> }]
                : []),
            ].map(tab => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#123B5D] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-outfit ${
                    selectedCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Clean, Spacious Document Cards Grid (Limited to 2 rows = max 6 documents) */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.slice(0, 6).map((doc) => {
            const title = isNe ? doc.titleNe : doc.titleEn;
            const desc = isNe ? doc.descriptionNe : doc.descriptionEn;
            const fee = isNe ? doc.feeNe : doc.feeEn;
            const time = isNe ? doc.estimatedTimeNe : doc.estimatedTimeEn;
            const isSuite = doc.slug.includes('suite');

            return (
              <div
                key={doc.id}
                className={`group flex flex-col justify-between rounded-2xl bg-white p-5 transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 border ${
                  isSuite
                    ? 'border-teal-400 ring-2 ring-teal-100/70 bg-gradient-to-b from-teal-50/20 to-white'
                    : 'border-slate-200/90 hover:border-[#18A999]/80'
                }`}
              >
                <div>
                  {/* Clean Top Meta: Icon + Time + Suite indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      {doc.category === 'ocr' ? (
                        <Building2 className="h-4 w-4 text-slate-400" />
                      ) : doc.category === 'ird' ? (
                        <Landmark className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Scale className="h-4 w-4 text-slate-400" />
                      )}
                      <span>{time}</span>
                    </div>

                    {isSuite && (
                      <span className="rounded-md bg-amber-50 border border-amber-200/90 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        {isNe ? 'संयुक्त प्याकेज' : 'Full Package'}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <Link href={`/documents/${doc.slug}/form`} className="block">
                    <h3 className="text-base font-bold text-[#123B5D] group-hover:text-[#18A999] transition leading-snug line-clamp-2">
                      {title}
                    </h3>
                  </Link>

                  {/* Short Description */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                    {desc}
                  </p>
                </div>

                {/* Bottom Metadata & Clean CTAs */}
                <div className="mt-5 border-t border-slate-100 pt-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-base font-bold font-outfit ${fee.includes('निःशुल्क') || fee.toLowerCase().includes('free') ? 'text-emerald-600' : 'text-[#123B5D]'}`}>
                      {fee}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      {isNe ? 'A4 ढाँचा' : 'A4 Print Ready'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                      <span>{isNe ? 'पूर्वावलोकन' : 'Quick View'}</span>
                    </button>
                    <Link
                      href={`/documents/${doc.slug}/form`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#123B5D] hover:bg-[#18A999] py-2 text-xs font-semibold text-white transition shadow-xs cursor-pointer group-hover:shadow-md"
                    >
                      <span>{isNe ? 'फारम भर्नुहोस्' : 'Fill Form'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explore All Documents CTA Button (Keeps page clean at 2 rows) */}
        {filteredDocs.length > 6 && (
          <div className="mt-10 text-center">
            <Link
              href="/documents"
              className="inline-flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-200/90 hover:border-[#18A999] px-7 py-3.5 text-xs sm:text-sm font-bold text-[#123B5D] hover:text-[#18A999] shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <Layers className="h-4 w-4 text-[#18A999] group-hover:scale-110 transition" />
              <span>
                {isNe
                  ? `सबै फारम तथा ढाँचाहरू हेर्नुहोस् (${filteredDocs.length}+)`
                  : `Explore All Statutory Documents (${filteredDocs.length}+)`}
              </span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        )}

        {filteredDocs.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-base font-bold text-[#123B5D]">
              {isNe ? 'कुनै कागजात फेला परेन' : 'No documents found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isNe ? 'कृपया अर्को शब्द फेरेर खोज्नुहोस् वा सबै कागजात सूची हेर्नुहोस्।' : 'Try searching for different terms or reset category filters.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-xl bg-[#123B5D] px-4 py-2 text-xs font-bold text-white"
            >
              {isNe ? 'फिल्टर हटाउनुहोस्' : 'Reset Filters'}
            </button>
          </div>
        )}
      </section>

      {/* ─── 4. Live Statutory Document Sample Showcase (Clean GovTech Proof) ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
          <div className="grid lg:grid-cols-12 items-center">
            {/* Left Narrative Column */}
            <div className="p-8 sm:p-12 lg:col-span-6 lg:p-14">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-[11px] font-bold text-[#148C7E]">
                <FileCheck className="h-3.5 w-3.5 text-[#148C7E]" />
                <span>{isNe ? 'प्रमाणित नमुना प्रारूप' : 'OFFICIAL SAMPLE PREVIEW'}</span>
              </span>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#123B5D] sm:text-3xl leading-snug">
                {isNe
                  ? 'सरकारी कार्यालयमा सिधै पेश गर्न मिल्ने छाप-योग्य A4 कागजात'
                  : 'Official A4 Layouts Formatted for Immediate Government Submission'}
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {isNe
                  ? 'मेरो कागजबाट तयार हुने प्रत्येक फारम नेपाल सरकारका सम्बन्धित विभाग (IRD, OCR, वडा कार्यालय) द्वारा स्वीकृत कानुनी ढाँचा र शुद्ध कालिमाटी युनिकोडमा स्वचालित रूपमा तयार हुन्छ।'
                  : 'Every document generated through Mero Kagaz adheres strictly to department-mandated statutory phrasing, standard margin guidelines, and verified Nepali Kalimati typography.'}
              </p>

              {/* Feature Highlights with Clean Icons */}
              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-[#148C7E]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B5D]">
                      {isNe ? 'प्रचलित ऐन र अनुसूची अनुसारको कानुनी भाषा' : 'Strict Statutory Language Compliance'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isNe ? 'मुलुकी देवानी संहिता तथा कम्पनी ऐनका आधिकारिक दफाहरू समावेश।' : 'Includes standard legal clauses, statutory disclaimers, and witness sections.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Printer className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B5D]">
                      {isNe ? 'शुद्ध कालिमाटी युनिकोड फन्ट (Font-Break Free)' : 'Flawless Kalimati Unicode Printing'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isNe ? 'प्रिती फन्ट कन्भर्टरको आवश्यकता छैन, कुनै पनि प्रिन्टरमा अक्षर नबिग्रिने।' : 'Zero font distortion or broken glyphs across all commercial and home printers.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#123B5D]">
                      {isNe ? 'डिजिटल रुजु तथा QR प्रमाणिकरण' : 'Digital Verification Barcode'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isNe ? 'कागजातको प्रामाणिकता जाँच गर्न डिजिटल ट्र्याकिङ कोड।' : 'Instant document authenticity tracking for administrative verification.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/documents"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#123B5D] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0E2A47] transition"
                >
                  <span>{isNe ? 'फारम छान्नुहोस्' : 'Explore All Templates'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <span className="text-xs text-slate-400">
                  {isNe ? 'औसत ३ मिनेटमा तयार' : 'Ready in ~3 minutes'}
                </span>
              </div>
            </div>

            {/* Right Interactive/Visual Mock A4 Sheet */}
            <div className="bg-slate-50/80 p-6 sm:p-10 lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200/80 flex items-center justify-center">
              {/* Mock A4 Paper with High-Trust Details */}
              <div className="relative w-full max-w-sm rounded-xl border border-slate-300/80 bg-white p-6 shadow-lg transition-transform hover:scale-[1.01]">
                {/* Official Header */}
                <div className="text-center border-b border-slate-200 pb-3">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-700 text-sm mb-1">
                    <Landmark className="h-4 w-4 text-red-700" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">नेपाल सरकार • अर्थ मन्त्रालय</p>
                  <p className="text-[11px] font-extrabold text-[#123B5D]">आन्तरिक राजस्व विभाग</p>
                  <p className="text-[9px] text-slate-500">स्थायी लेखा नम्बर (PAN) दर्ता निवेदन फारम</p>
                </div>

                {/* Verified Stamp Badge Overlay */}
                <div className="absolute top-4 right-4 rotate-12 rounded border border-emerald-600 bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider inline-flex items-center gap-1">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                  <span>{isNe ? 'प्रमाणित ढाँचा' : 'VERIFIED FORMAT'}</span>
                </div>

                {/* Form Fields Simulation */}
                <div className="mt-4 space-y-2 text-[10px]">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-medium">निवेदकको नाम:</span>
                    <span className="font-bold text-slate-800">रमेश कुमार शर्मा</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-medium">नागरिकता नं:</span>
                    <span className="font-bold text-slate-800 font-mono">२७-०१-७५-०४३२१</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-medium">स्थायी ठेगाना:</span>
                    <span className="font-bold text-slate-800">काठमाडौं - ३२, बागमती</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400 font-medium">दर्ता प्रयोजन:</span>
                    <span className="font-bold text-[#148C7E]">व्यक्तिगत रोजगार / व्यवसाय</span>
                  </div>
                </div>

                {/* Legal Clause Dummy Lines */}
                <div className="mt-4 rounded bg-slate-50 p-2 text-[9px] text-slate-500 leading-normal border border-slate-100">
                  <p>
                    &ldquo;माथि उल्लिखित सम्पूर्ण विवरण सत्य र तथ्यपरक छ। झुट्टा ठहरिए कानुन बमोजिम सजाय भोग्न मन्जुर छु।&rdquo;
                  </p>
                </div>

                {/* Bottom Signature & QR Verification Bar */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <div className="h-7 w-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-700 text-[8px]">
                      QR
                    </div>
                    <div>
                      <p className="font-mono text-slate-600 text-[8px]">MK-PAN-2081-994</p>
                      <p className="text-emerald-600 font-bold text-[8px]">डिजिटल रूपमा सुरक्षित</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block border-b border-slate-300 w-16 mb-0.5"></span>
                    <span className="text-slate-400 text-[8px]">निवेदकको दस्तखत</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. "How It Works" in 3 Interactive, Clear Steps ─── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 shadow-xs">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-[#148C7E]">
              <FileCheck className="h-3.5 w-3.5 text-[#18A999]" />
              <span>{isNe ? 'सरल ३-चरण कार्यप्रणाली' : 'HOW IT WORKS IN 3 STEPS'}</span>
            </span>
            <h2 className="mt-3 text-2xl font-extrabold text-[#123B5D] sm:text-3xl">
              {isNe ? '३ सरल चरणमा आधिकारिक कागजात तयार गर्नुहोस्' : '3 Easy Steps to Generate Documents'}
            </h2>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              {isNe
                ? 'कुनै प्राविधिक वा कानुनी ज्ञान नभए पनि तपाईं आफैले घरमै बसेर सरकारी फारम ३ मिनेटमै तयार गर्न सक्नुहुन्छ।'
                : 'No legal expertise required. Anyone can generate compliant forms in minutes.'}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white p-7 text-center shadow-2xs hover:shadow-md hover:border-teal-300 transition-all duration-300 group">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123B5D] text-xl font-black text-white shadow-md shadow-sky-950/20 group-hover:scale-105 transition-transform">
                {isNe ? '१' : '1'}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-full">
                <FileText className="h-3 w-3" />
                <span>{isNe ? 'चरण १' : 'Step 1'}</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[#123B5D]">
                {isNe ? '१. कागजात छान्नुहोस्' : '1. Select Template'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {isNe
                  ? 'प्यान, भ्याट, कम्पनी दर्ता (MOA/AOA) वा घर बहाल सम्झौता जस्ता आवश्यक फारमहरूको सूचीबाट छान्नुहोस्।'
                  : 'Choose from official templates like PAN, Company MOA/AOA, or Rent Agreement.'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-teal-200/90 bg-gradient-to-b from-teal-50/30 to-white p-7 text-center shadow-2xs hover:shadow-md hover:border-[#18A999] transition-all duration-300 group">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#18A999] text-xl font-black text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform">
                {isNe ? '२' : '2'}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#148C7E] bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                <FileEdit className="h-3 w-3" />
                <span>{isNe ? 'चरण २' : 'Step 2'}</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[#123B5D]">
                {isNe ? '२. विवरण भर्नुहोस्' : '2. Fill Details'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {isNe
                  ? 'सरल प्रश्नोत्तर फारममा आफ्नो नाम, ठेगाना र विवरणहरू नेपाली वा अंग्रेजीमा प्रविष्ट गर्नुहोस्। नेपाली युनिकोड स्वतः अनुवाद हुन्छ।'
                  : 'Enter basic details with easy guidance and live Nepali Unicode typing support.'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white p-7 text-center shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 group">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-md shadow-emerald-600/25 group-hover:scale-105 transition-transform">
                {isNe ? '३' : '3'}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <Download className="h-3 w-3" />
                <span>{isNe ? 'चरण ३' : 'Step 3'}</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-[#123B5D]">
                {isNe ? '३. तत्काल PDF डाउनलोड' : '3. Instant Download'}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {isNe
                  ? 'कालिमाटी फन्टमा पूर्ण रूपमा तयार भएको प्रिन्ट-रेडी A4 PDF सिधै डाउनलोड गर्नुहोस् र सरकारी कार्यालयमा पेश गर्नुहोस्।'
                  : 'Download a clean, verified PDF rendered with proper typography, ready for office submission.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. Platform Guarantees (Clean Details, Zero Clutter) ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-sm hover:border-teal-300 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-[#148C7E] mb-3.5">
              <Landmark className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#123B5D]">
              {isNe ? 'सरकारी ढाँचाको प्रत्याभूति' : 'Statutory Compliance'}
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {isNe ? 'नेपाल सरकारका प्रचलित ऐन, नियम र निर्देशिका बमोजिम १००% आधिकारिक प्रारूप।' : 'Compliant with Nepal Companies Act and Inland Revenue Department guidelines.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 mb-3.5">
              <Printer className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#123B5D]">
              {isNe ? 'कालिमाटी युनिकोड लेआउट' : 'Kalimati Typography'}
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {isNe ? 'फन्ट नबिग्रिने गरी सरकारी ढाँचामा स्पष्ट प्रिन्ट गर्न मिल्ने A4 PDF।' : 'Crisp A4 print layouts formatted for direct government office submission.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 mb-3.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#123B5D]">
              {isNe ? 'गोपनीयता तथा सुरक्षा' : 'Data Privacy'}
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {isNe ? 'तपाईंका कागजात र व्यक्तिगत विवरण २५६-बिट इन्क्रिप्सनबाट पूर्ण सुरक्षित।' : '256-bit encryption ensuring strict data isolation and confidentiality.'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-sm hover:border-purple-300 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600 mb-3.5">
              <CreditCard className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-[#123B5D]">
              {isNe ? 'पारदर्शी डिजिटल भुक्तानी' : 'Digital Payment'}
            </h4>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {isNe ? 'eSewa, Khalti र ConnectIPS मार्फत तत्काल र पारदर्शी भुक्तानी।' : 'Direct integration with Nepal top digital payment gateways for seamless checkout.'}
            </p>
          </div>
        </div>
      </section>

      {/* ─── 5. Modern & Animated Visual Comparison (Mero Kagaz vs Traditional Middlemen) ─── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-[#148C7E] shadow-2xs">
            <Scale className="h-3.5 w-3.5 text-[#18A999]" />
            <span>{isNe ? 'प्रत्यक्ष तुलना • किन मेरो कागज?' : 'SIDE-BY-SIDE COMPARISON'}</span>
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-[#123B5D] sm:text-3xl lg:text-4xl tracking-tight whitespace-normal md:whitespace-nowrap">
            {isNe ? 'दलालको झन्झट छोड्नुहोस्, ३ मिनेटमै आफै बनाउनुहोस्' : 'Ditch Middleman Delays — Generate in 3 Minutes'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {isNe
              ? 'किन हजारौं नेपाली नागरिक तथा व्यवसायीहरू पुरानो ढर्रा छोडेर मेरो कागज रोज्छन्? प्रत्यक्ष भिन्नता हेर्नुहोस्:'
              : 'See why thousands across Nepal choose Mero Kagaz over traditional brokers, delays, and queuing.'}
          </p>
        </div>

        {/* Side-by-Side Visual Animated Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
          {/* 1. The Frustrating Old Way (Traditional Lekhapadi / Dalal) */}
          <div className="lg:col-span-5 rounded-3xl border-2 border-rose-200/80 bg-gradient-to-b from-rose-50/50 via-white to-rose-50/20 p-6 sm:p-7 shadow-xs hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-2xs">
                  <AlertCircle className="h-6 w-6" />
                </span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
                    {isNe ? 'पुरानो झन्झटिलो बाटो' : 'THE OLD PAINFUL WAY'}
                  </span>
                  <h3 className="text-base font-bold text-slate-800">
                    {isNe ? 'लेखापढी तथा दलाल (बिचौलिया)' : 'Traditional Brokers & Dalal'}
                  </h3>
                </div>
              </div>
              <span className="rounded-full bg-rose-100 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                {isNe ? 'महँगो र ढिलो' : 'Slow & Costly'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-rose-100/80 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">
                  <X className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isNe ? '२ देखि ५ दिन धाउनुपर्ने (समय बर्बाद)' : '2 to 5 Days Delay & Queuing'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'सरकारी कार्यालय र लेखापढीको चक्कर काट्दा हप्तौं खेर जाने।' : 'Wasting entire workdays queuing outside government gates.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-rose-100/80 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">
                  <X className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isNe ? 'रू २,००० देखि १५,००० सम्म महँगो शुल्क' : 'Expensive Fees (NPR 2,000 - 15,000+)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'सामान्य फारमका लागि पनि मनपरी रकम असुल्ने बिचौलिया।' : 'Arbitrary charges and hidden broker markups for basic documents.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-rose-100/80 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">
                  <X className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isNe ? 'अपरिचितलाई नागरिकता दिनुपर्ने जोखिम' : 'Data Privacy & Security Risks'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'व्यक्तिगत नागरिकता र कागजातको दुरुपयोग हुने उच्च खतरा।' : 'Handing personal identification documents to unknown physical agents.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-rose-100/80 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">
                  <X className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isNe ? 'टाइपराइटर वा बिग्रिने प्रिती फन्ट' : 'Font Distortion & Typo Rejections'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'अक्षर नमिलेर सरकारी फाँटबाट फारम फिर्ता हुने चिन्ता।' : 'Frequent font breaks and spelling mistakes causing office rejection.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-rose-100/80 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 font-bold text-xs mt-0.5">
                  <X className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {isNe ? 'कार्यालय समयमै लाइन बस्नुपर्ने' : 'Limited Hours & Bureaucratic Chaos'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'आफ्नो काम छोडेर दिनभर सरकारी लाइनमा उभिनुपर्ने।' : 'Must take leave from work during strict 10-5 government hours.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Animated VS Badge in the center */}
          <div className="lg:col-span-1 flex items-center justify-center -my-2 lg:my-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#123B5D] to-[#18A999] text-white font-black text-sm shadow-xl ring-4 ring-white animate-pulse">
              VS
            </div>
          </div>

          {/* 2. The Empowering Mero Kagaz Way (Modern Digital Experience) */}
          <div className="lg:col-span-5 relative rounded-3xl border-2 border-teal-400 bg-gradient-to-b from-teal-50/50 via-white to-teal-50/20 p-6 sm:p-7 shadow-xl ring-4 ring-teal-100/60 hover:-translate-y-1 transition-all duration-300">
            {/* Top Recommended Ribbon */}
            <div className="absolute -top-3.5 right-6 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#18A999] to-[#148C7E] px-3.5 py-1 text-[11px] font-black text-white shadow-md shadow-teal-500/25">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              <span>{isNe ? 'सिफारिस गरिएको • नागरिक रोजाइ' : 'RECOMMENDED • CITIZEN CHOICE'}</span>
            </div>

            <div className="flex items-center justify-between border-b border-teal-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/25">
                  <CheckCircle2 className="h-6 w-6" />
                </span>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#148C7E] block">
                    {isNe ? 'आधुनिक डिजिटल समाधान' : 'THE MODERN MERO KAGAZ WAY'}
                  </span>
                  <h3 className="text-base font-bold text-[#123B5D]">
                    {isNe ? 'मेरो कागज (Mero Kagaz)' : 'Mero Kagaz (Instant Digital)'}
                  </h3>
                </div>
              </div>
              <span className="rounded-full bg-teal-100 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-[#148C7E]">
                {isNe ? '३ मिनेटमै तयार' : '3 Mins Ready'}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-teal-200/80 shadow-2xs hover:border-teal-400 transition-all">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#18A999] text-white font-bold text-xs mt-0.5 shadow-2xs">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#123B5D]">
                    {isNe ? '३ देखि ५ मिनेटमै तत्काल A4 PDF' : '3 to 5 Minutes Instant A4 PDF'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'कुनै लाइन बस्नु नपर्ने, तुरुन्तै हातमा छाप-योग्य आधिकारिक फारम।' : 'Instant download formatted directly for official department filing.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-teal-200/80 shadow-2xs hover:border-teal-400 transition-all">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#18A999] text-white font-bold text-xs mt-0.5 shadow-2xs">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#123B5D]">
                    {isNe ? 'निःशुल्क वा न्यूनतम (रू १०० देखि ५०० मात्र)' : 'Free or Minimal (NPR 100 - 500 Only)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? '९५% सम्म पैसा बचत! eSewa, Khalti, ConnectIPS बाट पारदर्शी भुक्तानी।' : 'Save up to 95% on legal drafting fees with transparent payment.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-teal-200/80 shadow-2xs hover:border-teal-400 transition-all">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#18A999] text-white font-bold text-xs mt-0.5 shadow-2xs">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#123B5D]">
                    {isNe ? '१००% आफ्नै नियन्त्रणमा सुरक्षित' : '100% Private in Your Complete Control'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? '२५६-बिट आधुनिक इन्क्रिप्सन, विवरण तेस्रो व्यक्तिलाई कहिल्यै साझा हुँदैन।' : 'Bank-grade 256-bit encryption; data is never shared with third parties.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-teal-200/80 shadow-2xs hover:border-teal-400 transition-all">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#18A999] text-white font-bold text-xs mt-0.5 shadow-2xs">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#123B5D]">
                    {isNe ? 'शुद्ध कालिमाटी युनिकोड लेआउट' : 'Standard Kalimati Unicode Typography'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'सरकारी निकाय (IRD/OCR) द्वारा १००% स्वीकृत मानक कानुनी प्रारूप।' : 'Compliant with statutory laws, approved font rules, and A4 margins.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-teal-200/80 shadow-2xs hover:border-teal-400 transition-all">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#18A999] text-white font-bold text-xs mt-0.5 shadow-2xs">
                  <Check className="h-4 w-4 stroke-[3]" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#123B5D]">
                    {isNe ? '२४/७ घरमै बसेर मोबाइलबाटै' : '24/7 Access from Home or Mobile'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isNe ? 'आफ्नै सहजतामा, जहाँसुकैबाट कागजात तयार गर्नुहोस्।' : 'Create and download official documents anywhere, anytime.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="mt-5 pt-4 border-t border-teal-100">
              <Link
                href="/documents"
                className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-[#18A999] to-[#148C7E] hover:from-[#148C7E] hover:to-[#0f6c61] py-3 text-xs font-bold text-white shadow-md shadow-teal-500/25 transition cursor-pointer"
              >
                <span>{isNe ? 'अहिले नै आफ्नो फारम बनाउन सुरु गर्नुहोस्' : 'Start Creating Your Document Now'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Savings Highlight Counters */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="rounded-2xl border border-teal-200/90 bg-teal-50/70 p-4 text-center shadow-2xs">
            <span className="text-2xl font-black text-[#148C7E] font-outfit">⚡ ९५%</span>
            <p className="text-xs font-bold text-[#123B5D] mt-0.5">{isNe ? 'समय बचत' : 'Time Saved'}</p>
            <p className="text-[10px] text-slate-500">{isNe ? '५ दिनबाट ३ मिनेटमा' : 'From 5 days down to 3 mins'}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/70 p-4 text-center shadow-2xs">
            <span className="text-2xl font-black text-emerald-700 font-outfit">💰 १०x</span>
            <p className="text-xs font-bold text-[#123B5D] mt-0.5">{isNe ? 'पैसा बचत' : 'Money Saved'}</p>
            <p className="text-[10px] text-slate-500">{isNe ? 'दलालको चर्को शुल्कबाट मुक्ति' : 'Save thousands on broker fees'}</p>
          </div>
          <div className="rounded-2xl border border-sky-200/90 bg-sky-50/70 p-4 text-center shadow-2xs">
            <span className="text-2xl font-black text-sky-700 font-outfit">📜 १००%</span>
            <p className="text-xs font-bold text-[#123B5D] mt-0.5">{isNe ? 'कानुनी मान्यता' : 'Legal Compliance'}</p>
            <p className="text-[10px] text-slate-500">{isNe ? 'नेपाल सरकार स्वीकृत ढाँचा' : 'Nepal Government verified format'}</p>
          </div>
        </div>
      </section>

      {/* ─── 6. Modern, Interactive 2-Column FAQ Section ─── */}
      <section id="faq" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3.5 py-1 text-xs font-bold text-[#148C7E] shadow-2xs">
            <HelpCircle className="h-3.5 w-3.5 text-[#18A999]" />
            <span>{isNe ? 'जिज्ञासा र स्पष्टीकरण' : 'COMMON QUESTIONS & ANSWERS'}</span>
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-[#123B5D] sm:text-3xl lg:text-4xl tracking-tight whitespace-normal md:whitespace-nowrap">
            {isNe ? 'प्रायः सोधिने प्रश्नहरू (FAQ)' : 'Frequently Asked Questions'}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-2xl mx-auto">
            {isNe
              ? 'मेरो कागज प्रयोग गर्दा नागरिक तथा व्यवसायीहरूले धेरै सोध्ने मुख्य प्रश्नहरू र तिनका आधिकारिक जवाफहरू:'
              : 'Everything you need to know about preparing official statutory documents on Mero Kagaz.'}
          </p>
        </div>

        {/* 2-Column Responsive Interactive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            const nepaliDigits = ['१', '२', '३', '४', '५', '६', '७', '८', '९'];
            const qNum = isNe ? (nepaliDigits[idx] || String(idx + 1)) : `Q${idx + 1}`;

            const iconMap: Record<string, React.ReactNode> = {
              legal: <ShieldCheck className="h-4 w-4 text-[#18A999]" />,
              time: <Clock className="h-4 w-4 text-blue-600" />,
              payment: <CreditCard className="h-4 w-4 text-purple-600" />,
              middlemen: <UserCheck className="h-4 w-4 text-amber-600" />,
              privacy: <Lock className="h-4 w-4 text-emerald-600" />,
              edit: <FileEdit className="h-4 w-4 text-teal-600" />,
            };

            return (
              <div
                key={faq.id || idx}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-teal-400 bg-gradient-to-b from-teal-50/25 via-white to-white ring-2 ring-teal-100 shadow-md'
                    : 'border-slate-200/90 bg-white shadow-2xs hover:border-teal-300 hover:shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="flex w-full items-start justify-between gap-3 p-5 text-left transition cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all mt-0.5 ${
                      isOpen
                        ? 'bg-teal-500 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-teal-50 group-hover:text-[#148C7E]'
                    }`}>
                      {qNum}
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold text-[#123B5D] group-hover:text-[#18A999] transition leading-snug block">
                        {isNe ? faq.qNe : faq.qEn}
                      </span>
                    </div>
                  </div>

                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                    isOpen
                      ? 'bg-[#18A999] text-white rotate-180 shadow-2xs'
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-700'
                  }`}>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-[13px] leading-relaxed text-slate-600 border-t border-slate-100/90 animate-in fade-in duration-200">
                    <p className="font-medium text-slate-700">
                      {isNe ? faq.aNe : faq.aEn}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Reassurance Banner - Clean, Modern & Animated */}
        <div className="mt-10 relative overflow-hidden rounded-2xl border border-teal-200/90 bg-gradient-to-r from-teal-50/80 via-white to-sky-50/70 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-sm">
          <div className="flex items-center gap-4 z-10">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18A999] to-[#148C7E] text-white shadow-md shadow-teal-600/20">
              <HelpCircle className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#123B5D]">
                {isNe ? 'अझै केही जिज्ञासा वा सहयोग आवश्यक छ?' : 'Still have questions or need assistance?'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isNe
                  ? 'हाम्रो नागरिक सहायता केन्द्र तपाईंलाई आधिकारिक ढाँचा छनोट गर्न सघाउन तयार छ।'
                  : 'Our dedicated support team is available to help you navigate statutory documents.'}
              </p>
            </div>
          </div>
          <Link
            href="/documents"
            className="group z-10 inline-flex items-center gap-2 shrink-0 rounded-xl bg-white border-2 border-teal-300 hover:border-[#18A999] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#148C7E] hover:text-[#0f6c61] hover:bg-teal-50/60 transition-all duration-200 shadow-2xs hover:shadow-sm"
          >
            <span>{isNe ? 'सबै कागजात हेर्नुहोस्' : 'Browse All Documents'}</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </section>

      {/* ─── 7. High-Converting Animated Bottom Call-to-Action ─── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071524] via-[#0F3554] to-[#0A2238] p-8 sm:p-12 lg:p-14 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 border border-white/10 group">
          {/* Animated Ambient Light Spheres */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl animate-pulse" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(24,169,153,0.12),transparent_60%)]" />

          {/* Left Hero Narrative */}
          <div className="max-w-2xl text-center lg:text-left z-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 border border-teal-400/30 px-3.5 py-1 text-xs font-bold text-teal-300 mb-4 shadow-2xs backdrop-blur-xs">
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-ping" />
              <FileCheck className="h-3.5 w-3.5 text-teal-300" />
              <span>{isNe ? 'प्रमाणित छाप-योग्य A4 कागजात' : 'Official Print-Ready A4 Document'}</span>
            </span>

            <h2 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl leading-tight text-white tracking-tight whitespace-normal lg:whitespace-nowrap">
              {isNe ? 'अहिले नै आफ्नो आधिकारिक फारम तयार गर्नुहोस्' : 'Ready to prepare your official document?'}
            </h2>

            <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {isNe
                ? 'कुनै सरकारी कार्यालय धाउनु नपर्ने, कुनै मध्यस्थकर्ता बिना ३ मिनेटमै आफ्नो कागजात तयार गरी प्रिन्ट-रेडी PDF डाउनलोड गर्नुहोस्।'
                : 'Eliminate costly middleman fees and paperwork delays. Generate your verified statutory forms directly in minutes.'}
            </p>

            {/* Micro Trust Points under subtitle */}
            <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs font-medium text-slate-200">
              <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-xs">
                <Check className="h-3.5 w-3.5 text-teal-400 stroke-[3]" />
                <span>{isNe ? '१००% कानुनी मान्यता' : '100% Legally Valid'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-xs">
                <Check className="h-3.5 w-3.5 text-teal-400 stroke-[3]" />
                <span>{isNe ? 'दलाल बिना ३ मिनेटमै' : 'Zero Middleman Fees'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 backdrop-blur-xs">
                <Check className="h-3.5 w-3.5 text-teal-400 stroke-[3]" />
                <span>{isNe ? 'शुद्ध कालिमाटी युनिकोड' : 'Kalimati Unicode A4'}</span>
              </span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 z-10 w-full lg:w-auto shrink-0">
            <Link
              href="/documents"
              className="relative group/btn w-full sm:w-auto justify-center rounded-2xl bg-gradient-to-r from-[#18A999] via-[#148C7E] to-[#117065] px-7 py-3.5 text-xs sm:text-sm font-bold text-white transition-all duration-200 flex items-center gap-2 shadow-xl shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-95 cursor-pointer overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>{isNe ? 'कागजात सूची हेर्नुहोस्' : 'Browse All Documents'}</span>
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition" />
              </span>
            </Link>

            <Link
              href="/register"
              className="w-full sm:w-auto justify-center rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-xs px-6 py-3.5 text-xs sm:text-sm font-bold text-white transition-all duration-200 flex items-center gap-2 shadow-xs hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-teal-300" />
              <span>{isNe ? 'निःशुल्क खाता खोल्नुहोस्' : 'Create Account'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 8. Quick Preview Modal ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
              {isNe ? previewDoc.categoryLabelNe : previewDoc.categoryLabelEn}
            </span>

            <h3 className="mt-3 text-base font-bold text-[#123B5D]">
              {isNe ? previewDoc.titleNe : previewDoc.titleEn}
            </h3>

            <p className="mt-1 text-xs text-slate-500 font-medium inline-flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-slate-400" />
              <span>{isNe ? previewDoc.departmentNe : previewDoc.departmentEn}</span>
            </p>

            <p className="mt-3 text-xs leading-relaxed text-slate-600">
              {isNe ? previewDoc.descriptionNe : previewDoc.descriptionEn}
            </p>

            {/* Checklist of requirements */}
            <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="text-xs font-bold text-[#123B5D] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#18A999]" />
                <span>{isNe ? 'आवश्यक विवरणहरू' : 'Required Information:'}</span>
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
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{isNe ? 'शुल्क' : 'Fee'}</p>
                <p className="text-base font-bold text-[#123B5D] font-outfit">
                  {isNe ? previewDoc.feeNe : previewDoc.feeEn}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {isNe ? 'बन्द' : 'Close'}
                </button>
                <Link
                  href={`/documents/${previewDoc.slug}/form`}
                  onClick={() => setPreviewDoc(null)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#18A999] px-4 py-2 text-xs font-semibold text-white hover:bg-[#148C7E] transition shadow-xs"
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
