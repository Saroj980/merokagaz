'use client';

import React, { use, useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, Document, FormField, formatCurrency } from '@/lib/api';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import NepaliInput from '@/components/ui/NepaliInput';
import NepalAddressPicker from '@/components/ui/NepalAddressPicker';
import NepaliDatePicker from '@/components/ui/NepaliDatePicker';
import { formatNepaliNumber } from '@/app/api/v1/downloads/_lib/helpers';
import {
  ArrowLeft,
  ShieldCheck,
  ArrowRight,
  User,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Hash,
  CheckCircle2,
  FileText,
  Clock,
  SplitSquareVertical,
  Eye,
  SlidersHorizontal,
  Building2,
  FileCheck,
  AlertCircle,
  UserPlus,
  Trash2,
  ExternalLink,
  Check,
  Copy,
  UserCheck,
  FileEdit,
  Info,
} from 'lucide-react';

interface DocLayoutConfig {
  header?: string;
  office?: string;
  subject?: string;
  body?: string;
  declaration?: string;
  signatory?: string;
  authority?: string;
  showEmblem?: boolean;
  showWatermark?: boolean;
  paperMode?: 'full_header_footer' | 'plain_preprinted' | 'legal_deed';
  showHeader?: boolean;
  showFooter?: boolean;
  showDateRef?: boolean;
  showPageNumber?: boolean;
  topMarginMm?: number;
  bottomMarginMm?: number;
  paperSize?: 'A4' | 'Legal';
  fontFamily?: 'outfit' | 'serif';
}

function cleanPlaceholder(text?: string | null, f?: FormField, isNe: boolean = true): string {
  if (f) {
    const k = (f.key || '').toLowerCase();
    const l = ((f.label_np || '') + ' ' + (f.label || '')).toLowerCase();

    // 1. Grandfather
    if (k.includes('grandfather') || l.includes('हजुरबुबा') || l.includes('बाजेको') || l.includes("grandfather's name") || l.includes("grandfather name")) {
      return isNe ? 'हजुरबुबा (बाजे) को पूरा नाम थर यहाँ लेख्नुहोस्' : 'Enter grandfather\'s full name';
    }

    // 2. Father
    if ((k.includes('father') && !k.includes('grandfather')) || l.includes('बाबुको नाम') || l.includes('बुवाको नाम') || l.includes("father's name") || l.includes("father name")) {
      return isNe ? 'बाबुको पूरा नाम थर यहाँ लेख्नुहोस्' : 'Enter father\'s full name';
    }

    // 3. Mother
    if (k.includes('mother') || l.includes('आमाको नाम') || l.includes("mother's name")) {
      return isNe ? 'आमाको पूरा नाम थर यहाँ लेख्नुहोस्' : 'Enter mother\'s full name';
    }

    // 4. Spouse
    if (k.includes('spouse') || l.includes('पति') || l.includes('पत्नी') || l.includes("spouse's name")) {
      return isNe ? 'पति/पत्नीको पूरा नाम थर यहाँ लेख्नुहोस्' : 'Enter spouse\'s full name';
    }

    // 5. Legal Drafter / Masaudakar
    if (k.includes('masaudakar.name') || k.includes('advocate.name') || l.includes('मसौदाकार') || l.includes('अधिवक्ता')) {
      return isNe ? 'मसौदाकार / अधिवक्ताको नाम (ऐच्छिक)' : 'Legal drafter name (optional)';
    }

    // 6. Witness
    if (k.includes('witness') && (k.includes('name') || l.includes('नाम'))) {
      return isNe ? 'रोहवर साक्षीको पूरा नाम थर लेख्नुहोस्' : 'Enter witness full name';
    }

    // 7. General person / promoter / shareholder / member / applicant full name
    if (
      k.includes('full_name') ||
      k.includes('applicant_name') ||
      k.includes('promoter_name') ||
      k === 'applicant.name' ||
      (k.includes('shareholder') && (k.includes('name') || l.includes('नाम'))) ||
      (k.includes('member') && (k.includes('name') || l.includes('नाम'))) ||
      (l.includes('नाम') && !l.includes('कम्पनी') && !l.includes('कार्यालय') && !l.includes('जिल्ला') && !l.includes('स्थान') && !l.includes('फर्म') && !l.includes('व्यवसाय'))
    ) {
      if (isEnglishField(f)) {
        return 'Enter full name in English';
      }
      return isNe ? 'नागरिकता बमोजिम पूरा नाम थर' : 'Full name as per official ID';
    }
  }

  if (!text) return '';

  let cleaned = text.replace(/^(उदा[.:]?|e\.g\.?:?)\s*/i, '').trim();

  // If the placeholder is a known sample person name, replace with generic instructional text
  if (
    cleaned.includes('राम बहादुर') ||
    cleaned.includes('योगेश कम्ती') ||
    cleaned.includes('राम प्रसाद') ||
    cleaned.includes('कृष्ण कम्ती') ||
    cleaned.includes('सरोज जोशी') ||
    cleaned.includes('निराजन दत्त') ||
    cleaned.includes('सन्तोष शर्मा') ||
    cleaned.includes('समिक्षा भण्डारी') ||
    cleaned.includes('लछन कम्ती')
  ) {
    return isNe ? 'यहाँ पूरा नाम लेख्नुहोस्' : 'Enter full name';
  }

  return cleaned;
}

function toDevanagariDigits(num: number | string): string {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(num).replace(/\d/g, (d) => nepaliDigits[Number(d)]);
}

function fromDevanagariDigits(str: string): number {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return Number(str.replace(/[०-९]/g, (ch) => map[ch] || ch));
}

// Detect if a form field specifies English in its label, key, or placeholder
function isEnglishField(f: FormField): boolean {
  const k = (f.key || '').toLowerCase();
  const label = (f.label || '').toLowerCase();
  const labelNp = (f.label_np || '').toLowerCase();
  const placeholder = (f.placeholder || '').toLowerCase();

  return (
    k.endsWith('_en') ||
    k.includes('english') ||
    label.includes('english') ||
    label.includes('(in english)') ||
    label.includes('(english') ||
    label.includes('in english') ||
    labelNp.includes('अंग्रेजी') ||
    labelNp.includes('english') ||
    placeholder.includes('in english') ||
    placeholder.includes('(in english)')
  );
}

const DEFAULT_FALLBACK_FIELDS: FormField[] = [
  {
    key: 'applicant.full_name',
    type: 'text',
    label: 'Applicant Full Name',
    label_np: 'आवेदकको पूरा नाम थर',
    placeholder: 'नागरिकता बमोजिम पूरा नाम थर',
    required: true,
    options: null,
    visible_when: null,
    validation_rules: null,
    nepali_script_required: false,
    sort_order: 0,
  },
  {
    key: 'applicant.citizenship_no',
    type: 'citizenship',
    label: 'Citizenship Certificate Number',
    label_np: 'नागरिकता प्रमाणपत्र नम्बर',
    placeholder: '१२-०१-७५-०१२३४',
    required: true,
    options: null,
    visible_when: null,
    validation_rules: null,
    nepali_script_required: false,
    sort_order: 1,
  },
  {
    key: 'applicant.phone',
    type: 'phone',
    label: 'Mobile Phone Number',
    label_np: 'मोबाइल नम्बर',
    placeholder: '९८XXXXXXXX',
    required: true,
    options: null,
    visible_when: null,
    validation_rules: null,
    nepali_script_required: false,
    sort_order: 2,
  },
  {
    key: 'applicant.permanent_address',
    type: 'address',
    label: 'Permanent Address',
    label_np: 'स्थायी ठेगाना (पालिका, वडा, जिल्ला)',
    placeholder: 'काठमाडौं महानगरपालिका - १०, बागमती',
    required: true,
    options: null,
    visible_when: null,
    validation_rules: null,
    nepali_script_required: false,
    sort_order: 3,
  },
];

export default function DocumentFormPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-500">फारम लोड हुँदैछ...</div>}>
      <DocumentFormContent params={params} />
    </Suspense>
  );
}

function DocumentFormContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editOrderNo = searchParams.get('order');
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  // API State
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<Document | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [docLayout, setDocLayout] = useState<DocLayoutConfig | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [existingOrderNo, setExistingOrderNo] = useState<string | null>(editOrderNo);

  // Form State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View Mode: 'form' | 'split'
  const [viewMode, setViewMode] = useState<'form' | 'split'>('form');

  // Multi-document tab switcher for suites
  const [suiteTab, setSuiteTab] = useState<string>('app');

  // Multi-tab wizard step index for fields
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const formSectionRef = useRef<HTMLFormElement>(null);

  // Dynamic Present Members Count for Minutes & Resolutions
  const [memberCount, setMemberCount] = useState<number>(1);

  // Auth state for auto-filling from user/business profile
  const { user, businesses, isLoggedIn } = useAuth();
  const [autoFillNotice, setAutoFillNotice] = useState<string | null>(null);
  const [selectedAutoFillSource, setSelectedAutoFillSource] = useState<'individual' | number>('individual');

  // Fetch document details & schema from backend
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    const fetchPromises: Promise<any>[] = [
      api.documents.get(slug),
      api.documents.getSchema(slug),
    ];
    if (editOrderNo) {
      fetchPromises.push(api.orders.get(editOrderNo));
    }

    Promise.allSettled(fetchPromises)
      .then(([docRes, schemaRes, orderRes]) => {
        if (!isMounted) return;

        if (docRes.status === 'fulfilled' && docRes.value) {
          setDoc(docRes.value);
        } else {
          setFetchError(isNe ? 'कागजात फेला परेन।' : 'Document not found.');
        }

        let existingFormData: Record<string, string> = {};
        if (orderRes && orderRes.status === 'fulfilled' && orderRes.value) {
          const ord = orderRes.value;
          if (ord.form_data && typeof ord.form_data === 'object') {
            Object.entries(ord.form_data).forEach(([k, v]) => {
              existingFormData[k] = v !== null && v !== undefined ? String(v) : '';
            });
          }
        }

        if (schemaRes.status === 'fulfilled' && schemaRes.value) {
          const schemaData = schemaRes.value;
          let loadedFields =
            Array.isArray(schemaData.fields) && schemaData.fields.length > 0
              ? [...schemaData.fields]
              : [...DEFAULT_FALLBACK_FIELDS];

          // Check if this document is a company deed / MOA / AOA / suite
          const isCompanyDeed = slug.includes('moa') || slug.includes('aoa') || slug.includes('company') || slug.includes('suite');
          if (isCompanyDeed) {
            const hasMasaudakarName = loadedFields.some((f) => f.key === 'masaudakar.name' || f.key === 'advocate.name');
            if (!hasMasaudakarName) {
              loadedFields.push({
                key: 'masaudakar.name',
                type: 'text',
                label: 'Advocate / Legal Drafter Full Name (Optional)',
                label_np: 'मसौदाकार अधिवक्ताको पूरा नाम (ऐच्छिक)',
                placeholder: 'अधिवक्ता / मसौदाकारको पूरा नाम लेख्नुहोस् (ऐच्छिक)',
                required: false,
                options: null,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 95,
                group: 'masaudakar',
              });
            }
            const hasMasaudakarReg = loadedFields.some((f) => f.key === 'masaudakar.reg_no' || f.key === 'advocate.reg_no');
            if (!hasMasaudakarReg) {
              loadedFields.push({
                key: 'masaudakar.reg_no',
                type: 'text',
                label: 'Advocate License / Certificate No. (Optional)',
                label_np: 'अधिवक्ता प्रमाणपत्र / दर्ता नं. (प्र.प.नं. - ऐच्छिक)',
                placeholder: 'दर्ता / प्रमाणपत्र नम्बर (ऐच्छिक)',
                required: false,
                options: null,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 96,
                group: 'masaudakar',
              });
            }
          }

          // Check if this document is a meeting minutes or resolution document or compliance suite containing minutes
          const isMinutesDoc =
            slug.includes('resolution') ||
            slug.includes('minute') ||
            slug.includes('baithak') ||
            slug.includes('annual-compliance') ||
            slug.includes('agm-section51');
          if (isMinutesDoc) {
            const minutesFieldsToAdd: FormField[] = [
              {
                key: 'meeting.venue',
                type: 'text',
                label: 'Meeting Place / Venue',
                label_np: 'बैठक बसेको स्थान',
                placeholder: 'बैठक बसेको स्थान / कार्यालय',
                required: true,
                options: null,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 10,
                group: 'meeting_overview',
              },
              {
                key: 'meeting.date',
                type: 'date_bs',
                label: 'Meeting Date (BS)',
                label_np: 'बैठकको मिति (विसं)',
                placeholder: 'मिति (उदा: २०८३/०३/११)',
                required: true,
                options: null,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 11,
                group: 'meeting_overview',
              },
              {
                key: 'meeting.type',
                type: 'select',
                label: 'Meeting Structure (एकल वा बहु-सदस्य)',
                label_np: 'बैठकको स्वरूप',
                options: [
                  { label: 'एकल सञ्चालक (Single Shareholder / Director)', value: 'एकल सञ्चालक (Single Shareholder / Director)' },
                  { label: 'बहु-सञ्चालक / शेयरधनी (Multiple Shareholders / Directors)', value: 'बहु-सञ्चालक / शेयरधनी (Multiple Shareholders / Directors)' },
                ],
                placeholder: null,
                required: false,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 12,
                group: 'meeting_overview',
              },
            ];

            // Add up to 8 members dynamically
            for (let i = 1; i <= 8; i++) {
              minutesFieldsToAdd.push({
                key: `member_${i}.name`,
                type: 'text',
                label: `Member ${i} Full Name ${i === 1 ? '(Chairperson)' : '(Optional)'}`,
                label_np: `उपस्थित सदस्य ${toDevanagariDigits(i)} को पूरा नाम ${i === 1 ? '(बैठक अध्यक्ष)' : ''}`,
                placeholder: i === 1 ? 'बैठक अध्यक्षको पूरा नाम' : `सदस्य ${toDevanagariDigits(i)} को पूरा नाम`,
                required: i === 1,
                options: null,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 20 + (i * 2),
                group: 'present_members',
              });
              minutesFieldsToAdd.push({
                key: `member_${i}.designation`,
                type: 'text',
                label: `Member ${i} Designation (पद)`,
                label_np: `सदस्य ${toDevanagariDigits(i)} को पद (Designation)`,
                placeholder: i === 1 ? 'उदा: सञ्चालक / प्रोप्राइटर' : 'उदा: सञ्चालक',
                required: i === 1,
                options: null,
                visible_when: null,
                validation_rules: null,
                nepali_script_required: false,
                sort_order: 21 + (i * 2),
                group: 'present_members',
              });
            }

            if (slug.includes('annual-compliance') || slug.includes('agm-section51')) {
              minutesFieldsToAdd.push(
                {
                  key: 'bod_meeting.proposals',
                  type: 'textarea',
                  label: 'BOD Agendas / Proposals (सञ्चालक समितिका प्रस्तावहरू)',
                  label_np: 'सञ्चालक समितिका छलफलका प्रस्तावहरू (BOD Proposals)',
                  placeholder: '१. वार्षिक साधारण सभा बोलाउने सम्बन्धमा ।\n२. विविध',
                  required: false,
                  options: null,
                  visible_when: null,
                  validation_rules: null,
                  nepali_script_required: false,
                  sort_order: 30,
                  group: 'meeting_content',
                },
                {
                  key: 'bod_meeting.decisions',
                  type: 'textarea',
                  label: 'BOD Decisions (सञ्चालक समितिका निर्णयहरू)',
                  label_np: 'सञ्चालक समितिका पारित निर्णयहरू (BOD Decisions)',
                  placeholder: '१. प्रस्ताव नं. १ उपर छलफल हुँदा कम्पनी स्वीकृत नियमावलीको नियम बमोजिम कम्पनीको वार्षिक साधारण सभा निम्न मिति, समय र स्थानमा गर्ने निर्णय सर्वसम्मतीले पारित गरियो ।\n\n२. विविध प्रस्ताव उपर छलफल गर्नुपर्ने अन्य विषय बाँकी नरहेकोले संचालकको अनुमतीले आजको बैठक समाप्त गरियो ।',
                  required: false,
                  options: null,
                  visible_when: null,
                  validation_rules: null,
                  nepali_script_required: false,
                  sort_order: 31,
                  group: 'meeting_content',
                },
                {
                  key: 'agm_meeting.proposals',
                  type: 'textarea',
                  label: 'AGM Agendas / Proposals (वार्षिक साधारण सभाका प्रस्तावहरू)',
                  label_np: 'वार्षिक साधारण सभा (AGM) का छलफलका प्रस्तावहरू',
                  placeholder: '१. आ.व. को प्रगति विवरण प्रस्तुत सम्बन्धमा ।\n२. लेखा परीक्षण प्रतिवेदन अनुमोदन सम्बन्धमा ।\n३. आगामी आ.व. को लेखापरीक्षक नियुक्ति र पारिश्रमिक सम्बन्धमा ।\n४. विविध ।',
                  required: false,
                  options: null,
                  visible_when: null,
                  validation_rules: null,
                  nepali_script_required: false,
                  sort_order: 32,
                  group: 'meeting_content',
                },
                {
                  key: 'agm_meeting.decisions',
                  type: 'textarea',
                  label: 'AGM Decisions (वार्षिक साधारण सभाका निर्णयहरू)',
                  label_np: 'वार्षिक साधारण सभा (AGM) का पारित निर्णयहरू',
                  placeholder: '१. प्रस्ताव नं. १ उपर बैठकमा छलफल हुँदा प्रगति विवरण पारित गरियो ।\n२. प्रस्ताव नं. २ उपर लेखा परीक्षण प्रतिवेदनलाई पारित गरियो ।\n३. प्रस्ताव नं. ३ उपर आगामी वर्षको लेखापरीक्षक नियुक्ति गर्ने र पारिश्रमिक आपसी सहमतिबाट दिने निर्णय पारित गरियो ।\n४. विविध प्रस्ताव उपर बैठक समाप्त गरियो ।',
                  required: false,
                  options: null,
                  visible_when: null,
                  validation_rules: null,
                  nepali_script_required: false,
                  sort_order: 33,
                  group: 'meeting_content',
                }
              );
            } else {
              minutesFieldsToAdd.push(
                {
                  key: 'meeting.proposal',
                  type: 'textarea',
                  label: 'Meeting Agendas / Proposals (प्रस्ताव)',
                  label_np: 'छलफलका मुख्य प्रस्तावहरू (प्रस्ताव)',
                  placeholder: 'उदा: १. कम्पनीको काम कारवाही सम्बन्धमा ।\n२. विविध',
                  required: true,
                  options: null,
                  visible_when: null,
                  validation_rules: null,
                  nepali_script_required: false,
                  sort_order: 40,
                  group: 'meeting_content',
                },
                {
                  key: 'meeting.decisions',
                  type: 'textarea',
                  label: 'Meeting Decisions (निर्णयहरू)',
                  label_np: 'बैठकका सर्वसम्मत निर्णयहरू (निर्णय)',
                  placeholder: 'उदा: १. प्रस्ताव नं. १ उपर छलफल गर्दा सर्वसम्मत निर्णय पारित गरियो ।',
                  required: true,
                  options: null,
                  visible_when: null,
                  validation_rules: null,
                  nepali_script_required: false,
                  sort_order: 41,
                  group: 'meeting_content',
                }
              );
            }

            minutesFieldsToAdd.forEach((mf) => {
              if (!loadedFields.some((f) => f.key === mf.key)) {
                loadedFields.push(mf);
              }
            });
          }

          setFields(loadedFields);

          // Initialize form data with empty or default values
          const initialData: Record<string, string> = {};
          loadedFields.forEach((f) => {
            initialData[f.key] = '';
          });

          // If minutes doc, default to single shareholder structure and auto-pull personal info
          if (isMinutesDoc) {
            initialData['meeting.type'] = 'एकल सञ्चालक (Single Shareholder / Director)';
            setMemberCount(1);
            const personalName =
              initialData['applicant.full_name'] ||
              initialData['shareholder_1.full_name'] ||
              initialData['director.full_name'] ||
              initialData['director.md_name'] ||
              '';
            if (personalName && !initialData['member_1.name']) {
              initialData['member_1.name'] = personalName;
            }
            if (!initialData['member_1.designation']) {
              initialData['member_1.designation'] = 'सञ्चालक / प्रोप्राइटर';
            }
          }

          setFormData((prev) => {
            const merged = { ...initialData, ...existingFormData, ...prev };
            if (isMinutesDoc) {
              const curType = merged['meeting.type'] || 'एकल सञ्चालक (Single Shareholder / Director)';
              merged['meeting.type'] = curType;
              const isSingle = curType.includes('एकल') || curType.includes('Single');
              if (isSingle) {
                const pName =
                  merged['applicant.full_name'] ||
                  merged['shareholder_1.full_name'] ||
                  merged['director.full_name'] ||
                  merged['director.md_name'] ||
                  '';
                if (pName && !merged['member_1.name']) {
                  merged['member_1.name'] = pName;
                }
                if (!merged['member_1.designation']) {
                  merged['member_1.designation'] = 'सञ्चालक / प्रोप्राइटर';
                }
                setMemberCount(1);
              } else {
                // Find how many member_X fields have values
                let maxMemberIdx = 2;
                for (let i = 1; i <= 8; i++) {
                  if (merged[`member_${i}.name`] || merged[`member_${i}.designation`]) {
                    maxMemberIdx = Math.max(maxMemberIdx, i);
                  }
                }
                setMemberCount(maxMemberIdx);
              }

              if (slug.includes('annual-compliance') || slug.includes('agm-section51')) {
                if (!merged['bod_meeting.proposals']) {
                  merged['bod_meeting.proposals'] = '१. वार्षिक साधारण सभा बोलाउने सम्बन्धमा ।\n२. विविध';
                }
                if (!merged['bod_meeting.decisions']) {
                  merged['bod_meeting.decisions'] = '१. प्रस्ताव नं. १ उपर छलफल हुँदा कम्पनी स्वीकृत नियमावलीको नियम बमोजिम कम्पनीको वार्षिक साधारण सभा निम्न मिति, समय र स्थानमा गर्ने निर्णय सर्वसम्मतीले पारित गरियो ।\n\n२. विविध प्रस्ताव उपर छलफल गर्नुपर्ने अन्य विषय बाँकी नरहेकोले संचालकको अनुमतीले आजको बैठक समाप्त गरियो ।';
                }
                if (!merged['agm_meeting.proposals']) {
                  merged['agm_meeting.proposals'] = '१. आ.व. को प्रगति विवरण प्रस्तुत सम्बन्धमा ।\n२. लेखा परीक्षण प्रतिवेदन अनुमोदन सम्बन्धमा ।\n३. आगामी आ.व. को लेखापरीक्षक नियुक्ति र पारिश्रमिक सम्बन्धमा ।\n४. विविध ।';
                }
                if (!merged['agm_meeting.decisions']) {
                  merged['agm_meeting.decisions'] = '१. प्रस्ताव नं. १ उपर बैठकमा छलफल हुँदा कम्पनीको प्रगति विवरण पारित गरियो ।\n२. प्रस्ताव नं. २ उपर लेखा परीक्षण प्रतिवेदन पारित गरियो ।\n३. प्रस्ताव नं. ३ उपर आगामी वर्षको लेखापरीक्षक नियुक्ति र पारिश्रमिक आपसी सहमतिबाट दिने निर्णय पारित गरियो ।\n४. विविध प्रस्ताव उपर बैठक समाप्त गरियो ।';
                }
              }
            }
            return merged;
          });

          // Save doc_layout for live preview
          const layout = (schemaData as any)?.form_schema?.doc_layout;
          if (layout) {
            setDocLayout({
              ...layout,
              showHeader: layout.showHeader !== undefined ? Boolean(layout.showHeader) : true,
              showFooter: layout.showFooter !== undefined ? Boolean(layout.showFooter) : true,
              showDateRef: layout.showDateRef !== undefined ? Boolean(layout.showDateRef) : true,
              showWatermark: Boolean(layout.showWatermark),
            });
          }
        } else {
          // Fallback fields if no schema published yet
          setFields(DEFAULT_FALLBACK_FIELDS);
          const initialData: Record<string, string> = {};
          DEFAULT_FALLBACK_FIELDS.forEach((f) => {
            initialData[f.key] = '';
          });
          setFormData((prev) => ({ ...initialData, ...existingFormData, ...prev }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load form');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug, isNe]);

  // Logical Grouping for Form Fields (Hook at top level - Rules of Hooks)
  interface FieldGroup {
    id: string;
    titleEn: string;
    titleNe: string;
    subtitleEn: string;
    subtitleNe: string;
    icon: React.ReactNode;
    fields: FormField[];
  }

  const fieldGroups: FieldGroup[] = useMemo(() => {
    if (!fields.length) return [];

    const personalFields: FormField[] = [];
    const addressFields: FormField[] = [];
    const familyFields: FormField[] = [];
    const masaudakarFields: FormField[] = [];
    const meetingOverviewFields: FormField[] = [];
    const presentMemberFields: FormField[] = [];
    const meetingContentFields: FormField[] = [];
    const additionalFields: FormField[] = [];

    fields.forEach((f) => {
      const k = (f.key || '').toLowerCase();
      const l = (f.label || '').toLowerCase();
      const grp = (f.group || '').toLowerCase();

      if (
        grp === 'meeting_overview' ||
        k.startsWith('meeting.venue') ||
        k.startsWith('meeting.place') ||
        k.startsWith('meeting.date') ||
        k.startsWith('meeting.type') ||
        k.startsWith('meeting.time') ||
        k.includes('venue')
      ) {
        meetingOverviewFields.push(f);
      } else if (
        grp === 'present_members' ||
        grp === 'members' ||
        k.startsWith('member_') ||
        k.includes('designation') ||
        k.includes('chairperson') ||
        l.includes('उपस्थित') ||
        l.includes('पद')
      ) {
        presentMemberFields.push(f);
      } else if (
        grp === 'meeting_content' ||
        k.startsWith('meeting.proposal') ||
        k.startsWith('meeting.decision') ||
        k.startsWith('meeting.agenda') ||
        k.startsWith('meeting.objective') ||
        l.includes('प्रस्ताव') ||
        l.includes('निर्णय')
      ) {
        meetingContentFields.push(f);
      } else if (
        grp === 'masaudakar' ||
        grp === 'masaudakar_info' ||
        k.includes('masaudakar') ||
        k.includes('advocate') ||
        l.includes('मसौदाकार') ||
        l.includes('अधिवक्ता')
      ) {
        masaudakarFields.push(f);
      } else if (
        grp === 'address' ||
        f.type === 'address' ||
        k.includes('address') ||
        l.includes('address') ||
        l.includes('ठेगाना')
      ) {
        addressFields.push(f);
      } else if (
        grp === 'family' ||
        k.includes('father') ||
        k.includes('mother') ||
        k.includes('grandfather') ||
        k.includes('spouse') ||
        l.includes('father') ||
        l.includes('mother') ||
        l.includes('बाबु') ||
        l.includes('आमा') ||
        l.includes('हजुरबुबा') ||
        l.includes('पति') ||
        l.includes('पत्नी')
      ) {
        familyFields.push(f);
      } else if (
        grp === 'personal' ||
        k.includes('name') ||
        k.includes('phone') ||
        k.includes('mobile') ||
        k.includes('email') ||
        k.includes('citizen') ||
        k.includes('nid') ||
        k.includes('dob') ||
        k.includes('gender') ||
        l.includes('name') ||
        l.includes('नाम')
      ) {
        personalFields.push(f);
      } else {
        additionalFields.push(f);
      }
    });

    const groups: FieldGroup[] = [];

    if (personalFields.length > 0) {
      groups.push({
        id: 'personal',
        titleEn: 'Personal Information',
        titleNe: 'व्यक्तिगत विवरण',
        subtitleEn: 'Applicant identity, contact, and official identification',
        subtitleNe: 'निवेदकको परिचय, सम्पर्क तथा नागरिकता/परिचयपत्र विवरण',
        icon: <User className="h-4 w-4 text-[#18A999]" />,
        fields: personalFields,
      });
    }

    if (meetingOverviewFields.length > 0) {
      groups.push({
        id: 'meeting_overview',
        titleEn: 'Meeting Overview (Place & Date)',
        titleNe: 'बैठकको विवरण (स्थान, मिति र स्वरूप)',
        subtitleEn: 'Specify the meeting location, Bikram Sambat date, and single or multi-member structure.',
        subtitleNe: 'बैठक बसेको स्थान (कम्पनीको कार्यालय), मिति तथा एकल वा बहु-सदस्यीय स्वरूप चयन गर्नुहोस्।',
        icon: <Calendar className="h-4 w-4 text-[#18A999]" />,
        fields: meetingOverviewFields,
      });
    }

    if (presentMemberFields.length > 0) {
      // Only include members up to memberCount
      const visibleMembers = presentMemberFields.filter((f) => {
        const match = f.key.match(/^member_(\d+)\./);
        if (match) {
          const idx = parseInt(match[1], 10);
          return idx <= memberCount;
        }
        return true;
      });

      groups.push({
        id: 'present_members',
        titleEn: 'Present Members & Designations',
        titleNe: 'उपस्थित सदस्यहरू तथा पद (Designations)',
        subtitleEn: 'Members present in the meeting with their official designations (e.g. Director / Proprietor, Chairman, MD).',
        subtitleNe: 'बैठकमा उपस्थित सदस्यहरूको नाम तथा पद (उदा: सञ्चालक / प्रोप्राइटर, अध्यक्ष, प्रबन्ध सञ्चालक, शेयरधनी)।',
        icon: <Users className="h-4 w-4 text-[#18A999]" />,
        fields: visibleMembers,
      });
    }

    if (meetingContentFields.length > 0) {
      groups.push({
        id: 'meeting_content',
        titleEn: 'Meeting Agendas & Decisions',
        titleNe: 'छलफलका प्रस्ताव तथा पारित निर्णयहरू',
        subtitleEn: 'Official proposals discussed and unanimous decisions passed in the meeting.',
        subtitleNe: 'बैठकमा छलफलका लागि पेस भएका मुख्य प्रस्ताव र सर्वसम्मत पारित गरिएका निर्णयहरू।',
        icon: <FileCheck className="h-4 w-4 text-[#18A999]" />,
        fields: meetingContentFields,
      });
    }

    if (familyFields.length > 0) {
      groups.push({
        id: 'family',
        titleEn: 'Family & Guardian Details',
        titleNe: 'पारिवारिक विवरण',
        subtitleEn: 'Father, mother, spouse, and guardian details as per citizenship',
        subtitleNe: 'नागरिकता बमोजिम बाबु, आमा, हजुरबुबा तथा संरक्षकको विवरण',
        icon: <Users className="h-4 w-4 text-[#18A999]" />,
        fields: familyFields,
      });
    }

    if (addressFields.length > 0) {
      groups.push({
        id: 'address',
        titleEn: 'Official Address Hierarchy',
        titleNe: 'ठेगाना सम्बन्धी विवरण',
        subtitleEn: 'Permanent and temporary residential administrative location',
        subtitleNe: 'स्थायी तथा हाल बसोबास रहेको स्थानीय तह, वडा र टोल विवरण',
        icon: <MapPin className="h-4 w-4 text-[#18A999]" />,
        fields: addressFields,
      });
    }

    if (additionalFields.length > 0) {
      groups.push({
        id: 'additional',
        titleEn: 'Additional Requirements',
        titleNe: 'थप आवश्यक विवरण',
        subtitleEn: 'Other specific document parameters and supplementary info',
        subtitleNe: 'कागजात सम्बन्धी थप आवश्यक जानकारी',
        icon: <FileText className="h-4 w-4 text-[#18A999]" />,
        fields: additionalFields,
      });
    }

    if (masaudakarFields.length > 0) {
      groups.push({
        id: 'masaudakar',
        titleEn: 'Legal Drafter / Advocate (Optional)',
        titleNe: 'मसौदाकार / अधिवक्ताको विवरण (ऐच्छिक)',
        subtitleEn: 'If entered, displayed in the official signature block. If blank, official dotted lines (....) will be generated.',
        subtitleNe: 'विवरण भरेमा मस्यौदाको हस्ताक्षर महलमा देखिनेछ; खाली छाडेमा मस्यौदामा हस्ताक्षरका लागि डट डट (....) आउनेछ।',
        icon: <ShieldCheck className="h-4 w-4 text-[#18A999]" />,
        fields: masaudakarFields,
      });
    }

    if (groups.length === 0) {
      groups.push({
        id: 'general',
        titleEn: 'Application Details',
        titleNe: 'आवश्यक विवरण भर्नुहोस्',
        subtitleEn: 'These details are populated directly into your verified document.',
        subtitleNe: 'तपाईंले भरेका विवरणहरू सोझै आधिकारिक कागजातमा तयार हुनेछ।',
        icon: <FileText className="h-4 w-4 text-[#18A999]" />,
        fields: fields,
      });
    }

    return groups;
  }, [fields, memberCount]);

  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      // 1. Company Registered Address auto-propagate to Shareholder 1, Witness, Director
      if (key === 'company.registered_address') {
        const oldComp = prev['company.registered_address'] || '';
        if (!prev['shareholder_1.address'] || prev['shareholder_1.address'] === oldComp) {
          next['shareholder_1.address'] = value;
        }
        if (!prev['director.address'] || prev['director.address'] === oldComp) {
          next['director.address'] = value;
        }
        if (!prev['witness.address'] || prev['witness.address'] === oldComp) {
          next['witness.address'] = value;
        }
      }

      // 2. MD / Director <-> Shareholder 1 two-way sync
      if (key === 'shareholder_1.full_name') {
        if (!prev['director.md_name'] || prev['director.md_name'] === prev['shareholder_1.full_name']) {
          next['director.md_name'] = value;
        }
        if (!prev['director.full_name'] || prev['director.full_name'] === prev['shareholder_1.full_name']) {
          next['director.full_name'] = value;
        }
      } else if (key === 'director.md_name' || key === 'director.full_name') {
        if (!prev['shareholder_1.full_name'] || prev['shareholder_1.full_name'] === prev[key]) {
          next['shareholder_1.full_name'] = value;
        }
      }

      // Father Name sync
      if (key === 'shareholder_1.father_name') {
        if (!prev['director.father_name'] || prev['director.father_name'] === prev['shareholder_1.father_name']) {
          next['director.father_name'] = value;
        }
      } else if (key === 'director.father_name') {
        if (!prev['shareholder_1.father_name'] || prev['shareholder_1.father_name'] === prev['director.father_name']) {
          next['shareholder_1.father_name'] = value;
        }
      }

      // Citizenship No sync & District auto-detection
      if (key === 'shareholder_1.citizenship_no') {
        if (!prev['director.citizenship_no'] || prev['director.citizenship_no'] === prev['shareholder_1.citizenship_no']) {
          next['director.citizenship_no'] = value;
        }
        if (value.includes(',') || value.includes('/')) {
          const parts = value.split(/[,/]/);
          const possibleDistrict = parts[parts.length - 1].trim();
          if (possibleDistrict && !prev['shareholder_1.citizenship_district']) {
            next['shareholder_1.citizenship_district'] = possibleDistrict;
          }
        }
      } else if (key === 'director.citizenship_no') {
        if (!prev['shareholder_1.citizenship_no'] || prev['shareholder_1.citizenship_no'] === prev['director.citizenship_no']) {
          next['shareholder_1.citizenship_no'] = value;
        }
        if (value.includes(',') || value.includes('/')) {
          const parts = value.split(/[,/]/);
          const possibleDistrict = parts[parts.length - 1].trim();
          if (possibleDistrict && !prev['director.citizenship_district']) {
            next['director.citizenship_district'] = possibleDistrict;
          }
        }
      }

      // Address sync between Shareholder 1 and Director
      if (key === 'shareholder_1.address') {
        if (!prev['director.address'] || prev['director.address'] === prev['shareholder_1.address']) {
          next['director.address'] = value;
        }
        if (!prev['witness.address']) {
          next['witness.address'] = value;
        }
      } else if (key === 'director.address') {
        if (!prev['shareholder_1.address'] || prev['shareholder_1.address'] === prev['director.address']) {
          next['shareholder_1.address'] = value;
        }
      }

      // 3. Capital structure smart auto-fill
      if (key === 'capital.authorized') {
        if (!prev['capital.issued'] || prev['capital.issued'] === prev['capital.authorized']) {
          next['capital.issued'] = value;
        }
        if (!prev['capital.paid_up'] || prev['capital.paid_up'] === prev['capital.authorized']) {
          next['capital.paid_up'] = value;
        }
      }
      if (key === 'capital.total_shares') {
        if (!prev['capital.issued_shares'] || prev['capital.issued_shares'] === prev['capital.total_shares']) {
          next['capital.issued_shares'] = value;
        }
        if (!prev['shareholder_1.shares'] || prev['shareholder_1.shares'] === prev['capital.total_shares']) {
          next['shareholder_1.shares'] = value;
        }
      }

      // 4. Meeting Structure (Single vs Multi) and Present Members auto-sync
      if (key === 'meeting.type') {
        const isSingle = value.includes('एकल') || value.includes('Single');
        if (isSingle) {
          setMemberCount(1);
          const personalName =
            next['applicant.full_name'] ||
            next['shareholder_1.full_name'] ||
            next['director.full_name'] ||
            next['director.md_name'] ||
            '';
          if (personalName) {
            next['member_1.name'] = personalName;
          }
          if (!next['member_1.designation'] || next['member_1.designation'] === 'अध्यक्ष') {
            next['member_1.designation'] = 'सञ्चालक / प्रोप्राइटर';
          }
          // Clean up subsequent members
          for (let m = 2; m <= 8; m++) {
            delete next[`member_${m}.name`];
            delete next[`member_${m}.designation`];
          }
        } else {
          setMemberCount((c) => Math.max(2, c));
          if (!next['member_1.designation'] || next['member_1.designation'] === 'सञ्चालक / प्रोप्राइटर') {
            next['member_1.designation'] = 'अध्यक्ष';
          }
          if (!next['member_2.designation']) {
            next['member_2.designation'] = 'सञ्चालक';
          }
        }
      }

      // 5. If Single Meeting Structure: auto-sync personal name into Member 1
      const currentMeetingType = next['meeting.type'] || prev['meeting.type'] || 'एकल';
      const isSingleMeeting = currentMeetingType.includes('एकल') || currentMeetingType.includes('Single');
      if (
        isSingleMeeting &&
        (key === 'applicant.full_name' ||
         key === 'shareholder_1.full_name' ||
         key === 'director.full_name' ||
         key === 'director.md_name')
      ) {
        if (!next['member_1.name'] || next['member_1.name'] === prev[key] || next['member_1.name'] === prev['applicant.full_name']) {
          next['member_1.name'] = value;
        }
        if (!next['member_1.designation']) {
          next['member_1.designation'] = 'सञ्चालक / प्रोप्राइटर';
        }
      }

      return next;
    });

    // Clear error for field once typed
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleAddMember() {
    if (memberCount >= 8) return;
    const newCount = memberCount + 1;
    setMemberCount(newCount);
    setFormData((prev) => {
      const next = { ...prev };
      // Switch meeting structure to multi if it was single
      const curType = prev['meeting.type'] || '';
      if (!curType || curType.includes('एकल') || curType.includes('Single')) {
        next['meeting.type'] = 'बहु-सञ्चालक / शेयरधनी (Multiple Shareholders / Directors)';
        if (!next['member_1.designation'] || next['member_1.designation'] === 'सञ्चालक / प्रोप्राइटर') {
          next['member_1.designation'] = 'अध्यक्ष';
        }
      }
      if (!next[`member_${newCount}.designation`]) {
        next[`member_${newCount}.designation`] = 'सञ्चालक';
      }
      return next;
    });
  }

  function handleRemoveMember(removeIdx: number) {
    if (memberCount <= 1) return;
    setFormData((prev) => {
      const next = { ...prev };
      // Shift any members after removeIdx down by 1
      for (let i = removeIdx; i < memberCount; i++) {
        next[`member_${i}.name`] = prev[`member_${i + 1}.name`] || '';
        next[`member_${i}.designation`] = prev[`member_${i + 1}.designation`] || '';
      }
      delete next[`member_${memberCount}.name`];
      delete next[`member_${memberCount}.designation`];
      return next;
    });
    setMemberCount((c) => Math.max(1, c - 1));
  }

  function handleNumberedTextareaKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    fieldKey: string,
    currentVal: string
  ) {
    if (e.key !== 'Enter' || e.shiftKey) return;

    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;
    const textBefore = currentVal.substring(0, cursorPos);
    const textAfter = currentVal.substring(cursorPos);

    const lines = textBefore.split('\n');
    const currentLine = lines[lines.length - 1];

    // Detect if current line starts with Devanagari or Arabic digits: "१. ", "२. ", "1. ", "१) "
    const match = currentLine.match(/^([०-९0-9]+)(\.|\)|\-)\s*(.*)$/);

    if (match) {
      e.preventDefault();
      const rawNum = match[1];
      const delimiter = match[2] || '.';
      const lineContent = match[3];

      // If current line has no content (user pressed Enter on empty "२. ")
      // Cleanly remove number prefix to exit list
      if (!lineContent.trim()) {
        const trimmedBefore = textBefore.slice(0, textBefore.length - currentLine.length);
        const updatedVal = trimmedBefore + textAfter;
        handleFieldChange(fieldKey, updatedVal);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = trimmedBefore.length;
        }, 0);
        return;
      }

      // Increment number
      const isDevanagari = /[०-९]/.test(rawNum);
      const currNum = isDevanagari ? fromDevanagariDigits(rawNum) : parseInt(rawNum, 10);
      const nextNum = currNum + 1;
      const nextPrefix = isDevanagari
        ? `${toDevanagariDigits(nextNum)}${delimiter} `
        : `${nextNum}${delimiter} `;

      const updatedVal = textBefore + '\n' + nextPrefix + textAfter;
      handleFieldChange(fieldKey, updatedVal);

      const nextPos = cursorPos + 1 + nextPrefix.length;
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = nextPos;
      }, 0);
    } else if (!currentVal.trim() || currentLine.trim() === '') {
      // Empty or start of text, initiate list with १.
      e.preventDefault();
      const prefix = '१. ';
      const updatedVal = textBefore + (textBefore.length > 0 && !textBefore.endsWith('\n') ? '\n' : '') + prefix + textAfter;
      handleFieldChange(fieldKey, updatedVal);
      const nextPos = cursorPos + prefix.length + (textBefore.length > 0 && !textBefore.endsWith('\n') ? 1 : 0);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = nextPos;
      }, 0);
    } else {
      // Check if previous line had a number
      const allLines = textBefore.split('\n');
      let lastNumber = 0;
      let foundDevanagari = true;
      for (const l of allLines) {
        const m = l.match(/^([०-९0-9]+)(\.|\)|\-)/);
        if (m) {
          foundDevanagari = /[०-९]/.test(m[1]);
          lastNumber = foundDevanagari ? fromDevanagariDigits(m[1]) : parseInt(m[1], 10);
        }
      }
      if (lastNumber > 0) {
        e.preventDefault();
        const nextNum = lastNumber + 1;
        const nextPrefix = foundDevanagari
          ? `${toDevanagariDigits(nextNum)}. `
          : `${nextNum}. `;
        const updatedVal = textBefore + '\n' + nextPrefix + textAfter;
        handleFieldChange(fieldKey, updatedVal);
        const nextPos = cursorPos + 1 + nextPrefix.length;
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = nextPos;
        }, 0);
      }
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    fields.forEach((f) => {
      const val = (formData[f.key] || '').trim();

      if (f.required && !val) {
        errors[f.key] = isNe
          ? `${f.label_np || f.label} भर्न अनिवार्य छ।`
          : `${f.label || f.key} is required.`;
        return;
      }

      // Specific validations if value is provided
      if (val) {
        if (f.type === 'phone' || f.key.includes('phone') || f.key.includes('mobile')) {
          const cleanPhone = val.replace(/[\s-]/g, '');
          if (!/^9[678]\d{8}$/.test(cleanPhone)) {
            errors[f.key] = isNe
              ? 'वैध नेपाली मोबाइल नम्बर (९८XXXXXXXX) आवश्यक छ।'
              : 'Valid 10-digit Nepali mobile number (98XXXXXXXX) required.';
          }
        } else if (f.type === 'email' || f.key.includes('email')) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            errors[f.key] = isNe ? 'वैध ईमेल ठेगाना हुनुपर्छ।' : 'Valid email address required.';
          }
        }
      }
    });

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const errorGroupIdx = fieldGroups.findIndex((g) =>
        g.fields.some((f) => f.key === firstErrorKey)
      );
      if (errorGroupIdx !== -1) {
        setActiveTabIndex(errorGroupIdx);
      }
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      const firstError = Object.values(fieldErrors)[0];
      setSubmitError(firstError || (isNe ? 'कृपया सबै अनिवार्य फिल्डहरू शुद्ध रूपमा भर्नुहोस्।' : 'Please fill all required fields accurately.'));
      return;
    }

    setSubmitting(true);
    try {
      if (editOrderNo) {
        // Updating existing order details
        await api.orders.updateFormData(editOrderNo, formData);
        setSaveSuccess(true);
        setTimeout(() => {
          router.push(`/checkout?order=${editOrderNo}`);
        }, 500);
      } else {
        // Creating new order
        const order = await api.orders.create({
          document_slug: slug,
          form_data: formData,
        });

        router.push(`/checkout?order=${order.public_order_no}`);
      }
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : isNe
          ? 'विवरण सेभ गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।'
          : 'Failed to save details. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Automatically populate form fields from logged-in user's individual or business profile
  function handleAutoFill(source: 'individual' | number) {
    if (!user) return;

    let filledCount = 0;
    const updated = { ...formData };
    let sourceName = user.name || (isNe ? 'व्यक्तिगत प्रोफाइल' : 'Personal Profile');

    if (source === 'individual') {
      const fullAddr = [
        user.tole,
        user.municipality ? (user.ward ? `${user.municipality} - ${user.ward}` : user.municipality) : '',
        user.district,
        user.province,
      ].filter(Boolean).join(', ');

      fields.forEach((f) => {
        const k = (f.key || '').toLowerCase();
        const l = ((f.label_np || '') + ' ' + (f.label || '')).toLowerCase();

        // 1. Name
        if ((k.includes('full_name') || k.includes('applicant_name') || k === 'applicant.name' || k.includes('promoter_1.full_name') || k.includes('shareholder_1.full_name') || l.includes('full name') || l.includes('पूरा नाम') || l.includes('निवेदकको नाम') || l.includes('शेयरधनीको पूरा नाम') || l.includes('संस्थापकको पूरा नाम')) && user.name) {
          updated[f.key] = user.name;
          filledCount++;
        }
        // 2. Phone
        else if ((k.includes('phone') || k.includes('mobile') || l.includes('phone') || l.includes('फोन') || l.includes('मोबाइल')) && user.phone) {
          updated[f.key] = user.phone;
          filledCount++;
        }
        // 3. Email
        else if ((k.includes('email') || l.includes('email') || l.includes('इमेल')) && user.email) {
          updated[f.key] = user.email;
          filledCount++;
        }
        // 4. Gender
        else if ((k.includes('gender') || l.includes('gender') || l.includes('लिङ्ग')) && user.gender) {
          updated[f.key] = user.gender;
          filledCount++;
        }
        // 5. Full Address
        else if ((f.type === 'address' || k.includes('permanent_address') || k.includes('address') || l.includes('स्थायी ठेगाना') || l.includes('ठेगाना')) && fullAddr) {
          updated[f.key] = fullAddr;
          filledCount++;
        }
        // 6. Province
        else if ((k.includes('province') || k.includes('pradesh') || l.includes('प्रदेश')) && user.province) {
          updated[f.key] = user.province;
          filledCount++;
        }
        // 7. District
        else if ((k.includes('district') || k.includes('jilla') || l.includes('जिल्ला')) && user.district) {
          updated[f.key] = user.district;
          filledCount++;
        }
        // 8. Municipality
        else if ((k.includes('municipality') || k.includes('palika') || l.includes('नगरपालिका') || l.includes('पालिका')) && user.municipality) {
          updated[f.key] = user.municipality;
          filledCount++;
        }
        // 9. Ward
        else if ((k.includes('ward') || l.includes('वडा')) && user.ward) {
          updated[f.key] = user.ward;
          filledCount++;
        }
        // 10. Tole
        else if ((k.includes('tole') || l.includes('टोल')) && user.tole) {
          updated[f.key] = user.tole;
          filledCount++;
        }
        // 11. Citizenship No
        else if ((k.includes('citizenship') || k.includes('nagrikta') || l.includes('नागरिकता नं') || l.includes('नागरिकता नम्बर')) && user.citizenship_no) {
          updated[f.key] = user.citizenship_no;
          filledCount++;
        }
        // 12. Citizenship Issued District
        else if ((k.includes('citizenship_issued_district') || l.includes('नागरिकता जारी जिल्ला') || l.includes('जारी जिल्ला')) && user.citizenship_issued_district) {
          updated[f.key] = user.citizenship_issued_district;
          filledCount++;
        }
        // 13. Citizenship Issued Date
        else if ((k.includes('citizenship_issued_date') || k.includes('issued_date') || l.includes('जारी मिति')) && user.citizenship_issued_date) {
          updated[f.key] = user.citizenship_issued_date;
          filledCount++;
        }
        // 14. Grandfather Name (must be checked BEFORE father, because "grandfather" contains "father" substring!)
        else if ((k.includes('grandfather') || l.includes('हजुरबुबा') || l.includes('बाजेको नाम')) && user.grandfather_name) {
          updated[f.key] = user.grandfather_name;
          filledCount++;
        }
        // 15. Father Name
        else if (((k.includes('father') && !k.includes('grandfather')) || l.includes('बाबुको नाम') || l.includes('बुवाको नाम')) && user.father_name) {
          updated[f.key] = user.father_name;
          filledCount++;
        }
        // 16. Mother Name
        else if ((k.includes('mother') || l.includes('आमाको नाम')) && user.mother_name) {
          updated[f.key] = user.mother_name;
          filledCount++;
        }
        // 17. Spouse Name
        else if ((k.includes('spouse') || l.includes('पति') || l.includes('पत्नी')) && user.spouse_name) {
          updated[f.key] = user.spouse_name;
          filledCount++;
        }
        // 18. PAN
        else if ((k.includes('pan') || l.includes('प्यान')) && user.pan_number) {
          updated[f.key] = user.pan_number;
          filledCount++;
        }
      });
    } else {
      // Business profile source
      const biz = businesses?.find((b) => b.id === source);
      if (biz) {
        sourceName = biz.name;
        const fullBizAddr = [
          biz.tole,
          biz.municipality ? (biz.ward ? `${biz.municipality} - ${biz.ward}` : biz.municipality) : '',
          biz.district,
          biz.province,
        ].filter(Boolean).join(', ');

        fields.forEach((f) => {
          const k = (f.key || '').toLowerCase();
          const l = ((f.label_np || '') + ' ' + (f.label || '')).toLowerCase();

          // Company Name
          if ((k.includes('company_name') || k.includes('firm_name') || k.includes('business_name') || k === 'company.name_np' || k === 'company.name_en' || l.includes('company name') || l.includes('कम्पनीको नाम') || l.includes('फर्मको नाम') || l.includes('व्यवसायको नाम') || l.includes('प्रस्तावित कम्पनीको नाम')) && biz.name) {
            updated[f.key] = biz.name;
            filledCount++;
          }
          // Company Reg No
          else if ((k.includes('registration_no') || k.includes('company_reg') || k.includes('reg_no') || l.includes('दर्ता नं') || l.includes('दर्ता नम्बर')) && biz.registration_number) {
            updated[f.key] = biz.registration_number;
            filledCount++;
          }
          // Company Reg Date BS
          else if ((k.includes('registered_date') || l.includes('दर्ता मिति')) && biz.registered_date_bs) {
            updated[f.key] = biz.registered_date_bs;
            filledCount++;
          }
          // PAN / VAT
          else if ((k.includes('pan') || k.includes('vat') || l.includes('प्यान') || l.includes('भ्याट')) && biz.pan_vat_number) {
            updated[f.key] = biz.pan_vat_number;
            filledCount++;
          }
          // Company Email
          else if ((k.includes('email') || l.includes('इमेल')) && biz.email) {
            updated[f.key] = biz.email;
            filledCount++;
          }
          // Company Phone
          else if ((k.includes('phone') || k.includes('telephone') || l.includes('फोन') || l.includes('टेलिफोन')) && biz.phone) {
            updated[f.key] = biz.phone;
            filledCount++;
          }
          // Company Address
          else if ((f.type === 'address' || k.includes('registered_address') || k.includes('address') || l.includes('ठेगाना') || l.includes('कार्यालय')) && fullBizAddr) {
            updated[f.key] = fullBizAddr;
            filledCount++;
          }
          // Business Type
          else if ((k.includes('business_type') || l.includes('कारोबारको प्रकृति') || l.includes('व्यवसायको प्रकार')) && biz.business_type) {
            updated[f.key] = biz.business_type;
            filledCount++;
          }
          // Province
          else if ((k.includes('company.province') || k.includes('province') || k.includes('pradesh') || l.includes('प्रदेश')) && biz.province) {
            updated[f.key] = biz.province;
            filledCount++;
          }
          // District
          else if ((k.includes('company.district') || k.includes('district') || k.includes('jilla') || l.includes('जिल्ला')) && biz.district) {
            updated[f.key] = biz.district;
            filledCount++;
          }
          // Municipality
          else if ((k.includes('company.municipality') || k.includes('municipality') || k.includes('palika') || l.includes('नगरपालिका') || l.includes('पालिका')) && biz.municipality) {
            updated[f.key] = biz.municipality;
            filledCount++;
          }
          // Ward
          else if ((k.includes('company.ward') || k.includes('ward') || l.includes('वडा')) && biz.ward) {
            updated[f.key] = biz.ward;
            filledCount++;
          }
          // Tole
          else if ((k.includes('company.tole') || k.includes('tole') || l.includes('टोल')) && biz.tole) {
            updated[f.key] = biz.tole;
            filledCount++;
          }
          // Signatory Name
          else if ((k.includes('signatory') || k.includes('applicant.name') || k.includes('applicant_name') || l.includes('हस्ताक्षरकर्ता') || l.includes('अख्तियार प्राप्त')) && biz.authorized_signatory_name) {
            updated[f.key] = biz.authorized_signatory_name;
            filledCount++;
          }
          // Signatory Designation
          else if ((k.includes('designation') || l.includes('पद')) && biz.authorized_signatory_designation) {
            updated[f.key] = biz.authorized_signatory_designation;
            filledCount++;
          }
          // Authorized Capital
          else if ((k.includes('capital.authorized') || k.includes('authorized_capital') || l.includes('अधिकृत पूँजी')) && biz.authorized_capital) {
            updated[f.key] = biz.authorized_capital;
            filledCount++;
          }
          // Issued Capital
          else if ((k.includes('capital.issued') || k.includes('issued_capital') || l.includes('जारी पूँजी')) && biz.issued_capital) {
            updated[f.key] = biz.issued_capital;
            filledCount++;
          }
          // Paid-up Capital
          else if ((k.includes('capital.paid_up') || k.includes('paid_up_capital') || l.includes('चुक्ता पूँजी')) && biz.paid_up_capital) {
            updated[f.key] = biz.paid_up_capital;
            filledCount++;
          }
        });

        // If directors exist, fill shareholder 1 and shareholder 2!
        if (biz.directors && biz.directors.length > 0) {
          const d1 = biz.directors[0];
          fields.forEach((f) => {
            const k = f.key.toLowerCase();
            if (k.includes('shareholder_1.full_name') || k.includes('shareholder1.name') || k.includes('director1.name') || k.includes('promoter_1.full_name') || k.includes('member_1.name')) {
              if (d1.name) { updated[f.key] = d1.name; filledCount++; }
            } else if (k.includes('shareholder_1.citizenship') || k.includes('shareholder1.citizenship') || k.includes('director1.citizenship')) {
              if (d1.citizenship_no) { updated[f.key] = d1.citizenship_no; filledCount++; }
            } else if (k.includes('shareholder_1.address') || k.includes('shareholder1.address') || k.includes('director1.address')) {
              if (d1.address) { updated[f.key] = d1.address; filledCount++; }
            } else if (k.includes('shareholder_1.shares') || k.includes('shareholder1.share') || k.includes('director1.share')) {
              if (d1.share_percent) { updated[f.key] = String(d1.share_percent); filledCount++; }
            } else if (k.includes('shareholder_1.phone') || k.includes('director1.phone')) {
              if (d1.phone) { updated[f.key] = d1.phone; filledCount++; }
            }
          });

          if (biz.directors.length > 1) {
            const d2 = biz.directors[1];
            fields.forEach((f) => {
              const k = f.key.toLowerCase();
              if (k.includes('shareholder_2.full_name') || k.includes('shareholder2.name') || k.includes('director2.name') || k.includes('promoter_2.full_name') || k.includes('member_2.name')) {
                if (d2.name) { updated[f.key] = d2.name; filledCount++; }
              } else if (k.includes('shareholder_2.citizenship') || k.includes('shareholder2.citizenship') || k.includes('director2.citizenship')) {
                if (d2.citizenship_no) { updated[f.key] = d2.citizenship_no; filledCount++; }
              } else if (k.includes('shareholder_2.address') || k.includes('shareholder2.address') || k.includes('director2.address')) {
                if (d2.address) { updated[f.key] = d2.address; filledCount++; }
              } else if (k.includes('shareholder_2.shares') || k.includes('shareholder2.share') || k.includes('director2.share')) {
                if (d2.share_percent) { updated[f.key] = String(d2.share_percent); filledCount++; }
              } else if (k.includes('shareholder_2.phone') || k.includes('director2.phone')) {
                if (d2.phone) { updated[f.key] = d2.phone; filledCount++; }
              }
            });
          }
        }
      }
    }

    setFormData(updated);
    setAutoFillNotice(
      isNe
        ? `"${sourceName}" बाट ${filledCount} वटा विवरण फारममा स्वतः भरिएका छन्!`
        : `${filledCount} field(s) auto-filled from "${sourceName}"!`
    );
    setTimeout(() => setAutoFillNotice(null), 5000);
  }

  // Automatically populate all form fields with rich, context-aware Nepali sample data
  function handleFillDummyData() {
    const dummy: Record<string, string> = { ...formData };

    fields.forEach((field) => {
      const k = (field.key || '').toLowerCase();
      const l = ((field.label_np || '') + ' ' + (field.label || '')).toLowerCase();

      if (k === 'company.name_np' || l.includes('कम्पनीको नाम (नेपाली') || l.includes('प्रस्तावित कम्पनी')) {
        dummy[field.key] = 'मेक्सटेक इनोभेसन प्राइभेट लिमिटेड';
      } else if (k === 'company.name_en' || l.includes('company name') || l.includes('अंग्रेजीमा')) {
        dummy[field.key] = 'MaxTech Innovations Pvt. Ltd.';
      } else if (k === 'company.registered_address' || l.includes('रजिष्टर्ड कार्यालय')) {
        dummy[field.key] = 'काठमाडौं महानगरपालिका वडा नं. १०, बागमती प्रदेश';
      } else if (k === 'company.business_type' || l.includes('व्यवसाय वा कारोबारको प्रकृति')) {
        dummy[field.key] = 'सूचना प्रविधि, सफ्टवेयर विकास तथा परामर्श सेवा';
      } else if (k === 'company.main_objectives' || l.includes('उद्देश्यहरू')) {
        dummy[field.key] = '१. सूचना प्रविधि सम्बन्धी सफ्टवेयर निर्माण, वेबसाइट तथा मोबाइल एप्लिकेसन डिजाइन गर्ने।\n२. डिजिटल मार्केटिङ तथा क्लाउड कम्प्युटिङ सम्बन्धी परामर्श सेवा प्रदान गर्ने।\n३. कम्प्युटर हार्डवेयर तथा नेटवर्किङ उपकरणहरूको बिक्री तथा मर्मत सम्भार गर्ने।';
      } else if (k === 'director.md_name' || k.includes('md_name') || k.includes('full_name') || k.includes('applicant.name') || k.includes('name') || k.includes('promoter') || k.includes('shareholder') || l.includes('नाम')) {
        if (k.includes('shareholder_2') || k.includes('promoter_2') || k.includes('member_2')) {
          dummy[field.key] = 'सरोज जोशी';
        } else if (k.includes('shareholder_3') || k.includes('promoter_3') || k.includes('member_3')) {
          dummy[field.key] = 'निराजन दत्त शर्मा';
        } else if (k.includes('witness')) {
          dummy[field.key] = 'सन्तोष शर्मा';
        } else if (k.includes('father')) {
          dummy[field.key] = 'रामेश्वर कम्ती';
        } else if (k.includes('grandfather')) {
          dummy[field.key] = 'हरिलाल कम्ती';
        } else if (k.includes('mother')) {
          dummy[field.key] = 'सीता देवी कम्ती';
        } else if (k.includes('spouse')) {
          dummy[field.key] = 'अनिता कम्ती';
        } else {
          dummy[field.key] = 'योगेश कम्ती';
        }
      } else if (k.includes('citizenship_no') || k.includes('citizenship') || l.includes('नागरिकता')) {
        if (k.includes('witness')) {
          dummy[field.key] = '२७-०१-७२-०३४२१';
        } else if (k.includes('shareholder_2') || k.includes('member_2')) {
          dummy[field.key] = '६८-०१-७४-०९८१२';
        } else {
          dummy[field.key] = '६७-०७-५-०५८१७';
        }
      } else if (k.includes('citizenship_district') || k.includes('issued_district') || l.includes('जारी जिल्ला')) {
        dummy[field.key] = 'कैलाली';
      } else if (k.includes('citizenship_date') || k.includes('issued_date') || l.includes('जारी मिति')) {
        dummy[field.key] = '२०७५-०३-१२';
      } else if (k.includes('permanent_address') || (k.includes('address') && !k.includes('current'))) {
        if (k.includes('witness')) {
          dummy[field.key] = 'ललितपुर महानगरपालिका - ४, ललितपुर, बागमती प्रदेश';
        } else if (k.includes('shareholder_2') || k.includes('member_2')) {
          dummy[field.key] = 'पोखरा महानगरपालिका - ८, कास्की, गण्डकी प्रदेश';
        } else {
          dummy[field.key] = 'धनगढी उपमहानगरपालिका - ७, कैलाली, सुदूरपश्चिम प्रदेश';
        }
      } else if (k.includes('current_address') || l.includes('हालको ठेगाना')) {
        dummy[field.key] = 'काठमाडौं महानगरपालिका - १०, बागमती प्रदेश';
      } else if (k.includes('phone') || k.includes('mobile') || l.includes('मोबाइल') || l.includes('मोवाईल')) {
        dummy[field.key] = '९८६८९८७८२७';
      } else if (k.includes('telephone') || l.includes('टेलिफोन')) {
        dummy[field.key] = '०१-४४५५६६७';
      } else if (k.includes('email') || l.includes('इमेल')) {
        dummy[field.key] = 'yogesh.kamti@example.com';
      } else if (k.includes('fax') || l.includes('फ्याक्स')) {
        dummy[field.key] = '०१-४४५५६६८';
      } else if (k.includes('po_box') || l.includes('पोष्ट')) {
        dummy[field.key] = '४४६००';
      } else if (k.includes('capital.authorized') || l.includes('अधिकृत पूँजी')) {
        dummy[field.key] = '५००००००';
      } else if (k.includes('capital.issued') || l.includes('जारी पूँजी')) {
        dummy[field.key] = '२५०००००';
      } else if (k.includes('capital.paid_up') || l.includes('चुक्ता पूँजी')) {
        dummy[field.key] = '२५०००००';
      } else if (k.includes('capital.total_shares')) {
        dummy[field.key] = '५००००';
      } else if (k.includes('shares') || l.includes('कित्ता')) {
        dummy[field.key] = '२५०००';
      } else if (k.includes('date') || l.includes('मिति')) {
        dummy[field.key] = '२०८१-०६-१५';
      } else if (k.includes('venue') || l.includes('स्थान')) {
        dummy[field.key] = 'कम्पनीको रजिष्टर्ड कार्यालय, काठमाडौं';
      } else if (k.includes('time') || l.includes('समय')) {
        dummy[field.key] = 'बिहान ११:०० बजे';
      } else if (k.includes('designation') || l.includes('पद')) {
        dummy[field.key] = 'प्रबन्ध सञ्चालक (MD)';
      } else if (k.includes('masaudakar.name') || k.includes('advocate.name')) {
        dummy[field.key] = 'समिक्षा भण्डारी';
      } else if (k.includes('masaudakar.reg_no') || k.includes('advocate.reg_no')) {
        dummy[field.key] = '१८७१०';
      } else if (field.options && field.options.length > 0) {
        dummy[field.key] = field.options[0].value;
      } else if (field.placeholder) {
        dummy[field.key] = cleanPlaceholder(field.placeholder);
      } else {
        dummy[field.key] = field.type === 'number' ? '१००००' : 'नमूना विवरण';
      }
    });

    setFormData(dummy);
    setFieldErrors({});
    setSubmitError(null);
  }

  function handleClearFormData() {
    const empty: Record<string, string> = {};
    fields.forEach((f) => {
      empty[f.key] = '';
    });
    setFormData(empty);
    setFieldErrors({});
    setSubmitError(null);
  }

  // Render dynamic field inputs
  function renderFieldInput(f: FormField) {
    const val = formData[f.key] || '';
    const hasError = !!fieldErrors[f.key];
    const isAddress = f.type === 'address' || f.key.toLowerCase().includes('address');

    if (isAddress) {
      const compAddr = formData['company.registered_address'] || '';
      const sh1Addr = formData['shareholder_1.address'] || '';
      const canUseComp = compAddr && val !== compAddr && f.key !== 'company.registered_address';
      const canUseSh1 = sh1Addr && val !== sh1Addr && f.key !== 'shareholder_1.address' && f.key !== 'company.registered_address';

      return (
        <div className="space-y-1.5">
          {(canUseComp || canUseSh1) && (
            <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
              {canUseComp && (
                <button
                  type="button"
                  onClick={() => handleFieldChange(f.key, compAddr)}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200/90 px-2 py-0.5 text-[10.5px] font-semibold text-[#148C7E] hover:bg-teal-100/80 transition cursor-pointer"
                >
                  <Building2 className="h-3 w-3" />
                  <span>{isNe ? 'कम्पनीको ठेगाना नै प्रयोग गर्नुहोस्' : 'Use Company Address'}</span>
                </button>
              )}
              {canUseSh1 && (
                <button
                  type="button"
                  onClick={() => handleFieldChange(f.key, sh1Addr)}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200/90 px-2 py-0.5 text-[10.5px] font-semibold text-sky-700 hover:bg-sky-100/80 transition cursor-pointer"
                >
                  <User className="h-3 w-3" />
                  <span>{isNe ? 'पहिलो शेयरधनीको ठेगाना सरह' : 'Same as Shareholder 1'}</span>
                </button>
              )}
            </div>
          )}
          <NepalAddressPicker
            value={val}
            onChange={(addr) => handleFieldChange(f.key, addr)}
            placeholder={cleanPlaceholder(f.placeholder, f, isNe)}
            isNe={isNe}
            hasError={hasError}
          />
        </div>
      );
    }

    const placeholderText = cleanPlaceholder(f.placeholder, f, isNe);

    if (f.key.toLowerCase().includes('designation')) {
      const designations = ['सञ्चालक / प्रोप्राइटर', 'अध्यक्ष', 'प्रबन्ध सञ्चालक', 'सञ्चालक', 'शेयरधनी'];
      return (
        <div className="space-y-2">
          <NepaliInput
            type="text"
            value={val}
            onChange={(v) => handleFieldChange(f.key, v)}
            placeholder={placeholderText}
            hasError={hasError}
            defaultNepaliMode={!isEnglishField(f)}
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400">{isNe ? 'पद छान्नुहोस्:' : 'Select Designation:'}</span>
            {designations.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleFieldChange(f.key, d)}
                className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[10.5px] font-semibold transition cursor-pointer ${
                  val === d
                    ? 'bg-[#18A999] text-white border-[#18A999]'
                    : 'bg-teal-50 border-teal-200/90 text-[#148C7E] hover:bg-teal-100/80'
                }`}
              >
                <span>{d}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    switch (f.type) {
      case 'textarea': {
        const isNumbered =
          f.key.startsWith('meeting.proposal') ||
          f.key.startsWith('meeting.decision') ||
          f.key.includes('agenda') ||
          f.key.includes('objective') ||
          f.key.includes('decision');

        return (
          <div className="space-y-1.5">
            {isNumbered && (
              <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5 pb-0.5">
                <span className="text-[10.5px] font-medium text-teal-700 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                  <span>{isNe ? 'Enter थिच्दा स्वतः अर्को नम्बर (१., २., ३.) आउनेछ' : 'Pressing Enter auto-increments numbering (1., 2., 3.)'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!val.trim()) {
                      handleFieldChange(f.key, '१. ');
                    } else if (!/^[०-९0-9]+[.)]/.test(val.trim())) {
                      const lines = val.split('\n').filter((l) => l.trim().length > 0);
                      const numbered = lines.map((l, i) => `${toDevanagariDigits(i + 1)}. ${l.replace(/^[०-९0-9]+[.)\s]*/, '')}`).join('\n');
                      handleFieldChange(f.key, numbered);
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200/90 px-2 py-0.5 text-[10.5px] font-bold text-[#148C7E] hover:bg-teal-100 transition cursor-pointer shadow-2xs"
                >
                  <Hash className="h-3 w-3" />
                  <span>{isNe ? '१. २. ढाँचा मिलाउनुहोस्' : 'Auto Number'}</span>
                </button>
              </div>
            )}
            <textarea
              rows={4}
              value={val}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              onKeyDown={(e) => {
                if (isNumbered) {
                  handleNumberedTextareaKeyDown(e, f.key, val);
                }
              }}
              placeholder={placeholderText || (isNe ? 'विस्तृत विवरण लेख्नुहोस्...' : 'Enter details...')}
              className={`w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-outfit text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all hover:border-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 ${
                hasError ? 'border-rose-400 ring-3 ring-rose-100 bg-rose-50/20' : ''
              }`}
            />
          </div>
        );
      }

      case 'select': {
        const selectOpts: SelectOption[] = Array.isArray(f.options)
          ? f.options.map((opt) =>
              typeof opt === 'string'
                ? { value: opt, label: opt }
                : { value: opt.value, label: opt.label }
            )
          : [];

        return (
          <CustomSelect
            value={val}
            onChange={(selectedVal) => handleFieldChange(f.key, selectedVal)}
            options={selectOpts}
            placeholder={placeholderText || (isNe ? 'छनोट गर्नुहोस्...' : 'Select...')}
            searchable={selectOpts.length > 5}
          />
        );
      }

      case 'phone':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Phone className="h-4 w-4" />
            </span>
            <input
              type="tel"
              value={val}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              placeholder={placeholderText || '98XXXXXXXX'}
              autoComplete="off"
              className={`w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all hover:border-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 ${
                hasError ? 'border-rose-400 ring-3 ring-rose-100 bg-rose-50/20' : ''
              }`}
            />
          </div>
        );

      case 'email':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              value={val}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              placeholder={placeholderText || 'name@domain.com'}
              autoComplete="off"
              className={`w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-outfit text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all hover:border-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 ${
                hasError ? 'border-rose-400 ring-3 ring-rose-100 bg-rose-50/20' : ''
              }`}
            />
          </div>
        );

      case 'date_bs':
      case 'date_ad':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Calendar className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={val}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              placeholder={placeholderText || (f.type === 'date_bs' ? '२०८१-०६-१५' : 'YYYY-MM-DD')}
              autoComplete="off"
              className={`w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all hover:border-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 ${
                hasError ? 'border-rose-400 ring-3 ring-rose-100 bg-rose-50/20' : ''
              }`}
            />
          </div>
        );

      case 'citizenship':
      case 'pan':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <CreditCard className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={val}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              placeholder={placeholderText || (f.type === 'pan' ? '123456789' : '२७-०१-७५-०१२३४')}
              autoComplete="off"
              className={`w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all hover:border-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 ${
                hasError ? 'border-rose-400 ring-3 ring-rose-100 bg-rose-50/20' : ''
              }`}
            />
          </div>
        );

      case 'number': {
        const asciiVal = val ? val.replace(/[०-९]/g, (d) => ({ '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' }[d] || d)) : '';
        return (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Hash className="h-4 w-4" />
            </span>
            <input
              type="number"
              value={asciiVal}
              onChange={(e) => handleFieldChange(f.key, e.target.value)}
              placeholder={placeholderText || '0'}
              autoComplete="off"
              className={`w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition-all hover:border-slate-400 focus:border-[#18A999] focus:outline-none focus:ring-3 focus:ring-[#18A999]/15 ${
                hasError ? 'border-rose-400 ring-3 ring-rose-100 bg-rose-50/20' : ''
              }`}
            />
          </div>
        );
      }

      default:
        return (
          <NepaliInput
            value={val}
            onChange={(newVal) => handleFieldChange(f.key, newVal)}
            placeholder={placeholderText || (isNe ? 'यहाँ प्रविष्ट गर्नुहोस्' : 'Enter value')}
            isNe={isNe}
            hasError={hasError}
            enableTransliteration={true}
            defaultNepaliMode={!isEnglishField(f)}
          />
        );
    }
  }

  // Live A4 Document Paper Renderer
  function renderLiveDocumentPaper() {
    if (!docLayout) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
          {isNe ? 'यस कागजातको प्रत्यक्ष प्रिन्ट ढाँचा उपलब्ध छैन।' : 'No print layout available for preview.'}
        </div>
      );
    }

    const isPlainPreprinted = docLayout.paperMode === 'plain_preprinted';
    const isLegalDeed = docLayout.paperMode === 'legal_deed';
    const showHeader = Boolean(docLayout.showHeader) && !isPlainPreprinted;
    const showFooter = Boolean(docLayout.showFooter);
    const showDateRef = Boolean(docLayout.showDateRef);
    const showWatermark = Boolean(docLayout.showWatermark) && !isPlainPreprinted;
    const topMargin = isPlainPreprinted ? (docLayout.topMarginMm || 50) : (docLayout.topMarginMm || 15);
    const fontClass = docLayout.fontFamily === 'serif' ? 'font-serif' : 'font-outfit font-sans';

    // Renders text and replaces {{variables}} with user value or an elegant underline
    function renderTextWithUnderline(text: string = '') {
      if (!text) return null;
      const parts = text.split(/(\{\{[a-zA-Z0-9_.-]+\}\})/g);

      return parts.map((part, idx) => {
        const match = part.match(/^\{\{([a-zA-Z0-9_.-]+)\}\}$/);
        if (match) {
          const key = match[1];
          const val = (formData[key] || '').trim();
          if (val) {
            const isIdentifierOrPhone = /(phone|mobile|tel|contact|citizenship|pan|vat|reg|registration|po_box|fax|nid|passport|token|serial)/i.test(key);
            const isNumericKey = /(capital|shares|share_rate|unpaid|amount|fee|count|rate|total_shares|issued_shares|price|total)/i.test(key);
            const isPureDigits = /^[0-9०-९,]+(\.[0-9०-९]+)?$/.test(val);
            const displayVal = (!isIdentifierOrPhone && (isNumericKey || isPureDigits))
              ? formatNepaliNumber(val)
              : val.replace(/,/g, '');

            return (
              <span
                key={idx}
                className="font-bold text-[#123B5D] px-0.5 inline-block"
              >
                {displayVal}
              </span>
            );
          }

          // When empty, show official blank underline instead of [applicant.key]
          return (
            <span
              key={idx}
              title={`यहाँ विवरण भरिनेछ (${key})`}
              className="inline-block border-b-2 border-slate-400 min-w-[130px] text-center text-[10px] text-slate-400 font-mono tracking-widest px-2 mx-1 select-none"
            >
              ____________________
            </span>
          );
        }

        return <span key={idx}>{part}</span>;
      });
    }

    let currentHeader = docLayout.header;
    let currentOffice = docLayout.office;
    let currentSubject = docLayout.subject;
    let currentBody = docLayout.body;
    let currentDeclaration = docLayout.declaration;
    let currentSignatory = docLayout.signatory;

    if (slug === 'company-registration-suite') {
      if (suiteTab === 'app') {
        currentHeader = "{{company.name_np}}\n{{company.name_en}}\n{{company.registered_address}}";
        currentOffice = "श्रीमान् रजिष्ट्रार ज्यू,\nकम्पनी रजिष्ट्रारको कार्यालय,\nत्रिपुरेश्वर, काठमाडौं।";
        currentSubject = "विषय: कम्पनी दर्ता गरी पाऊँ।";
        currentBody = "महोदय,\n\nउपरोक्त सम्बन्धमा हामी निवेदक/संस्थापकहरूले कम्पनी ऐन, २०६३ बमोजिम {{company.name_np}} (अङ्ग्रेजीमा {{company.name_en}}) नामको प्राइभेट लिमिटेड कम्पनी दर्ता गर्न चाहेकाले आवश्यक प्रबन्धपत्र २ प्रति, नियमावली २ प्रति, संस्थापकहरूको नागरिकता प्रतिलिपि तथा अन्य आवश्यक कागजातहरू यसै निवेदन साथ संलग्न राखी पेस गरेका छौं।\n\n१. प्रस्तावित कम्पनीको नाम: {{company.name_np}} ({{company.name_en}})\n२. रजिष्टर्ड कार्यालयको ठेगाना: {{company.registered_address}}\n३. कारोबारको मुख्य प्रकृति: {{company.business_type}}\n४. अधिकृत पुँजी: रु. {{capital.authorized}}\n५. जारी पुँजी: रु. {{capital.issued}}\n६. चुक्ता पुँजी: रु. {{capital.paid_up}}\n७. मुख्य संस्थापक: {{shareholder_1.full_name}} (नागरिकता नं. {{shareholder_1.citizenship_no}})\n\n८. मुख्य उद्देश्यहरू:\n{{company.main_objectives}}\n\nअतः कानुन बमोजिम उक्त कम्पनी दर्ता गरी दर्ता प्रमाणपत्र प्रदान गरिदिनुहुन सादर अनुरोध गर्दछौं।";
        currentDeclaration = "संलग्न कागजातहरू:\n१. प्रबन्धपत्र २ प्रति\n२. नियमावली २ प्रति\n३. संस्थापक शेयरधनीको नागरिकता प्रमाणपत्र प्रतिलिपि\n४. नाम स्वीकृति पत्र";
        currentSignatory = "निवेदक / मुख्य संस्थापक शेयरधनी\n\n\n\n........................";
      } else if (suiteTab === 'moa') {
        currentHeader = "अनुसूची ९\n(दफा १८ को उपदफा ६ सँग सम्बन्धित)\nकम्पनी ऐन, २०६३ अन्तर्गत संस्थापित\n{{company.name_np}}\n{{company.name_en}}\nप्रबन्धपत्र (MEMORANDUM OF ASSOCIATION)";
        currentOffice = "";
        currentSubject = "";
        currentBody = "१. कम्पनीको नाम: यस कम्पनीको नाम {{company.name_np}} हुनेछ। अङ्ग्रेजीमा {{company.name_en}} हुनेछ।\n\n२. कम्पनीको रजिष्टर्ड कार्यालय रहने ठेगाना: यस कम्पनीको रजिष्टर्ड कार्यालय {{company.registered_address}} मा रहनेछ।\n\n३. परिभाषा: विषय वा प्रसङ्गले अर्को अर्थ नलागेमा यस प्रबन्धपत्रमा: (क) ऐन भन्नाले कम्पनी ऐन, २०६३ सम्झनु पर्छ। (ख) कार्यालय भन्नाले कम्पनी रजिष्ट्रारको कार्यालय सम्झनु पर्छ। (ग) कम्पनी भन्नाले {{company.name_np}} सम्झनु पर्छ।\n\n४. कम्पनीले गर्ने व्यवसाय वा कारोबारको प्रकृति: {{company.business_type}}।\n\n५. कम्पनीका उद्देश्यहरू: यस कम्पनीका उद्देश्यहरू देहाय बमोजिम हुनेछन्:\n{{company.main_objectives}}\n\n६. कम्पनीको उद्देश्य प्राप्त गर्न गरिने कामहरू: कम्पनीको उद्देश्य प्राप्त गर्न प्रचलित कानुन बमोजिम इजाजतपत्र लिने, भौतिक संरचना तथा जग्गा भाडामा लिने, बैंक तथा वित्तीय संस्थाबाट ऋण लिन वा लगानी गर्न पाउनेछ।\n\n७. कम्पनीको पुँजी संरचना:\n(क) अधिकृत पुँजी: रु. {{capital.authorized}} (प्रति शेयर रु. १०० का दरले कुल {{capital.total_shares}} कित्ता साधारण शेयर)\n(ख) जारी पुँजी: रु. {{capital.issued}}\n(ग) चुक्ता पुँजी: रु. {{capital.paid_up}}\n\n८. संस्थापक शेयरधनीहरूको विवरण:\n१. नाम: {{shareholder_1.full_name}}, ठेगाना: {{shareholder_1.address}}, बाबुको नाम: {{shareholder_1.father_name}}, बाजेको नाम: {{shareholder_1.grandfather_name}}, नागरिकता नं.: {{shareholder_1.citizenship_no}}, लिएको शेयर: {{shareholder_1.shares}}।\n\n९. साक्षीको विवरण:\nसाक्षी: {{witness.full_name}}।";
        currentDeclaration = "हामी यस प्रबन्धपत्रमा लेखिएका सम्पूर्ण व्यहोरा ठीक साँचो छ भनी आफ्ना होस-हवासमा हस्ताक्षर गर्दछौं।";
        currentSignatory = "संस्थापक शेयरधनी\n\n\n\n........................";
      } else if (suiteTab === 'aoa') {
        currentHeader = "अनुसूची १०\n(दफा १८ को उपदफा ६ सँग सम्बन्धित)\nकम्पनी ऐन, २०६३ अन्तर्गत संस्थापित\n{{company.name_np}}\n{{company.name_en}}\nनियमावली (ARTICLES OF ASSOCIATION)";
        currentOffice = "";
        currentSubject = "";
        currentBody = "१. प्रारम्भिक: यस नियमावलीलाई {{company.name_np}} को नियमावली भनिनेछ। यो नियमावली कम्पनी दर्ता भएको मितिदेखि लागू हुनेछ।\n\n२. शेयर पुँजी तथा बाँडफाँड: सञ्चालक समितिले कम्पनी ऐन तथा प्रबन्धपत्रको अधीनमा रही शेयरको बाँडफाँड गर्नेछ।\n\n३. साधारण सभा सम्बन्धी व्यवस्था: कम्पनीको प्रथम वार्षिक साधारण सभा कारोबार सुरु गरेको मितिले १ वर्षभित्र र त्यसपछि प्रत्येक आर्थिक वर्ष समाप्त भएको ६ महिनाभित्र बस्नेछ।\n\n४. सञ्चालक समिति गठन तथा योग्यता: कम्पनीको सञ्चालक समितिमा कम्तीमा १ जना र बढीमा ७ जनासम्म सञ्चालक रहनेछन्। कम्पनीको प्रथम सञ्चालकमा संस्थापक शेयरधनी {{shareholder_1.full_name}} रहनेछन्।\n\n५. प्रबन्ध सञ्चालक तथा अधिकार: सञ्चालकहरूले आफूहरू मध्येबाट एक जना प्रबन्ध सञ्चालक नियुक्त गर्न सक्नेछन्। कम्पनीको दैनिक कार्य सञ्चालन, बैंक खाता खोल्ने तथा सञ्चालन गर्ने अधिकार प्रबन्ध सञ्चालक {{shareholder_1.full_name}} मा रहनेछ।\n\n६. लेखा परीक्षण तथा हिसाबकिताब: कम्पनीको हिसाबकिताब प्रचलित नेपाल लेखा मापदण्ड बमोजिम दर्तावाला लेखापरीक्षकबाट प्रत्येक वर्ष अडिट गराइनेछ।\n\n७. कम्पनीको छाप: कम्पनीको छुट्टै कानूनी छाप रहनेछ।";
        currentDeclaration = "हामी यस नियमावलीमा उल्लिखित नियमहरू पालना गर्न मञ्जुर भई हस्ताक्षर गर्दछौं।";
        currentSignatory = "संस्थापक शेयरधनी / सञ्चालक\n\n\n\n........................";
      } else if (suiteTab === 'res') {
        currentHeader = "{{company.name_np}}\n{{company.name_en}}\nसंस्थापक शेयरधनीहरूको बैठकको निर्णय";
        currentOffice = "";
        currentSubject = "विषय: कम्पनी दर्ता तथा प्रबन्ध सञ्चालक अख्तियारी सम्बन्धी निर्णय।";
        currentBody = "आज मिति २०८१ सालमा प्रस्तावित {{company.name_np}} ({{company.name_en}}) का संस्थापक शेयरधनीहरूको बैठक बसी निम्न प्रस्तावहरू उपर छलफल गरी सर्वसम्मत निर्णय गरियो:\n\nउपस्थिति:\n१. संस्थापक: {{shareholder_1.full_name}} (नागरिकता नं. {{shareholder_1.citizenship_no}})\n\nप्रस्तावहरू:\n१. कम्पनी ऐन, २०६३ बमोजिम कम्पनी दर्ता गर्ने सम्बन्धमा।\n२. प्रबन्धपत्र तथा नियमावली पारित गर्ने सम्बन्धमा।\n३. कम्पनीको प्रबन्ध सञ्चालक नियुक्ति तथा कार्यालयमा कागजात पेस गर्ने अख्तियारी सम्बन्धमा।\n\nनिर्णयहरू:\n१. कम्पनी ऐन, २०६३ को अधीनमा रही अधिकृत पुँजी रु. {{capital.authorized}} र जारी पुँजी रु. {{capital.issued}} रहने गरी {{company.name_np}} दर्ता गर्ने निर्णय सर्वसम्मतले पारित गरियो।\n२. प्रस्तावित प्रबन्धपत्र (MOA) र नियमावली (AOA) को मस्यौदा अध्ययन गरी सर्वसम्मतले पारित गरियो।\n३. कम्पनी रजिष्ट्रारको कार्यालय त्रिपुरेश्वरमा कम्पनी दर्ता सम्बन्धी सम्पूर्ण कार्य गर्न तथा कम्पनीको तर्फबाट हस्ताक्षर गर्न संस्थापक {{shareholder_1.full_name}} लाई प्रबन्ध सञ्चालकको सम्पूर्ण अख्तियारी प्रदान गर्ने निर्णय गरियो।";
        currentDeclaration = "माथि उल्लिखित निर्णयहरू हाम्रै रोहवरमा सर्वसम्मत रूपमा पारित भएकाले हस्ताक्षर गर्दछौं।";
        currentSignatory = "संस्थापक शेयरधनीहरू\n\n\n\n........................";
      }
    } else if (slug === 'annual-compliance-suite' || slug === 'agm-section51-annual-return') {
      // Build dynamic member attendance & directors list
      const previewMembers: { index: number; name: string; desig: string }[] = [];
      for (let i = 1; i <= memberCount; i++) {
        const mName = formData[`member_${i}.name`] || (i === 1 ? formData['director.full_name'] : '');
        if (mName && mName.trim()) {
          const mDesig = formData[`member_${i}.designation`] || (i === 1 ? formData['director.designation'] : '') || (i === 1 ? 'सञ्चालक अध्यक्ष' : 'सञ्चालक');
          previewMembers.push({ index: i, name: mName.trim(), desig: mDesig });
        }
      }
      if (previewMembers.length === 0) {
        previewMembers.push({
          index: 1,
          name: formData['director.full_name'] || '....................',
          desig: formData['director.designation'] || 'संचालक अध्यक्ष',
        });
      }

      const nepNums = ['१', '२', '३', '४', '५', '६', '७', '८'];
      const previewAttendanceText = previewMembers
        .map((m, idx) => `${nepNums[idx] || idx + 1}   ${m.name}   ${m.desig}`)
        .join('\n');

      const previewDafa51Directors = previewMembers
        .map((m, idx) => `${nepNums[idx] || idx + 1}   ${m.name}   ${m.desig}`)
        .join('\n');

      let previewSignatures = '';
      if (previewMembers.length === 1) {
        previewSignatures = `हस्ताक्षर: ........................\n\n${previewMembers[0].name}\n${previewMembers[0].desig}`;
      } else if (previewMembers.length === 2) {
        previewSignatures = `${previewMembers[0].name} (${previewMembers[0].desig})                    ${previewMembers[1].name} (${previewMembers[1].desig})\nहस्ताक्षर: ........................                    हस्ताक्षर: ........................`;
      } else {
        previewSignatures = previewMembers
          .map((m) => `हस्ताक्षर: ........................\n${m.name} (${m.desig})`)
          .join('\n\n');
      }

      const bodProposalsText = formData['bod_meeting.proposals'] || formData['meeting.proposal'] || '१.   वार्षिक साधारण सभा बोलाउने सम्बन्धमा ।\n२.   विविध';
      const bodDecisionsText = formData['bod_meeting.decisions'] || formData['meeting.decisions'] || '१.   प्रस्ताव नं. १ उपर छलफल हुँदा कम्पनी स्वीकृत नियमावलीको नियम बमोजिम कम्पनीको वार्षिक साधारण सभा निम्न मिति, समय र स्थानमा गर्ने निर्णय सर्वसम्मतीले पारित गरियो ।\n\nमिति: {{agm_meeting.date}}\nसमय: {{agm_meeting.time}} बजे\nस्थान: {{agm_meeting.venue}}\n\n२.   विविध प्रस्ताव उपर छलफल गर्नुपर्ने अन्य विषय बाँकी नरहेकोले संचालकको अनुमतीले आजको बैठक समाप्त गरियो ।';
      const agmProposalsText = formData['agm_meeting.proposals'] || '१.   आ.व. {{fiscal_year}} सम्मको आषाढ मसान्तसम्मको प्रगति विवरण ।\n२.   आ.व. {{fiscal_year}} को लेखा परिक्षणको सम्बन्धमा ।\n३.   आगामी आ.व. {{next_fiscal_year}} को लेखापरिक्षकको नियुक्ति र पारिश्रमिक सम्बन्धमा ।\n४.   विविध ।';
      const agmDecisionsText = formData['agm_meeting.decisions'] || '१.   प्रस्ताव नं. १ उपर बैठकमा छलफल हुँदा कम्पनीको संचालकले कम्पनीको आ.व. {{fiscal_year}} सम्मका प्रगति विवरण प्रस्तुत हुँदा सो विवरणलाई सभाले पारित गरियो ।\n२.   प्रस्ताव नं. २ उपर सभामा छलफल हुँदा आ.व. {{fiscal_year}} को कम्पनीको हिसाब किताब सहितको लेखा परिक्षण प्रतिवेदन कम्पनीको लेखा परिक्षक श्री {{auditor.name_or_firm}} ले तयार गर्नु भएको लेखा परिक्षण प्रतिवेदनलाई यस सभाले पारित गरियो ।\n३.   प्रस्ताव नं. ३ उपर सभामा छलफल हुँदा कम्पनी ऐन बमोजिम आगामी आ.व. {{next_fiscal_year}} को लागि कम्पनीको लेखा परिक्षक गर्न रजिष्टर्ड लेखा परिक्षक श्री {{auditor.name_or_firm}} लाई नियुक्ति गर्ने र निजको पारिश्रमिक आपसी सहमतीबाट दिने निर्णय सभाले पारित गरियो ।\n४.   विविध प्रस्ताव उपर छलफल गर्नुपर्ने अन्य विषय बाँकी नरहेकोले संचालकको अनुमतीले आजको बैठक समाप्त गरियो ।';

      if (suiteTab === 'app') {
        currentHeader = "प्रा.लि.नं. {{company.reg_no}}\n{{company.name_np}}\n{{company.registered_address}}";
        currentOffice = "श्रीमान् रजिष्ट्रार ज्यू\nकम्पनी रजिष्ट्रारको कार्यालय\nत्रिपुरेश्वर, काठमाडौँ ।";
        currentSubject = "विषय:- वार्षिक विवरण अभिलेख गरी पाऊँ ।";
        currentBody = "महोदय,\n\nउपरोक्त सम्बन्धमा यस कम्पनीको आ.व. {{fiscal_year}} को वार्षिक विवरण तथा लेखा परीक्षण प्रतिवेदन अभिलेख गर्नको लागि आवश्यक कागजातहरु यसै साथ संलग्न राखी पेश गरिएको व्यहोरा सादर अनुरोध छ । सो अनुसार अभिलेख गरी पाउँ ।";
        currentDeclaration = "संलग्न कागजातहरु:\n१. संचालक समितिको बैठक\n२. आ.व. {{fiscal_year}} को लेखापरिक्षक प्रतिवेदन\n३. आ.व. {{fiscal_year}} का वार्षिक साधारण सभा\n४. दफा ५१ को बिबरण";
        currentSignatory = `निवेदक\n\n\n\n${previewMembers[0].name}\n${previewMembers[0].desig}`;
      } else if (suiteTab === 'bod') {
        currentHeader = "{{company.name_np}}\nसंचालक समितिको बैठक";
        currentOffice = "";
        currentSubject = "";
        currentBody = `आज मिति: {{bod_meeting.date}} गते दिनको {{bod_meeting.time}} बजे यस प्रा.लि.को संचालक ${previewMembers[0].name} अध्यक्षतामा कम्पनीकै रजिष्टर्ड कार्यालय मा संचालक समितिको बैठक बसी निम्न प्रस्ताव अनुसार निम्न निर्णय गरीयो ।\n\nउपस्थीती\n${previewAttendanceText}\n\nप्रस्तावहरु\n${bodProposalsText}\n\nनिर्णयहरु\n${bodDecisionsText}`;
        currentDeclaration = "";
        currentSignatory = previewSignatures;
      } else if (suiteTab === 'agm') {
        currentHeader = "{{company.name_np}}\nसाधारण सभा";
        currentOffice = "";
        currentSubject = "";
        currentBody = `आज मिति: {{agm_meeting.date}} गते दिनको {{agm_meeting.time}} बजे यस प्रा.लि.को संचालक ${previewMembers[0].name} अध्यक्षतामा कम्पनीकै रजिष्टर्ड कार्यालय मा साधारण सभा बसी निम्न प्रस्ताव अनुसार निम्न निर्णय गरीयो ।\n\nउपस्थीती\n${previewAttendanceText}\nउपस्थिति प्रतिशत:- सतप्रतिशत\nसभाको वैधानिकता:- कम्पनी ऐन २०६३ बमोजिम स्वीकृत नियमावली बमोजिम शेयरको प्रतिनिधित्व भएको र नियम बमोजिमको सूचना समेत शेयरधनीहरुलाई गराइएको देखिंदा सभाको वैधानिकता पूरा भएको हुँदा कम्पनी ऐन २०६३ बमोजिम सभालाई वैधानिक घोषणा गरी सभाको कारवाही अगाडी बढाइयो ।\n\nछलफलका प्रस्तावहरु:\n${agmProposalsText}\n\nनिर्णयहरु\n${agmDecisionsText}`;
        currentDeclaration = "";
        currentSignatory = previewSignatures;
      } else if (suiteTab === 'dafa51') {
        currentHeader = "कम्पनी ऐन, २०६३ को दफा ५१ अनुसारको\nविवरण\nयस {{company.name_np}}";
        currentOffice = "";
        currentSubject = "";
        currentBody = `कम्पनी ऐन, २०६३ को दफा ५१ अनुसारको लगत यस अनुसार पेश गरिएको छ ।\n\n(क)   कम्पनीको अधिकृत पूँजी र शेयरसंख्या: कम्पनीको अधिकृत पूँजी रु {{capital.authorized}}/- रहेको छ र शेयरको संख्या {{capital.total_shares}} थान रहेको छ ।\n\n(ख)   कम्पनी जारी पूँजी र शेयरको संख्या:- कम्पनीको जारी पूँजी रु {{capital.issued}}/- रहेको छ र शेयरको संख्या {{capital.issued_shares}} थान रहेको छ ।\n\n(ग)   कम्पनीको चुक्ता पूँजी:- कम्पनीको चुक्ता पूँजी रु {{capital.paid_up}}/- रहेको छ ।\n\n(घ)   शेयर पिच्छे माग भएको रकम:- शेयर पिच्छे माग भएको रकम रु {{capital.share_rate}}/- रहेको छ ।\n\n(ङ)   किस्ता असुल भएको जम्मा रकम:- माग अनुसार पुरै\n\n(च)   असुल हुन बाँकी रहेको जम्मा रकम:- {{company.unpaid_share_amount}}\n\n(छ)   शेयर वा डिबेञ्चरमा दलाली दस्तुर वापत दिएको जम्मा रकम:- {{company.brokerage_fee}}\n\n(ज)   कुनै शेयर जफत गरिएकोमा त्यस्तो शेयरको जम्मा संख्या, जफत भएको कारण र मिति: {{company.forfeited_shares}}\n\n(झ)   बैंक वित्तिय संस्था वा अन्य कुनै व्यक्तिबाट ऋण वा कम्पनीले दिएको जमानत: {{company.loans_guarantees}}\nसंलग्न वासलात बमोजिम ।\n१ अन्य कम्पनी वा शेयर डिभेन्चरमा लगानी गरेको भए त्यस्तो कम्पनीको नाम र दर्ता नं. समेत । {{company.investments}}\n\n(ञ)   बहालवाला सञ्चालकको नाम र ठेगाना:\n${previewDafa51Directors}`;
        currentDeclaration = "";
        currentSignatory = previewSignatures;
      }
    }

    const paragraphs = (currentBody || '').split('\n\n').filter(Boolean);

    return (
      <div
        style={{
          paddingTop: `${topMargin}mm`,
          paddingBottom: `${docLayout.bottomMarginMm || 15}mm`,
        }}
        className={`relative mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white px-8 sm:px-12 py-8 shadow-xl rounded-sm ${fontClass} text-slate-900 flex flex-col justify-between ${
          isLegalDeed
            ? 'border-4 border-double border-slate-800'
            : 'border-0 ring-0'
        }`}
      >
        {/* Background Watermark */}
        {showWatermark && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-5">
            <span className="text-5xl font-black uppercase -rotate-45 tracking-widest text-slate-800 whitespace-nowrap">
              MERO KAGAZ • OFFICIAL
            </span>
          </div>
        )}

        <div className="space-y-4">
          {/* Header (Top Title / Letterhead) */}
          {showHeader && (currentHeader || docLayout.header) && (
            <div className="border-b border-slate-200 pb-3 text-center mb-3">
              <div className="whitespace-pre-line text-xs font-bold leading-tight text-slate-800">
                {renderTextWithUnderline(currentHeader || docLayout.header)}
              </div>
            </div>
          )}

          {/* Date & Ref Line */}
          {showDateRef && (
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2 font-mono border-b border-slate-100">
              <span>पत्र संख्या: २०८१/०८२</span>
              <span>मिति: २०८१/०६/१५</span>
            </div>
          )}

          {/* Recipient */}
          {/* Recipient / Title */}
          {(currentOffice || docLayout.office) && (
            <div className={`${(currentOffice || docLayout.office || '').trim().startsWith('कम्पनी ऐन') ? 'text-justify font-bold' : 'whitespace-pre-line font-semibold'} text-xs text-slate-900 leading-relaxed`}>
              {renderTextWithUnderline(
                (currentOffice || docLayout.office || '')
                  .replace(/(प्राइभेट\s+लिमिटेड(?:\s*\([^)]*\))?)\s+प्राइभेट\s+लिमिटेड/gu, '$1')
                  .replace(/^(कम्पनी ऐन[^\n]+)\n+([^\n]+)\n+(नियमावली)/gu, '$1 $2 $3')
              )}
            </div>
          )}

          {/* Subject */}
          {(currentSubject || docLayout.subject) && (
            <div className="py-2 text-center text-xs font-bold text-slate-900 underline underline-offset-4">
              {renderTextWithUnderline(currentSubject || docLayout.subject)}
            </div>
          )}

          {/* Body Paragraphs */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-800 text-justify">
            {paragraphs.map((para, i) => {
              const trimmed = para.trim();
              if (/^परिच्छेद/u.test(trimmed)) {
                return (
                  <div key={i} className="text-center font-bold text-[13px] text-slate-900 my-3 tracking-wide">
                    {renderTextWithUnderline(trimmed)}
                  </div>
                );
              }
              return (
                <p key={i} className="whitespace-pre-line">
                  {renderTextWithUnderline(para)}
                </p>
              );
            })}
          </div>

          {/* Declaration / Certification Box */}
          {showFooter && (currentDeclaration || docLayout.declaration) && (
            <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] italic text-slate-600 border border-slate-200/80 whitespace-pre-line leading-relaxed">
              {renderTextWithUnderline(currentDeclaration || docLayout.declaration)}
            </div>
          )}
        </div>

        {/* Footer & Signatories */}
        {showFooter && (
          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <div className="text-right whitespace-pre-line text-xs font-semibold text-slate-800 leading-relaxed min-w-[180px]">
              {renderTextWithUnderline(currentSignatory || docLayout.signatory || 'निवेदक\n\n\n\n........................')}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-6">
          {/* Breadcrumb shimmer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-16 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-3 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-20 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-3 bg-slate-200 rounded-md" />
              <div className="h-3.5 w-48 bg-slate-200 rounded-md" />
            </div>
            <div className="hidden lg:flex h-8 w-64 bg-slate-200 rounded-xl" />
          </div>

          {/* Top Document Summary Card shimmer */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-48 bg-teal-100/70 rounded-full" />
                <div className="h-6 w-24 bg-slate-100 rounded-full" />
              </div>
              <div className="h-6 w-28 bg-teal-100/70 rounded-lg" />
            </div>
            <div className="h-7 w-2/3 bg-slate-200 rounded-xl" />
            <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
          </div>

          {/* Main Content Grid: Form fields (Left) + Document Preview (Right) */}
          <div className="grid gap-6 items-start lg:grid-cols-12">
            {/* Left Column: Form Groups */}
            <div className="lg:col-span-6 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="h-7 w-7 rounded-xl bg-slate-200" />
                  <div className="h-5 w-40 bg-slate-200 rounded-lg" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 bg-slate-200 rounded-md" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
                    <div className="h-10 bg-slate-100 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-slate-200 rounded-md" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="h-7 w-7 rounded-xl bg-slate-200" />
                  <div className="h-5 w-44 bg-slate-200 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-200 rounded-md" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-12 bg-teal-100/80 rounded-2xl" />
              </div>
            </div>

            {/* Right Column: Live A4 Document preview placeholder */}
            <div className="hidden lg:block lg:col-span-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs min-h-[460px] flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 bg-slate-100 rounded-2xl" />
                <div className="h-4 w-48 bg-slate-200 rounded-full" />
                <div className="h-3 w-64 bg-slate-100 rounded-full" />
                <div className="w-full max-w-sm space-y-2 pt-6">
                  <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-5/6" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-4/6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (fetchError || !doc) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 shadow-xs">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-rose-800 mb-1">
            {isNe ? 'कागजात फेला परेन' : 'Document Not Found'}
          </h2>
          <p className="text-xs text-rose-600 mb-4">{fetchError}</p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#123B5D] px-4 py-2 text-xs font-bold text-white hover:bg-[#0E2E4A]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{isNe ? 'कागजात सूचीमा फर्कनुहोस्' : 'Return to Documents'}</span>
          </Link>
        </div>
      </div>
    );
  }

  const docTitle = isNe && doc.name_np ? doc.name_np : doc.name;
  const priceNum = Number(doc.price) || 0;

  return (
    <div className="mx-auto px-4 py-8 sm:px-6 transition-all max-w-7xl">
      {/* Breadcrumb Navigation & Top Action Toolbar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:text-[#18A999] transition">
            {isNe ? 'गृहपृष्ठ' : 'Home'}
          </Link>
          <span>/</span>
          <Link href="/documents" className="hover:text-[#18A999] transition">
            {isNe ? 'कागजातहरू' : 'Documents'}
          </Link>
          <span>/</span>
          <span className="text-[#123B5D] font-semibold truncate max-w-xs">{docTitle}</span>
        </div>

        {/* Action Buttons: Auto-fill from Profile + Fill Dummy Data + View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Smart Profile Auto-Fill Action (Uses saved Individual or Business Details) */}
          {isLoggedIn && user && (
            <div className="flex items-center gap-1.5 bg-teal-50/80 border border-teal-200/90 rounded-2xl p-1 shadow-2xs">
              <select
                value={selectedAutoFillSource}
                onChange={(e) => {
                  const val = e.target.value === 'individual' ? 'individual' : Number(e.target.value);
                  setSelectedAutoFillSource(val);
                  handleAutoFill(val);
                }}
                className="rounded-xl border-none bg-white px-2.5 py-1 text-xs font-bold text-[#123B5D] shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="individual">{user.name} (व्यक्तिगत / Personal)</option>
                {businesses?.map((b) => (
                  <option key={b.id} value={b.id}>{b.name} (संस्थागत / Corporate)</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleAutoFill(selectedAutoFillSource)}
                title={isNe ? 'आफ्नो प्रोफाइलबाट ठेगाना तथा विवरण स्वतः भर्नुहोस्' : 'Auto-fill form with your saved profile details'}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#148C7E] hover:from-[#0E2E4A] hover:to-[#0f6c61] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-teal-200" />
                <span>{isNe ? 'स्वतः भर्नुहोस्' : 'Auto-fill'}</span>
              </button>
            </div>
          )}

          {/* Fill Dummy Data Button */}
          <button
            type="button"
            onClick={handleFillDummyData}
            title={isNe ? 'परीक्षणका लागि फारममा नमुना विवरण स्वतः भर्नुहोस्' : 'Automatically fill form with sample data for testing'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <FileEdit className="h-3.5 w-3.5 text-slate-300" />
            <span>{isNe ? 'परीक्षण विवरण भर्नुहोस्' : 'Fill Dummy Data'}</span>
          </button>

          {/* View Mode Toggle (Temporarily commented out to avoid confusion)
          {docLayout && (
            <div className="hidden lg:flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'form'
                    ? 'bg-white text-[#123B5D] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{isNe ? 'फारम मात्र' : 'Form Only'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-white text-[#123B5D] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SplitSquareVertical className="h-3.5 w-3.5 text-[#18A999]" />
                <span>{isNe ? 'प्रत्यक्ष कागजात (Live Split)' : 'Live Split Preview'}</span>
              </button>
            </div>
          )}
          */}
        </div>
      </div>

      {/* Auto-fill notification alert */}
      {autoFillNotice && (
        <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{autoFillNotice}</span>
        </div>
      )}

      {/* Editing Existing Order Notice */}
      {editOrderNo && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs font-medium text-amber-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-200 text-amber-800 font-bold text-xs">
              <FileText className="h-4 w-4 text-amber-800" />
            </span>
            <div>
              <p className="font-bold text-amber-950">
                {isNe ? 'कागजात विवरण सम्पादन मोड' : 'Editing Document Details'}
              </p>
              <p className="text-[11px] text-amber-800">
                {isNe
                  ? `अर्डर नं: #${editOrderNo} को विवरण सम्पादन गर्दै हुनुहुन्छ। सम्पादन पश्चात् अद्यावधिक PDF तुरुन्त तयार हुनेछ।`
                  : `You are updating details for Order #${editOrderNo}. Your official PDF will reflect these changes immediately.`}
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?order=${editOrderNo}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition"
          >
            <span>{isNe ? 'फर्कनुहोस् (Checkout)' : 'Back to Checkout'}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Save Success Alert */}
      {saveSuccess && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{isNe ? 'विवरण सफलतापूर्वक अद्यावधिक भयो! चेकआउटमा जाँदैछ...' : 'Details updated successfully! Redirecting to checkout...'}</span>
        </div>
      )}

      {/* Header Document Summary Card */}
      <div className="mb-6 rounded-3xl border border-teal-200/80 bg-gradient-to-r from-teal-50/70 via-white to-sky-50/60 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/80 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-[#148C7E]">
              <Building2 className="h-3 w-3" />
              <span>{doc.department || 'GOVERNMENT OF NEPAL'}</span>
            </span>
            {doc.processing_time && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{doc.processing_time}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">{isNe ? 'शुल्क:' : 'Official Fee:'}</span>
            <span className="text-base font-bold text-[#18A999] font-outfit">
              {formatCurrency(priceNum, isNe)}
            </span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[#123B5D] leading-tight">
          {docTitle}
        </h1>
        {doc.description && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {isNe && doc.description_np ? doc.description_np : doc.description}
          </p>
        )}
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-xs animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Grid: Form + Optional Live Document Preview */}
      <div className={`grid gap-6 items-start ${viewMode === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* LEFT / MAIN: Dynamic Form Fields Grouped */}
        <div className={`${viewMode === 'split' ? 'lg:col-span-6' : 'col-span-1'} space-y-6`}>
          {/* Profile Auto-Fill Selector Card for Logged-In Users */}
          {isLoggedIn && user ? (
            <div className="rounded-3xl border border-teal-200/70 bg-gradient-to-br from-white via-teal-50/15 to-slate-50/40 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-100/70 pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#123B5D] to-[#148C7E] text-white shadow-xs">
                    <UserCheck className="h-4 w-4 text-teal-100" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#123B5D]">
                      {isNe ? 'फारम भर्ने प्रोफाइल छनोट गर्नुहोस्' : 'Select Profile to Auto-Fill Details'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {isNe
                        ? 'आफ्नो सुरक्षित व्यक्तिगत वा संस्थागत प्रोफाइल छनोट गर्नुहोस्, विवरण स्वतः भरिनेछ।'
                        : 'Choose your individual or business profile to auto-populate the form.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAutoFill(selectedAutoFillSource)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#123B5D] to-[#148C7E] hover:from-[#0E2E4A] hover:to-[#0f6c61] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5 text-teal-200" />
                    <span>{isNe ? 'विवरण स्वतः भर्नुहोस्' : 'Auto-Fill Fields'}</span>
                  </button>
                  <Link
                    href="/user/profile"
                    target="_blank"
                    title={isNe ? 'प्रोफाइल व्यवस्थापन गर्नुहोस्' : 'Manage Profiles'}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#18A999] hover:border-teal-300 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{isNe ? 'प्रोफाइल व्यवस्थापन' : 'Manage'}</span>
                  </Link>
                </div>
              </div>

              {/* Profile Selection Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Individual Profile */}
                <div
                  onClick={() => {
                    setSelectedAutoFillSource('individual');
                    handleAutoFill('individual');
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4 transition-all cursor-pointer text-left border ${
                    selectedAutoFillSource === 'individual'
                      ? 'border-[#18A999] bg-gradient-to-b from-teal-50/80 to-white shadow-sm ring-2 ring-[#18A999]/30'
                      : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold text-xs ${
                            selectedAutoFillSource === 'individual'
                              ? 'bg-[#18A999]'
                              : 'bg-slate-400 group-hover:bg-[#18A999]/80'
                          }`}
                        >
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-md">
                            {isNe ? 'व्यक्तिगत विवरण' : 'Individual'}
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-[#123B5D] truncate max-w-[160px]">
                            {user.name || 'तपाईंको नाम'}
                          </h3>
                        </div>
                      </div>

                      {selectedAutoFillSource === 'individual' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{isNe ? 'लागू भएको' : 'Active'}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 group-hover:text-teal-600">
                          {isNe ? 'छनोट गर्नुहोस्' : 'Select'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{user.phone || (isNe ? 'सम्पर्क नम्बर छैन' : 'No phone')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>
                          {[user.municipality, user.district].filter(Boolean).join(', ') ||
                            user.province ||
                            (isNe ? 'ठेगाना छैन' : 'No address')}
                        </span>
                      </div>
                      {user.citizenship_no ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <Hash className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{isNe ? `नागरिकता: ${user.citizenship_no}` : `Citizenship: ${user.citizenship_no}`}</span>
                        </div>
                      ) : user.pan_number ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{`PAN: ${user.pan_number}`}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* 2. Business Profiles */}
                {businesses && businesses.length > 0 ? (
                  businesses.map((biz) => {
                    const isSelected = selectedAutoFillSource === biz.id;
                    return (
                      <div
                        key={biz.id}
                        onClick={() => {
                          setSelectedAutoFillSource(biz.id);
                          handleAutoFill(biz.id);
                        }}
                        className={`group relative flex flex-col justify-between rounded-2xl p-4 transition-all cursor-pointer text-left border ${
                          isSelected
                            ? 'border-[#123B5D] bg-gradient-to-b from-sky-50/80 to-white shadow-sm ring-2 ring-[#123B5D]/25'
                            : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50/50 shadow-2xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-xl text-white font-bold text-xs ${
                                  isSelected
                                    ? 'bg-[#123B5D]'
                                    : 'bg-slate-400 group-hover:bg-[#123B5D]/80'
                                }`}
                              >
                                <Building2 className="h-4 w-4" />
                              </div>
                              <div>
                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md">
                                  {biz.business_type || (isNe ? 'संस्थागत / कम्पनी' : 'Business')}
                                </span>
                                <h3 className="text-xs sm:text-sm font-bold text-[#123B5D] truncate max-w-[160px]">
                                  {biz.name}
                                </h3>
                              </div>
                            </div>

                            {isSelected ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-[#123B5D] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                                <CheckCircle2 className="h-3 w-3 text-teal-600" />
                                <span>{isNe ? 'लागू भएको' : 'Active'}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#123B5D]">
                                {isNe ? 'छनोट गर्नुहोस्' : 'Select'}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 truncate">
                              <CreditCard className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{`PAN/VAT: ${biz.pan_vat_number || 'N/A'}`}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>
                                {[biz.municipality, biz.district].filter(Boolean).join(', ') ||
                                  biz.province ||
                                  (isNe ? 'ठेगाना छैन' : 'No address')}
                              </span>
                            </div>
                            {biz.directors && biz.directors.length > 0 && (
                              <div className="flex items-center gap-1.5 truncate text-[#18A999] font-medium">
                                <Users className="h-3 w-3 shrink-0" />
                                <span>
                                  {isNe
                                    ? `${biz.directors.length} सञ्चालकहरू समावेश`
                                    : `${biz.directors.length} director(s)`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : null}

                {/* If no businesses yet, show prompt to add business profile */}
                {(!businesses || businesses.length === 0) && (
                  <Link
                    href="/user/profile"
                    target="_blank"
                    className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 text-center hover:border-teal-300 hover:bg-teal-50/30 transition cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-xl bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-400 group-hover:text-teal-600 transition mb-1.5">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 group-hover:text-[#123B5D]">
                      {isNe ? '+ कम्पनी प्रोफाइल थप्नुहोस्' : '+ Add Business Profile'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isNe
                        ? 'संस्थागत विवरणहरू प्रोफाइलमा बचत गर्नुहोस्'
                        : 'Save business details for 1-click filing'}
                    </p>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-xs font-medium text-[#123B5D] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-bold text-xs">
                  <Info className="h-4 w-4 text-teal-600" />
                </span>
                <div>
                  <p className="font-bold text-[#123B5D]">
                    {isNe ? 'सुझाव: सुरक्षित विवरणबाट स्वतः भर्न चाहनुहुन्छ?' : 'Want to auto-fill with your saved profiles?'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isNe
                      ? 'लगइन गरेर आफ्नो व्यक्तिगत वा कम्पनीको सुरक्षित विवरण १-क्लिकमा फारममा भर्न सक्नुहुन्छ।'
                      : 'Log in to auto-populate your personal or business profile details in one click.'}
                  </p>
                </div>
              </div>
              <Link
                href={`/login?redirect=${encodeURIComponent(`/documents/${slug}/form`)}`}
                className="inline-flex items-center gap-1 rounded-xl bg-[#123B5D] hover:bg-[#18A999] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition"
              >
                <span>{isNe ? 'लगइन गर्नुहोस्' : 'Log In'}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <form ref={formSectionRef} onSubmit={handleSubmit} autoComplete="off" className="space-y-6 scroll-mt-24">
            {/* Multi-Step Form Stepper */}
            {fieldGroups.length > 1 && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
                {/* Top Status Header */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 text-[11px] font-bold text-[#148C7E]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#18A999] animate-pulse" />
                      {isNe
                        ? `चरण ${toDevanagariDigits(activeTabIndex + 1)} / ${toDevanagariDigits(fieldGroups.length)}`
                        : `Step ${activeTabIndex + 1} of ${fieldGroups.length}`}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#123B5D] truncate max-w-[200px] sm:max-w-md">
                      {isNe ? fieldGroups[activeTabIndex]?.titleNe : fieldGroups[activeTabIndex]?.titleEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-bold text-slate-600 font-outfit">
                      {Math.round(((activeTabIndex + 1) / fieldGroups.length) * 100)}% {isNe ? 'सकियो' : 'Completed'}
                    </span>
                    <div className="w-16 sm:w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-[#18A999] transition-all duration-300 rounded-full"
                        style={{ width: `${((activeTabIndex + 1) / fieldGroups.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Connected Stepper Flow */}
                <div className="overflow-x-auto no-scrollbar py-1">
                  <div className="flex items-start justify-between min-w-[500px] sm:min-w-0 sm:w-full">
                    {fieldGroups.map((group, idx) => {
                      const isActive = activeTabIndex === idx;
                      const isPast = idx < activeTabIndex;
                      const hasErr = group.fields.some(f => fieldErrors[f.key]);
                      const isComplete = group.fields.every(f => !f.required || (formData[f.key] && formData[f.key].trim() !== ''));

                      return (
                        <div key={group.id} className="flex items-start flex-1 last:flex-none">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTabIndex(idx);
                            }}
                            className="flex flex-col items-center text-center group cursor-pointer focus:outline-none w-full max-w-[130px] transition-all"
                          >
                            {/* Step Circle */}
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                isActive
                                  ? 'bg-[#123B5D] text-white shadow-md ring-4 ring-teal-100 scale-105'
                                  : hasErr
                                  ? 'bg-rose-500 text-white shadow-xs ring-4 ring-rose-100'
                                  : isComplete
                                  ? 'bg-[#18A999] text-white shadow-xs ring-4 ring-teal-50 group-hover:scale-105'
                                  : 'bg-white border-2 border-slate-300 text-slate-500 group-hover:border-teal-400 group-hover:text-slate-800'
                              }`}
                            >
                              {hasErr ? (
                                <span>!</span>
                              ) : isComplete && !isActive ? (
                                <Check className="h-4 w-4 stroke-[2.5]" />
                              ) : (
                                <span>{isNe ? toDevanagariDigits(idx + 1) : idx + 1}</span>
                              )}
                            </div>

                            {/* Step Title Label */}
                            <span
                              className={`mt-2 text-xs leading-tight transition-colors line-clamp-2 px-1 ${
                                isActive
                                  ? 'font-bold text-[#123B5D]'
                                  : isComplete
                                  ? 'font-semibold text-teal-800 group-hover:text-[#123B5D]'
                                  : 'font-medium text-slate-500 group-hover:text-slate-800'
                              }`}
                            >
                              {isNe ? group.titleNe : group.titleEn}
                            </span>

                            {/* Sub-label */}
                            <span className="text-[10px] mt-0.5">
                              {hasErr ? (
                                <span className="text-rose-600 font-bold">{isNe ? 'सच्याउनुहोस्' : 'Fix error'}</span>
                              ) : isComplete && !isActive ? (
                                <span className="text-[#148C7E] font-medium">{isNe ? 'सकियो' : 'Done'}</span>
                              ) : isActive ? (
                                <span className="text-[#123B5D] font-bold">{isNe ? 'भरिँदैछ' : 'Active'}</span>
                              ) : (
                                <span className="text-slate-400 font-medium">{isNe ? `चरण ${toDevanagariDigits(idx + 1)}` : `Step ${idx + 1}`}</span>
                              )}
                            </span>
                          </button>

                          {/* Connecting Line to next step */}
                          {idx < fieldGroups.length - 1 && (
                            <div className="flex-1 mx-2 sm:mx-3 h-0.5 self-start mt-4 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  isComplete || isPast ? 'bg-[#18A999]' : 'bg-transparent'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Active Group Form Card */}
            {(() => {
              const group = fieldGroups[activeTabIndex] || fieldGroups[0];
              if (!group) return null;

              return (
                <div
                  key={group.id}
                  className="relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs"
                >
                  <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200/90 text-[#18A999] shadow-2xs">
                        {group.icon}
                      </span>
                      <div>
                        <h2 className="text-sm sm:text-base font-extrabold text-[#123B5D] tracking-tight">
                          {isNe ? group.titleNe : group.titleEn}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isNe ? group.subtitleNe : group.subtitleEn}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.id === 'present_members' && (
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={memberCount >= 8}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-[#148C7E] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:from-teal-600 hover:to-[#0f6c61] transition disabled:opacity-50 cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>{isNe ? 'सदस्य थप्नुहोस्' : 'Add Member'}</span>
                        </button>
                      )}
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[10px] font-bold text-[#148C7E] font-outfit">
                        {group.id === 'present_members'
                          ? `${isNe ? toDevanagariDigits(memberCount) : memberCount} ${isNe ? 'सदस्यहरू' : 'Members'}`
                          : `${isNe ? toDevanagariDigits(group.fields.length) : group.fields.length} ${isNe ? 'फिल्डहरू' : 'Fields'}`}
                      </span>
                    </div>
                  </div>

                  {group.id === 'present_members' ? (
                    <div className="space-y-4">
                      {Array.from({ length: memberCount }).map((_, mIdx) => {
                        const memberNumber = mIdx + 1;
                        const nameField = group.fields.find((f) => f.key === `member_${memberNumber}.name`);
                        const desigField = group.fields.find((f) => f.key === `member_${memberNumber}.designation`);

                        return (
                          <div
                            key={`member_box_${memberNumber}`}
                            className="rounded-2xl border border-teal-100/90 bg-gradient-to-b from-teal-50/20 to-white p-4.5 space-y-3.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between border-b border-teal-50 pb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100/80 text-[#148C7E] text-[11px] font-bold font-mono">
                                  {isNe ? toDevanagariDigits(memberNumber) : memberNumber}
                                </span>
                                <span className="text-xs font-bold text-[#123B5D]">
                                  {memberNumber === 1
                                    ? (isNe ? 'सदस्य १ (बैठक अध्यक्ष / एकल सञ्चालक)' : 'Member 1 (Chairperson / Director)')
                                    : (isNe ? `सदस्य ${toDevanagariDigits(memberNumber)}` : `Member ${memberNumber}`)}
                                </span>
                                {memberNumber === 1 && (
                                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 font-semibold">
                                    {isNe ? 'बैठक अध्यक्ष' : 'Chairperson'}
                                  </span>
                                )}
                              </div>

                              {memberNumber > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(memberNumber)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>{isNe ? 'हटाउनुहोस्' : 'Remove'}</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {(() => {
                                const resolvedNameField: FormField = nameField || {
                                  key: `member_${memberNumber}.name`,
                                  type: 'text',
                                  label: `Member ${memberNumber} Full Name ${memberNumber === 1 ? '(Chairperson)' : '(Optional)'}`,
                                  label_np: `उपस्थित सदस्य ${toDevanagariDigits(memberNumber)} को पूरा नाम ${memberNumber === 1 ? '(बैठक अध्यक्ष)' : ''}`,
                                  placeholder: isNe ? (memberNumber === 1 ? 'बैठक अध्यक्षको पूरा नाम' : `सदस्य ${toDevanagariDigits(memberNumber)} को पूरा नाम`) : `Member ${memberNumber} full name`,
                                  required: memberNumber === 1,
                                  options: null,
                                  visible_when: null,
                                  validation_rules: null,
                                  nepali_script_required: false,
                                  sort_order: 20 + memberNumber * 2,
                                  group: 'present_members',
                                };

                                const resolvedDesigField: FormField = desigField || {
                                  key: `member_${memberNumber}.designation`,
                                  type: 'text',
                                  label: `Member ${memberNumber} Designation (पद)`,
                                  label_np: `सदस्य ${toDevanagariDigits(memberNumber)} को पद (Designation)`,
                                  placeholder: memberNumber === 1 ? 'उदा: सञ्चालक / प्रोप्राइटर' : 'उदा: सञ्चालक',
                                  required: memberNumber === 1,
                                  options: null,
                                  visible_when: null,
                                  validation_rules: null,
                                  nepali_script_required: false,
                                  sort_order: 21 + memberNumber * 2,
                                  group: 'present_members',
                                };

                                return (
                                  <>
                                    <div className="space-y-1.5">
                                      <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                          <span>
                                            {isNe && resolvedNameField.label_np
                                              ? resolvedNameField.label_np
                                              : resolvedNameField.label}
                                          </span>
                                          {resolvedNameField.required && <span className="text-rose-500 font-bold">*</span>}
                                        </span>
                                      </label>
                                      {renderFieldInput(resolvedNameField)}
                                      {fieldErrors[resolvedNameField.key] && (
                                        <p className="text-[11px] font-semibold text-rose-600 animate-in fade-in">
                                          {fieldErrors[resolvedNameField.key]}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-1.5">
                                      <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                                        <span className="flex items-center gap-1.5">
                                          <span>
                                            {isNe && resolvedDesigField.label_np
                                              ? resolvedDesigField.label_np
                                              : resolvedDesigField.label}
                                          </span>
                                          {resolvedDesigField.required && <span className="text-rose-500 font-bold">*</span>}
                                        </span>
                                      </label>
                                      {renderFieldInput(resolvedDesigField)}
                                      {fieldErrors[resolvedDesigField.key] && (
                                        <p className="text-[11px] font-semibold text-rose-600 animate-in fade-in">
                                          {fieldErrors[resolvedDesigField.key]}
                                        </p>
                                      )}
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                      {group.fields.map((f, idx) => {
                        const isWide =
                          f.type === 'address' ||
                          f.type === 'textarea' ||
                          f.key.toLowerCase().includes('address') ||
                          (group.fields.length % 2 === 1 && idx === group.fields.length - 1);
                        const label = isNe && f.label_np ? f.label_np : f.label;
                        const err = fieldErrors[f.key];

                        return (
                          <div
                            key={f.key || idx}
                            className={`${isWide ? 'col-span-1 md:col-span-2' : 'col-span-1'} space-y-1.5`}
                          >
                            <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <span className="text-[#123B5D]">{label}</span>
                                {f.required ? (
                                  <span className="text-rose-500 font-bold" title={isNe ? 'अनिवार्य' : 'Required'}>*</span>
                                ) : (
                                  <span className="text-[10px] font-normal text-slate-400">
                                    ({isNe ? 'ऐच्छिक' : 'Optional'})
                                  </span>
                                )}
                              </span>
                              {f.key.toLowerCase().includes('date_bs') && (
                                <span className="text-[10px] text-teal-700 font-semibold font-mono bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                                  वि.सं. (B.S.)
                                </span>
                              )}
                            </label>

                            {renderFieldInput(f)}

                            {err && (
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 animate-in fade-in pt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>{err}</span>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Multi-Step Wizard Navigation Controls */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-slate-100">
                    {/* Previous Button */}
                    {activeTabIndex > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTabIndex((prev) => Math.max(0, prev - 1));
                          formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{isNe ? 'अघिल्लो चरण' : 'Previous Step'}</span>
                      </button>
                    ) : (
                      <div className="hidden sm:block" />
                    )}

                    {/* Step indicator on mobile */}
                    <span className="text-xs text-slate-400 font-medium">
                      {isNe
                        ? `चरण ${toDevanagariDigits(activeTabIndex + 1)} / ${toDevanagariDigits(fieldGroups.length)}`
                        : `Step ${activeTabIndex + 1} of ${fieldGroups.length}`}
                    </span>

                    {/* Next Step or Submit Button */}
                    {activeTabIndex < fieldGroups.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTabIndex((prev) => Math.min(fieldGroups.length - 1, prev + 1));
                          formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#18A999] hover:bg-[#148C7E] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-500/20 transition cursor-pointer w-full sm:w-auto justify-center"
                      >
                        <span>{isNe ? 'पछिल्लो चरणमा जानुहोस्' : 'Next Step'}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn-shimmer widget-click inline-flex items-center gap-2 rounded-2xl bg-[#18A999] hover:bg-[#148C7E] px-7 py-3 text-xs font-bold text-white shadow-md shadow-teal-500/25 transition cursor-pointer disabled:opacity-60 w-full sm:w-auto justify-center"
                      >
                        <span>
                          {submitting
                            ? isNe
                              ? editOrderNo ? 'विवरण अद्यावधिक हुँदैछ...' : 'अर्डर सिर्जना हुँदैछ...'
                              : editOrderNo ? 'Updating Details...' : 'Creating Order...'
                            : editOrderNo
                            ? isNe
                              ? 'विवरण अद्यावधिक गरी डाउनलोडमा फर्कनुहोस्'
                              : 'Save & Return to Download'
                            : isNe
                            ? 'अगाडि बढ्नुहोस् (भुक्तानी तथा डाउनलोड)'
                            : 'Proceed to Checkout & Download'}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Quick Final Submit Option when on earlier tabs */}
            {fieldGroups.length > 1 && activeTabIndex < fieldGroups.length - 1 && (
              <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-500">
                <span>
                  {isNe
                    ? 'सबै चरणहरू भरी सकेपछि सिधै सुरक्षित गर्न सक्नुहुन्छ:'
                    : 'You can submit whenever ready:'}
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="font-bold text-[#18A999] hover:text-[#148C7E] hover:underline cursor-pointer"
                >
                  {isNe ? 'सबै विवरण सुरक्षित गरी अगाडि बढ्नुहोस् →' : 'Save & Proceed Directly →'}
                </button>
              </div>
            )}

            {/* Security Assurance Card */}
            <div className="flex items-center gap-3 rounded-2xl bg-teal-50/70 p-4 text-[11px] text-[#123B5D] border border-teal-100 shadow-2xs">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#18A999]" />
              <span>
                {isNe
                  ? 'तपाईंको व्यक्तिगत विवरण उच्चस्तरको इन्क्रिप्सनबाट सुरक्षित रहन्छ र आधिकारिक कागजात निर्माण बाहेक अन्त प्रयोग हुँदैन।'
                  : 'Your information is fully encrypted and utilized solely for generating this verified legal document.'}
              </span>
            </div>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/documents"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#123B5D] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isNe ? 'कागजात सूचीमा फर्कनुहोस्' : 'Back to Documents Catalog'}</span>
            </Link>
          </div>
        </div>

        {/* RIGHT: Live A4 Document Preview (When Split is active) - Temporarily commented out
        {viewMode === 'split' && docLayout && (
          <div className="lg:col-span-6 sticky top-6 max-h-[85vh] overflow-y-auto pr-1 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-[#123B5D]">
                  {isNe ? 'प्रत्यक्ष कागजात अवलोकन (Live A4 Preview)' : 'Real-time Live Document Preview'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {isNe ? 'फारम भर्दा स्वतः भरिनेछ' : 'Updates as you type'}
              </span>
            </div>

            {slug === 'company-registration-suite' && (
              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                {[
                  { id: 'app', label: isNe ? '१. दरखास्त निवेदन' : '1. Application' },
                  { id: 'moa', label: isNe ? '२. प्रबन्धपत्र (MOA)' : '2. MOA' },
                  { id: 'aoa', label: isNe ? '३. नियमावली (AOA)' : '3. AOA' },
                  { id: 'res', label: isNe ? '४. बैठक निर्णय' : '4. Minutes' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSuiteTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      suiteTab === tab.id
                        ? 'bg-[#123B5D] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            {(slug === 'annual-compliance-suite' || slug === 'agm-section51-annual-return') && (
              <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                {[
                  { id: 'app', label: isNe ? '१. निवेदन (वार्षिक विवरण)' : '1. Application' },
                  { id: 'bod', label: isNe ? '२. संचालक बैठक' : '2. Board Meeting' },
                  { id: 'agm', label: isNe ? '३. साधारण सभा' : '3. AGM Minutes' },
                  { id: 'dafa51', label: isNe ? '४. दफा ५१ विवरण' : '4. Section 51' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSuiteTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      suiteTab === tab.id
                        ? 'bg-[#123B5D] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="w-full flex justify-center bg-slate-200/70 rounded-2xl p-3 border border-slate-200 overflow-x-auto shadow-inner">
              {renderLiveDocumentPaper()}
            </div>
          </div>
        )}
        */}
      </div>
    </div>
  );
}
