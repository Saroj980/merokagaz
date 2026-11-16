'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { useLanguage } from '@/lib/i18n';
import { api, AdminTemplateItem, Document } from '@/lib/api';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';
import toast, { alertModal } from '@/lib/toast';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Search,
  CheckCircle2,
  Clock,
  FileCheck,
  Building2,
  GitBranch,
  Code,
  FileText,
  SlidersHorizontal,
  Printer,
  FileBadge2,
  Stamp,
  BookOpen,
  SplitSquareVertical,
  Check,
  Sparkles,
  Globe,
} from 'lucide-react';

export type PaperMode = 'full_header_footer' | 'plain_preprinted' | 'legal_deed';

interface EditableField {
  _id?: string;
  key: string;
  type: string;
  group?: string;
  label: string;
  label_np: string;
  placeholder: string;
  required: boolean;
  options_raw?: string;
}

export const FIELD_GROUP_OPTIONS: SelectOption[] = [
  { value: 'personal', label: '👤 Personal Details (व्यक्तिगत विवरण)' },
  { value: 'family', label: '👨‍👩‍👦 Family & Guardian (पारिवारिक विवरण)' },
  { value: 'address', label: '📍 Address Hierarchy (ठेगाना विवरण)' },
  { value: 'additional', label: '📄 Additional / Other (थप विवरण)' },
];

export const FIELD_TYPE_OPTIONS: SelectOption[] = [
  { value: 'text', label: 'Text (साधारण पाठ्य / Romanized Nepali)' },
  { value: 'address', label: 'Address / ठेगाना (प्रदेश, जिल्ला, पालिका, वडा)' },
  { value: 'phone', label: 'Phone / Mobile (मोबाइल)' },
  { value: 'email', label: 'Email Address (इमेल)' },
  { value: 'number', label: 'Number / Amount (संख्या / रकम)' },
  { value: 'date_bs', label: 'Date (वि.सं. / मिति)' },
  { value: 'date_ad', label: 'Date (A.D. / अंग्रेजी मिति)' },
  { value: 'pan', label: 'PAN Number (स्थायी लेखा नं)' },
  { value: 'citizenship', label: 'Citizenship No (नागरिकता प्रमाणपत्र नं)' },
  { value: 'select', label: 'Dropdown Select (छनोट सूची)' },
  { value: 'textarea', label: 'Textarea (लामो विवरण / कैफियत)' },
  { value: 'file', label: 'File Upload (कागजात अपलोड)' },
];

interface DocLayoutConfig {
  header: string;
  office: string;
  subject: string;
  body: string;
  declaration: string;
  signatory: string;
  authority: string;
  showEmblem: boolean;
  showWatermark: boolean;
  // Paper & Layout Mode settings
  paperMode: PaperMode; // 'full_header_footer' | 'plain_preprinted' | 'legal_deed'
  showHeader: boolean;
  showFooter: boolean;
  showDateRef: boolean;
  showPageNumber: boolean;
  topMarginMm: number; // e.g. 15 for normal, 45-60 for preprinted letterhead clearance
  bottomMarginMm: number;
  paperSize: 'A4' | 'Legal';
  fontFamily?: 'outfit' | 'serif';
}

const DEFAULT_STARTER_FIELDS: EditableField[] = [
  {
    _id: 'default_applicant_full_name',
    key: 'applicant.full_name',
    type: 'text',
    label: 'Applicant Full Legal Name',
    label_np: 'आवेदकको पूरा नाम थर',
    placeholder: 'e.g. Ram Bahadur Thapa',
    required: true,
  },
  {
    _id: 'default_applicant_citizenship_no',
    key: 'applicant.citizenship_no',
    type: 'text',
    label: 'Citizenship Certificate No.',
    label_np: 'नागरिकता प्रमाणपत्र नम्बर',
    placeholder: 'उदा. १२-०१-७५-०१२३४',
    required: true,
  },
  {
    _id: 'default_applicant_phone',
    key: 'applicant.phone',
    type: 'phone',
    label: 'Mobile Number',
    label_np: 'मोबाइल नम्बर',
    placeholder: '98XXXXXXXX',
    required: true,
  },
  {
    _id: 'default_applicant_permanent_address',
    key: 'applicant.permanent_address',
    type: 'address',
    label: 'Permanent Address',
    label_np: 'स्थायी ठेगाना',
    placeholder: 'उदा. काठमाडौं महानगरपालिका - १०',
    required: true,
  },
];

function getDefaultDocTemplate(docName: string = '', dept: string = 'IRD'): DocLayoutConfig {
  const nameLower = docName.toLowerCase();
  const isLegal = dept === 'LEGAL' || nameLower.includes('rent') || nameLower.includes('agreement') || nameLower.includes('बहाल') || nameLower.includes('तमसुक') || nameLower.includes('लिखत');

  if (dept === 'IRD' || nameLower.includes('pan') || nameLower.includes('tax') || nameLower.includes('vat')) {
    return {
      header: '',
      office: 'श्रीमान् कार्यालय प्रमुख ज्यू,\nकरदाता सेवा कार्यालय,\nकाठमाडौँ, नेपाल।',
      subject: 'विषय: व्यक्तिगत स्थायी लेखा नम्बर (PAN) उपलब्ध गराइदिने सम्बन्धमा।',
      body: `महोदय,\n\nउपरोक्त सम्बन्धमा म निवेदकले नेपाल सरकारको प्रचलित आयकर ऐन तथा नियमहरू बमोजिम व्यक्तिगत स्थायी लेखा नम्बर (PAN) प्राप्त गर्नका लागि आवश्यक विवरण तथा कागजात संलग्न राखी यो निवेदन पेश गरेको छु। मेरो व्यक्तिगत विवरण तपसिल बमोजिम रहेको छ:\n\n१. निवेदकको पूरा नाम: {{applicant.full_name}}\n२. नागरिकता प्रमाणपत्र नम्बर: {{applicant.citizenship_no}}\n३. सम्पर्क मोबाइल नम्बर: {{applicant.phone}}\n४. स्थायी बसोबासको ठेगाना: {{applicant.permanent_address}}\n\nमाथि उल्लिखित सम्पूर्ण विवरण सत्य तथ्य छ। यसमा कुनै फरक परेमा कानुन बमोजिम जवाफदेही हुन म मन्जुर गर्दछु। अतः मलाई व्यक्तिगत स्थायी लेखा नम्बर (PAN) उपलब्ध गराइदिनुहुन सादर अनुरोध गर्दछु।`,
      declaration: 'संलग्न कागजातहरू: (१) नागरिकता प्रमाणपत्रको प्रतिलिपि, (२) हालसालै खिचिएको पासपोर्ट साइजको फोटो।',
      signatory: 'निवेदक',
      authority: '',
      showEmblem: false,
      showWatermark: false,
      paperMode: 'full_header_footer',
      showHeader: true,
      showFooter: true,
      showDateRef: true,
      showPageNumber: true,
      topMarginMm: 15,
      bottomMarginMm: 15,
      paperSize: 'A4',
      fontFamily: 'outfit',
    };
  } else if (dept === 'OCR' || nameLower.includes('moa') || nameLower.includes('aoa') || nameLower.includes('company')) {
    return {
      header: '',
      office: 'श्रीमान् रजिस्ट्रार ज्यू,\nकम्पनी रजिस्ट्रारको कार्यालय,\nत्रिपुरेश्वर, काठमाडौँ।',
      subject: 'विषय: कम्पनी दर्ता तथा प्रबन्धपत्र/नियमावली अभिलेख सम्बन्धमा।',
      body: `महोदय,\n\nउपरोक्त सम्बन्धमा हामी संस्थापक सेयरधनीहरूले कम्पनी ऐन, २०६३ को दफा ४ बमोजिम एक प्राइभेट लिमिटेड कम्पनी स्थापना गर्न मञ्जुर भई आवश्यक कागजात तथा विवरण संलग्न राखी यो निवेदन पेश गरेका छौँ:\n\n१. मुख्य संस्थापकको नाम: {{applicant.full_name}}\n२. नागरिकता प्रमाणपत्र नम्बर: {{applicant.citizenship_no}}\n३. सम्पर्क मोबाइल नम्बर: {{applicant.phone}}\n४. स्थायी ठेगाना: {{applicant.permanent_address}}\n\nहामी संस्थापकहरू यस कम्पनीका सम्पूर्ण नियम तथा सर्तहरू पालना गर्न प्रतिबद्ध छौँ। अतः माग बमोजिम कम्पनी दर्ता गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन अनुरोध गर्दछौँ।`,
      declaration: 'संलग्न कागजातहरू: (१) प्रस्तावित प्रबन्धपत्र तथा नियमावली, (२) संस्थापकहरूको नागरिकता प्रतिलिपि।',
      signatory: 'मुख्य संस्थापक / निवेदक',
      authority: '',
      showEmblem: false,
      showWatermark: false,
      paperMode: 'full_header_footer',
      showHeader: true,
      showFooter: true,
      showDateRef: true,
      showPageNumber: true,
      topMarginMm: 15,
      bottomMarginMm: 15,
      paperSize: 'A4',
      fontFamily: 'outfit',
    };
  } else if (isLegal) {
    return {
      header: 'नेपाली कानुनी लिखत तथा करारनामा सम्झौता\n(मुलुकी देवानी संहिता, २०७४ को अधीनमा)',
      office: '',
      subject: 'घर / कोठा / व्यावसायिक सटर बहाल सम्झौता लिखत',
      body: `लिखितम् प्रथम पक्ष (घरधनी) र दोस्रो पक्ष (बहालवाला) बीच मुलुकी देवानी संहिता, २०७४ को अधीनमा रही आपसी समझदारीमा निम्न सर्तहरूको अधीनमा यो बहाल सम्झौता सम्पन्न गरिएको छ:\n\n१. दोस्रो पक्ष (बहालवाला व्यक्ति): {{applicant.full_name}}\n२. नागरिकता प्रमाणपत्र नं: {{applicant.citizenship_no}}\n३. स्थायी ठेगाना: {{applicant.permanent_address}}\n४. सम्पर्क मोबाइल नम्बर: {{applicant.phone}}\n५. बहाल अवधि: सम्झौता भएको मितिदेखि २ (दुई) वर्षसम्मका लागि।\n६. मासिक बहाल रकम: आपसी सहमति अनुसार प्रत्येक महिनाको ५ गतेभित्र चुक्ता गरिनेछ।\n\nसर्तहरू:\n१. बहालमा लिएको परिसरमा कुनै गैरकानुनी वा समाजलाई असर पर्ने गतिविधि गर्न पाइने छैन।\n२. विद्युत तथा पानीको महसुल उपभोग अनुसार दोस्रो पक्षले समयमै भुक्तानी गर्नुपर्नेछ।`,
      declaration: 'हामी दुवै पक्षले यस सम्झौताका सबै सर्तहरू होस-हवासमा बिना दबाब पढी बुझी साक्षीहरूका रोहबरमा हस्ताक्षर गरी एक-एक प्रति लियौँ।',
      signatory: 'दोस्रो पक्ष (बहालवाला)',
      authority: 'प्रथम पक्ष (घरधनी)',
      showEmblem: false,
      showWatermark: false,
      paperMode: 'legal_deed',
      showHeader: true,
      showFooter: true,
      showDateRef: true,
      showPageNumber: true,
      topMarginMm: 15,
      bottomMarginMm: 15,
      paperSize: 'A4',
      fontFamily: 'outfit',
    };
  } else {
    return {
      header: '',
      office: 'श्रीमान् वडा अध्यक्ष ज्यू,\nस्थानीय तह तथा वडा कार्यालय,\nकाठमाडौँ, नेपाल।',
      subject: 'विषय: स्थायी बसोबास / चारकिल्ला सिफारिस पाउँ भनी दिइएको निवेदन।',
      body: `महोदय,\n\nउपरोक्त सम्बन्धमा म निवेदक यसै वडाको स्थायी बासिन्दा भएकोले मलाई आवश्यक प्रशासनिक तथा कानुनी प्रयोजनका लागि स्थायी बसोबास सिफारिस पत्रको आवश्यकता परेको हुँदा मेरो व्यक्तिगत विवरण तपसिल बमोजिम पेश गर्दछु:\n\n१. निवेदकको पूरा नाम: {{applicant.full_name}}\n२. नागरिकता प्रमाणपत्र नम्बर: {{applicant.citizenship_no}}\n३. स्थायी बसोबासको ठेगाना: {{applicant.permanent_address}}\n४. सम्पर्क मोबाइल नम्बर: {{applicant.phone}}\n\nमाथि उल्लिखित सम्पूर्ण विवरण सत्य साँचो हो। अतः माग बमोजिमको सिफारिस पत्र जारी गरिदिनुहुन सादर अनुरोध गर्दछु।`,
      declaration: 'संलग्न कागजातहरू: (१) नागरिकता प्रमाणपत्रको प्रतिलिपि, (२) घरजग्गा कर वा विद्युत महसुल तिरेको रसिद।',
      signatory: 'निवेदक',
      authority: '',
      showEmblem: false,
      showWatermark: false,
      paperMode: 'full_header_footer',
      showHeader: true,
      showFooter: true,
      showDateRef: true,
      showPageNumber: true,
      topMarginMm: 15,
      bottomMarginMm: 15,
      paperSize: 'A4',
      fontFamily: 'outfit',
    };
  }
}

export default function AdminTemplatesPage() {
  const { lang } = useLanguage();
  const isNe = lang === 'ne';

  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string>('');
  const [templates, setTemplates] = useState<AdminTemplateItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // ─── Modal States ─────────────────────────────────────────────────────────
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplateItem | null>(null);
  const [editorSubmitting, setEditorSubmitting] = useState(false);

  // Form Editor Fields
  const [formName, setFormName] = useState('');
  const [formDocVersionId, setFormDocVersionId] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'qa' | 'published'>('draft');
  const [formPdfPath, setFormPdfPath] = useState('');
  const [formQaNotes, setFormQaNotes] = useState('');
  const [formFields, setFormFields] = useState<EditableField[]>(DEFAULT_STARTER_FIELDS);

  // Document Template Layout State
  const [docLayout, setDocLayout] = useState<DocLayoutConfig>(getDefaultDocTemplate());
  const [docLayoutStudioView, setDocLayoutStudioView] = useState<'split' | 'form'>('split');
  const [isPaperConfigOpen, setIsPaperConfigOpen] = useState(false);

  // Editor Tabs: 'doc_layout' | 'fields' | 'split' | 'live_doc'
  const [editorTab, setEditorTab] = useState<'doc_layout' | 'fields' | 'split' | 'live_doc'>('doc_layout');

  // Standalone Document Preview Modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<AdminTemplateItem | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<'doc' | 'form' | 'split'>('doc');
  const [previewPaperModeOverride, setPreviewPaperModeOverride] = useState<PaperMode | null>(null);

  // Live Interactive Form Simulator State
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({
    'applicant.full_name': 'राम बहादुर थापा',
    'applicant.citizenship_no': '१२-०१-७५-०१२३४',
    'applicant.phone': '९८४१२३४५६७',
    'applicant.permanent_address': 'काठमाडौं महानगरपालिका - १०, बागमती',
  });

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mk_admin_token') || '';
    setToken(stored);
    loadAll(stored);
  }, []);

  async function loadAll(t = token) {
    setLoading(true);
    try {
      const [tplRes, docsRes] = await Promise.allSettled([
        api.admin.templates.list(t),
        t ? api.admin.documents.list(t, { per_page: '100' }) : api.documents.list(),
      ]);

      if (tplRes.status === 'fulfilled') {
        const raw = tplRes.value;
        const list = Array.isArray(raw) ? raw : (raw as any).data || [];
        setTemplates(list);
      }
      if (docsRes.status === 'fulfilled') {
        const raw = docsRes.value;
        const list = Array.isArray(raw) ? raw : (raw as any).data || [];
        setDocuments(list);
      }
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'डाटा लोड गर्न सकिएन।' : 'Failed to load data.'));
    } finally {
      setLoading(false);
    }
  }

  // ─── Memoized Document Versions List for CustomSelect ─────────────────────
  const documentVersionOptions = useMemo<SelectOption[]>(() => {
    const list: SelectOption[] = [];
    const seenIds = new Set<string>();

    // 1. Traverse all documents and all their versions
    documents.forEach((d) => {
      const docTitle = isNe ? (d.name_np || d.name) : d.name;
      const docDept = d.department || 'GENERAL';

      if (d.versions && d.versions.length > 0) {
        d.versions.forEach((ver) => {
          if (!seenIds.has(ver.id)) {
            seenIds.add(ver.id);
            list.push({
              value: ver.id,
              label: `${docTitle} (${ver.version_number})`,
              subLabel: `${docDept} • ${ver.is_active ? (isNe ? 'सक्रिय संस्करण' : 'Active Version') : (isNe ? 'संस्करण' : 'Version')}`,
              badge: ver.version_number,
            });
          }
        });
      } else if (d.active_version && !seenIds.has(d.active_version.id)) {
        seenIds.add(d.active_version.id);
        list.push({
          value: d.active_version.id,
          label: `${docTitle} (${d.active_version.version_number})`,
          subLabel: `${docDept} • ${isNe ? 'सक्रिय' : 'Active'}`,
          badge: d.active_version.version_number,
        });
      }
    });

    // 2. Critical Safety: If editingTemplate is open and has document_version, guarantee it is present
    if (editingTemplate && editingTemplate.document_version) {
      const curVer = editingTemplate.document_version;
      if (!seenIds.has(curVer.id)) {
        seenIds.add(curVer.id);
        const docName = curVer.document
          ? (isNe ? (curVer.document.name_np || curVer.document.name) : curVer.document.name)
          : editingTemplate.name;
        list.unshift({
          value: curVer.id,
          label: `${docName} (${curVer.version_number})`,
          subLabel: `${curVer.document?.department || 'GENERAL'} • ${isNe ? 'संलग्न संस्करण' : 'Linked Version'}`,
          badge: curVer.version_number,
        });
      }
    }

    return list;
  }, [documents, editingTemplate, isNe]);

  // ─── Modal Openers ────────────────────────────────────────────────────────
  function openCreateModal() {
    setEditingTemplate(null);
    setFormName('');
    const firstVer = documents.find((d) => d.active_version?.id)?.active_version?.id || '';
    setFormDocVersionId(firstVer);
    setFormStatus('draft');
    setFormPdfPath('');
    setFormQaNotes('');
    setFormFields(DEFAULT_STARTER_FIELDS.map((f, i) => ({ ...f, _id: `f_starter_${i}_${Date.now()}` })));
    setDocLayout(getDefaultDocTemplate('New Document', 'IRD'));
    setEditorTab('doc_layout');
    setPreviewValues({
      'applicant.full_name': 'राम बहादुर थापा',
      'applicant.citizenship_no': '१२-०१-७५-०१२३४',
      'applicant.phone': '९८४१२३४५६७',
      'applicant.permanent_address': 'काठमाडौं महानगरपालिका - १०, बागमती',
    });
    setIsEditorOpen(true);
  }

  function openEditModal(tpl: AdminTemplateItem) {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormDocVersionId(tpl.document_version_id);
    setFormStatus(tpl.status as any);
    setFormPdfPath(tpl.pdf_template_path || '');
    setFormQaNotes(tpl.qa_notes || '');

    const fieldsToSet: EditableField[] =
      tpl.fields && tpl.fields.length > 0
        ? tpl.fields.map((f: any, i: number) => ({
            _id: f.id ? `db_${f.id}` : `f_edit_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            key: f.key,
            type: f.type || 'text',
            group: f.group || '',
            label: f.label || '',
            label_np: f.label_np || '',
            placeholder: f.placeholder || '',
            required: !!f.required,
            options_raw: Array.isArray(f.options)
              ? f.options.map((o: any) => `${o.label}:${o.value}`).join(', ')
              : '',
          }))
        : DEFAULT_STARTER_FIELDS.map((f, i) => ({ ...f, _id: `f_starter_${i}_${Date.now()}` }));

    setFormFields(fieldsToSet);

    // Load document template layout from form_schema or default
    const savedLayout = (tpl.form_schema as any)?.doc_layout;
    const docName = tpl.document_version?.document?.name || tpl.name;
    const dept = tpl.document_version?.document?.department || 'IRD';
    const defaultLayout = getDefaultDocTemplate(docName, dept);

    setDocLayout({
      ...defaultLayout,
      ...savedLayout,
      showHeader: savedLayout?.showHeader !== undefined ? Boolean(savedLayout.showHeader) : true,
      showFooter: savedLayout?.showFooter !== undefined ? Boolean(savedLayout.showFooter) : true,
      showDateRef: savedLayout?.showDateRef !== undefined ? Boolean(savedLayout.showDateRef) : true,
      showWatermark: Boolean(savedLayout?.showWatermark),
    });

    setEditorTab('doc_layout');
    const defaultPreviewData: Record<string, string> = {
      'applicant.full_name': 'राम बहादुर थापा',
      'applicant.citizenship_no': '१२-०१-७५-०१२३४',
      'applicant.phone': '९८४१२३४५६७',
      'applicant.permanent_address': 'काठमाडौं महानगरपालिका - १०, बागमती',
      'company.name_np': 'भिजन लाइफ साइन्सेज',
      'company.name_en': 'Vision Life Sciences Pvt. Ltd.',
      'company.registered_address': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'company.registered_address_np': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'shareholder_1.full_name': 'लक्ष्मी राज ओझा',
      'shareholder_1.address': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'shareholder_1.address_np': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'shareholder_1.father_name': 'चन्द्र देव ओझा',
      'shareholder_1.citizenship_no': '६७-०१-७३-१२१९९',
      'shareholder_1.citizenship_district': 'कैलाली',
      'shareholder_1.shares': '२५०००',
      'witness.name': 'हरि प्रसाद न्यौपाने',
      'witness.address_np': 'धनगढी, कैलाली',
      'witness.citizenship_no': '६७-०२-७४-०१२३४',
      'witness.citizenship_district': 'कैलाली',
      'masaudakar.name': 'समिक्षा भण्डारी',
      'masaudakar.reg_no': 'प्र.नं. १८५७०',
      'iti.year': '२०८३',
      'iti.month': 'श्रावण',
      'iti.day': '६',
      'iti.roaj': '४',
      'iti.sambat': 'ईति सम्वत् २०८३ साल श्रावण महिना ६ गते रोज ४ (बुधबार) शुभम् (समय: ११:००) .................................',
    };
    setPreviewValues(defaultPreviewData);
    setIsEditorOpen(true);
  }

  function openLivePreviewModal(tpl: AdminTemplateItem, mode: 'doc' | 'form' | 'split' = 'doc') {
    setPreviewTemplate(tpl);
    setPreviewViewMode(mode);
    setPreviewPaperModeOverride(null);
    const defaultPreviewData: Record<string, string> = {
      'applicant.full_name': 'राम बहादुर थापा',
      'applicant.citizenship_no': '१२-०१-७५-०१२३४',
      'applicant.phone': '९८४१२३४५६७',
      'applicant.permanent_address': 'काठमाडौं महानगरपालिका - १०, बागमती',
      'company.name_np': 'भिजन लाइफ साइन्सेज',
      'company.name_en': 'Vision Life Sciences Pvt. Ltd.',
      'company.registered_address': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'company.registered_address_np': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'shareholder_1.full_name': 'लक्ष्मी राज ओझा',
      'shareholder_1.address': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'shareholder_1.address_np': 'कैलाली जिल्ला धनगढी उ.म.न.पा. वडा नं. ११',
      'shareholder_1.father_name': 'चन्द्र देव ओझा',
      'shareholder_1.citizenship_no': '६७-०१-७३-१२१९९',
      'shareholder_1.citizenship_district': 'कैलाली',
      'shareholder_1.shares': '२५०००',
      'witness.name': 'हरि प्रसाद न्यौपाने',
      'witness.address_np': 'धनगढी, कैलाली',
      'witness.citizenship_no': '६७-०२-७४-०१२३४',
      'witness.citizenship_district': 'कैलाली',
      'masaudakar.name': 'समिक्षा भण्डारी',
      'masaudakar.reg_no': 'प्र.नं. १८५७०',
      'iti.year': '२०८३',
      'iti.month': 'श्रावण',
      'iti.day': '६',
      'iti.roaj': '४',
      'iti.sambat': 'ईति सम्वत् २०८३ साल श्रावण महिना ६ गते रोज ४ (बुधबार) शुभम् (समय: ११:००) .................................',
    };
    setPreviewValues(defaultPreviewData);
    setIsPreviewOpen(true);
  }

  // ─── Field Manipulation ───────────────────────────────────────────────────
  function handleAddField() {
    const newIdx = formFields.length + 1;
    const newField: EditableField = {
      _id: `f_new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      key: `field_${newIdx}`,
      type: 'text',
      label: `Field Label ${newIdx}`,
      label_np: `फिल्ड शीर्षक ${newIdx}`,
      placeholder: '',
      required: false,
      options_raw: '',
    };
    setFormFields((prev) => [...prev, newField]);
    toast.success(isNe ? `नयाँ फिल्ड #${newIdx} थपियो!` : `New field #${newIdx} added!`);
  }

  function handleUpdateField(idx: number, patch: Partial<EditableField>) {
    setFormFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function handleRemoveField(idx: number) {
    if (formFields.length <= 1) {
      toast.error(isNe ? 'कम्तिमा एउटा फिल्ड हुनु आवश्यक छ।' : 'At least one field is required.');
      return;
    }
    const removedName = formFields[idx]?.label || formFields[idx]?.key || `Field #${idx + 1}`;
    setFormFields((prev) => prev.filter((_, i) => i !== idx));
    toast.success(isNe ? `फिल्ड [${removedName}] मेटाइयो।` : `Field [${removedName}] removed.`);
  }

  function insertVariableIntoDoc(varKey: string) {
    const tag = `{{${varKey}}}`;
    setDocLayout((prev) => ({
      ...prev,
      body: prev.body + ` ${tag}`,
    }));
    toast.success(`${tag} inserted into document template!`);
  }

  // ─── Save Template ────────────────────────────────────────────────────────
  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error(isNe ? 'टेम्प्लेटको नाम अनिवार्य छ।' : 'Template name is required.');
      return;
    }
    if (!formDocVersionId) {
      toast.error(isNe ? 'कागजात संस्करण छान्नुहोस्।' : 'Please select a document version.');
      return;
    }

    setEditorSubmitting(true);

    try {
      const formattedFields = formFields.map((f, i) => {
        let optionsParsed: Array<{ label: string; value: string }> | null = null;
        if (f.options_raw) {
          optionsParsed = f.options_raw
            .split(',')
            .map((opt) => {
              const parts = opt.split(':').map((s) => s.trim());
              return { label: parts[0] || opt.trim(), value: parts[1] || parts[0] || opt.trim() };
            })
            .filter((o) => o.label);
        }

        return {
          key: (f.key || `field_${i + 1}`).trim(),
          type: f.type || 'text',
          group: f.group || null,
          label: (f.label || f.key || `Field ${i + 1}`).trim(),
          label_np: (f.label_np || '').trim() || null,
          placeholder: (f.placeholder || '').trim() || null,
          required: Boolean(f.required),
          options: optionsParsed,
          sort_order: i,
        };
      });

      const payload = {
        name: formName.trim(),
        document_version_id: formDocVersionId,
        status: formStatus,
        pdf_template_path: (formPdfPath || '').trim() || null,
        qa_notes: (formQaNotes || '').trim() || null,
        fields: formattedFields,
        form_schema: {
          title: formName.trim(),
          fields_count: formattedFields.length,
          version_id: formDocVersionId,
          doc_layout: docLayout,
          updated_at: new Date().toISOString(),
        },
      };

      if (editingTemplate) {
        await api.admin.templates.update(token, editingTemplate.id, payload);
        toast.success(
          isNe
            ? 'टेम्प्लेट, फारमका फिल्डहरू र कागजात ढाँचा सुरक्षित गरियो!'
            : 'Template, form fields, and document layout saved!'
        );
      } else {
        await api.admin.templates.create(token, payload);
        toast.success(
          isNe
            ? 'नयाँ कागजात टेम्प्लेट र फारम फिल्डहरू सिर्जना गरियो!'
            : 'New document template & form fields created!'
        );
      }
      setIsEditorOpen(false);
      loadAll();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'टेम्प्लेट सुरक्षित गर्न असफल भयो।' : 'Failed to save template.'));
    } finally {
      setEditorSubmitting(false);
    }
  }

  async function handlePublishTemplate(tpl: AdminTemplateItem) {
    const confirmed = await alertModal.confirm(
      isNe ? 'टेम्प्लेट प्रकाशित (लाइभ) गर्ने?' : 'Publish Template to Live Site?',
      isNe
        ? `के तपाईं "${tpl.name}" टेम्प्लेटलाई आधिकारिक रूपमा प्रकाशित गरी वेबसाइटमा मुख्य सक्रिय फारम बनाउन चाहनुहुन्छ?`
        : `Are you sure you want to publish "${tpl.name}" and make it the live active form on the website?`,
      isNe ? 'प्रकाशित गर्नुहोस्' : 'Publish & Make Live',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.admin.templates.publish(token, tpl.id);
      toast.success(
        isNe
          ? 'टेम्प्लेट प्रकाशित गरियो र वेबसाइटमा तुरुन्त सक्रिय भयो!'
          : 'Template published and set as the live active form on website!'
      );
      loadAll();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'प्रकाशित गर्न असफल भयो।' : 'Failed to publish template.'));
    }
  }

  async function handleDeleteTemplate(tpl: AdminTemplateItem) {
    const confirmed = await alertModal.confirm(
      isNe ? 'टेम्प्लेट मेटाउने?' : 'Delete Template?',
      isNe
        ? `के तपाईं "${tpl.name}" टेम्प्लेट मेटाउन निश्चित हुनुहुन्छ?`
        : `Are you sure you want to delete template "${tpl.name}"?`,
      isNe ? 'मेटाउनुहोस्' : 'Delete',
      isNe ? 'रद्द' : 'Cancel'
    );
    if (!confirmed) return;

    try {
      await api.admin.templates.delete(token, tpl.id);
      toast.success(isNe ? 'टेम्प्लेट सफलतापूर्वक मेटाइयो।' : 'Template deleted successfully.');
      loadAll();
    } catch (err: any) {
      toast.error(err.message || (isNe ? 'टेम्प्लेट मेटाउन असफल भयो।' : 'Failed to delete template.'));
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter((tpl) => {
    const doc = tpl.document_version?.document;
    const q = search.toLowerCase();

    const matchesSearch =
      tpl.name.toLowerCase().includes(q) ||
      (doc?.name && doc.name.toLowerCase().includes(q)) ||
      (doc?.name_np && doc.name_np.includes(q)) ||
      (doc?.slug && doc.slug.toLowerCase().includes(q)) ||
      (doc?.department && doc.department.toLowerCase().includes(q));

    const matchesStatus = selectedStatus === 'all' || tpl.status === selectedStatus;
    const matchesDept =
      selectedDept === 'all' ||
      (doc?.department && doc.department.toUpperCase() === selectedDept.toUpperCase());

    return matchesSearch && matchesStatus && matchesDept;
  });

  const publishedCount = templates.filter((t) => t.status === 'published').length;
  const draftCount = templates.filter((t) => t.status === 'draft').length;
  const qaCount = templates.filter((t) => t.status === 'qa').length;

  // ─── RENDER OFFICIAL A4 DOCUMENT PAPER COMPONENT ──────────────────────────
  function renderA4Document(
    layout: DocLayoutConfig,
    fields: EditableField[] = formFields,
    activeModeOverride?: PaperMode | null
  ) {
    const effectiveMode: PaperMode = activeModeOverride || layout.paperMode || 'full_header_footer';
    const isPlainPreprinted = effectiveMode === 'plain_preprinted';
    const isLegalDeed = effectiveMode === 'legal_deed';

    const showHeader = Boolean(layout.showHeader) && !isPlainPreprinted;
    const showFooter = Boolean(layout.showFooter);
    const showDateRef = Boolean(layout.showDateRef);
    const showWatermark = Boolean(layout.showWatermark) && !isPlainPreprinted;
    const topPaddingMm = isPlainPreprinted ? (layout.topMarginMm || 50) : (layout.topMarginMm || 15);
    const fontClass = layout.fontFamily === 'serif' ? 'font-serif' : 'font-outfit font-sans';

    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(layout.body || '');
    let renderedHtml = '';
    if (hasHtmlTags) {
      renderedHtml = (layout.body || '').replace(/\{\{([a-zA-Z0-9_.-]+)\}\}/g, (_, key) => {
        const val = (previewValues[key] || '').trim();
        const field = fields.find((f) => f.key === key);
        if (val) {
          return `<span title="Field: ${key}" class="font-bold text-[#123B5D] border-b-2 border-[#18A999] px-1 inline-block">${val}</span>`;
        }
        return `<span title="फिल्ड: ${field?.label_np || field?.label || key}" class="inline-block border-b-2 border-slate-400 min-w-[130px] text-center text-[10px] text-slate-400 font-mono tracking-widest px-2 mx-1 select-none">____________________</span>`;
      });
    }

    // Process body paragraphs with variable interpolation
    const paragraphs = layout.body.split('\n\n').filter(Boolean);

    return (
      <div
        style={{
          paddingTop: `${topPaddingMm}mm`,
          paddingBottom: `${layout.bottomMarginMm || 15}mm`,
        }}
        className={`relative mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white px-8 sm:px-12 shadow-2xl rounded-sm ${fontClass} text-slate-900 flex flex-col justify-between print:shadow-none print:m-0 print:px-8 ${
          isLegalDeed
            ? 'border-4 border-double border-slate-800'
            : 'border-0 ring-0'
        }`}
      >
        {/* Pre-printed Letterhead Clearance Guide Bar (Screen only, hidden in Print) */}
        {isPlainPreprinted && (
          <div className="border-2 border-dashed border-sky-400 bg-sky-50/70 rounded-xl p-3 text-center print:hidden mb-5 animate-pulse">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-sky-800">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                ✂️ प्री-प्रिन्टेड लेटरहेडका लागि आरक्षित क्षेत्र (Letterhead Clearance: {topPaddingMm}mm)
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-sky-600">
              (तपाईंको प्रिन्टरमा पहिले नै लोगो/लेटरहेड छापिएको कागज राखिने हुनाले यो भाग कागजमा खाली छापिनेछ)
            </p>
          </div>
        )}

        {/* Background Watermark */}
        {showWatermark && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none overflow-hidden opacity-5">
            <span className="text-6xl sm:text-7xl font-black uppercase -rotate-45 tracking-widest text-slate-800 whitespace-nowrap">
              MERO KAGAZ • OFFICIAL VERIFIED
            </span>
          </div>
        )}

        <div>
          {/* Top Title/Letterhead (Optional for Agreements/Deeds/Organizations) */}
          {showHeader && layout.header && (
            <div className="flex flex-col items-center text-center border-b border-slate-300 pb-3 mb-4">
              <div className="whitespace-pre-line text-sm sm:text-base font-bold tracking-wide text-slate-900 uppercase">
                {layout.header}
              </div>
            </div>
          )}

          {/* Date Line (Top Right for Formal Applications & Letters) */}
          {showDateRef && (
            <div className="flex justify-end text-xs sm:text-sm font-medium text-slate-800 font-mono mb-3">
              <span>मिति: २०८३-०६-१५ (2026-10-01)</span>
            </div>
          )}

          {/* Addressed To (Recipient Authority / Office Block) */}
          {layout.office && (
            <div className="text-left text-xs sm:text-sm font-medium text-slate-900 leading-relaxed mb-4">
              {layout.office.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}

          {/* Official Subject Bar */}
          {layout.subject && (
            <div className="text-center my-3">
              <h3 className="inline-block border-b-2 border-slate-800 pb-0.5 text-sm sm:text-base font-extrabold text-slate-900">
                {layout.subject}
              </h3>
            </div>
          )}

          {/* Body Content with Live Variable Interpolation */}
          {hasHtmlTags ? (
            <div
              className="mt-5 text-xs sm:text-sm leading-relaxed text-slate-800"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <div className="mt-5 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-800 text-justify">
              {paragraphs.map((p, pIdx) => {
                const parts = p.split(/(\{\{[a-zA-Z0-9_.-]+\}\})/g);
                return (
                  <p key={pIdx} className="whitespace-pre-line">
                    {parts.map((part, partIdx) => {
                      const match = part.match(/^\{\{([a-zA-Z0-9_.-]+)\}\}$/);
                      if (match) {
                        const key = match[1];
                        const val = (previewValues[key] || '').trim();
                        const field = fields.find((f) => f.key === key);

                        if (val) {
                          return (
                            <span
                              key={partIdx}
                              title={`Field: ${key}`}
                              className="font-bold text-[#123B5D] border-b-2 border-[#18A999] px-1 inline-block"
                            >
                              {val}
                            </span>
                          );
                        }

                        return (
                          <span
                            key={partIdx}
                            title={`फिल्ड: ${field?.label_np || field?.label || key}`}
                            className="inline-block border-b-2 border-slate-400 min-w-[130px] text-center text-[10px] text-slate-400 font-mono tracking-widest px-2 mx-1 select-none"
                          >
                            ____________________
                          </span>
                        );
                      }
                      return <span key={partIdx}>{part}</span>;
                    })}
                  </p>
                );
              })}
            </div>
          )}

          {/* Legal Declaration */}
          {showFooter && layout.declaration && (
            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-[11px] sm:text-xs text-slate-600 italic">
              <strong>घोषणा (Declaration):</strong> {layout.declaration}
            </div>
          )}
        </div>

        {/* Footer (Signatures & Applicant Details) */}
        {showFooter ? (
          <div className="mt-8 pt-4 border-t border-slate-200">
            {isLegalDeed ? (
              /* Two-Party Agreement / Deed Signatures (First Party, Witnesses, Second Party) */
              <div className="grid grid-cols-3 gap-6 items-end">
                {/* First Party */}
                <div className="text-left">
                  <div className="h-12 border-b border-dotted border-slate-400 flex items-end pb-1 mb-1">
                    <span className="text-xs italic text-slate-400">(दस्तखत / सहिछाप)</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{layout.authority || 'प्रथम पक्ष (घरधनी)'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">दायाँ / बायाँ औंठाको छाप</p>
                </div>

                {/* Witnesses */}
                <div className="text-center">
                  <div className="h-12 border-b border-dotted border-slate-400 flex items-end justify-center pb-1 mb-1">
                    <span className="text-xs italic text-slate-400">(रोहबर साक्षीहरू)</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">रोहबर साक्षीहरू</p>
                  <p className="text-[10px] text-slate-400 font-mono">१. .................... २. ....................</p>
                </div>

                {/* Second Party / Applicant */}
                <div className="text-right">
                  <div className="h-12 border-b border-dotted border-slate-400 flex items-end justify-end pb-1 mb-1">
                    <span className="text-xs italic text-slate-400">
                      {previewValues['applicant.full_name'] ? '— हस्ताक्षर —' : '(दस्तखत)'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{layout.signatory || 'दोस्रो पक्ष (निवेदक)'}</p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    {previewValues['applicant.full_name'] || 'निवेदकको नाम'}
                  </p>
                </div>
              </div>
            ) : (
              /* Standard Citizen Application / Letter (Right-aligned Applicant Box) */
              <div className="flex justify-end">
                <div className="w-64 text-right space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {layout.signatory ? `${layout.signatory}:` : 'भवदीय / निवेदक:'}
                  </p>
                  <div className="h-12 border-b border-dotted border-slate-400 flex items-end justify-end pb-1 mb-1">
                    <span className="text-xs italic text-slate-400">
                      {previewValues['applicant.full_name'] ? '— हस्ताक्षर —' : '(दस्तखत)'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {previewValues['applicant.full_name'] || 'निवेदकको नाम'}
                  </p>
                  {previewValues['applicant.citizenship_no'] && (
                    <p className="text-[11px] text-slate-600 font-mono">
                      नागरिकता नं: {previewValues['applicant.citizenship_no']}
                    </p>
                  )}
                  {previewValues['applicant.permanent_address'] && (
                    <p className="text-[11px] text-slate-600">
                      ठेगाना: {previewValues['applicant.permanent_address']}
                    </p>
                  )}
                  {previewValues['applicant.phone'] && (
                    <p className="text-[11px] text-slate-600 font-mono">
                      फोन नं: {previewValues['applicant.phone']}
                    </p>
                  )}
                </div>
              </div>
            )}

            {layout.showPageNumber !== false && (
              <div className="mt-4 text-right text-[10px] text-slate-400 font-mono">
                पृष्ठ १ / १ (Page 1 of 1)
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 font-mono border-t pt-2">
            <span>Mero Kagaz Template Format</span>
            <span>पृष्ठ १ / १</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#123B5D] to-[#18A999] text-white shadow-sm">
                <Layers className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-extrabold text-[#123B5D]">
                {isNe ? 'PDF टेम्प्लेट स्टुडियो र इन्जिन' : 'PDF Template Studio & Engine'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {isNe
                ? 'सादा A4 (प्री-प्रिन्टेड लेटरहेडका लागि) वा पूर्ण लेटरहेड र फुटर सहितको कागजात ढाँचा सेटअप गर्नुहोस्।'
                : 'Configure whether documents print on plain A4 / pre-printed stationery letterheads or full official letterheads.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAll()}
              className="widget-click flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isNe ? 'ताजा गर्नुहोस्' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="widget-click inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#18A999] to-[#148C7E] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>{isNe ? 'नयाँ टेम्प्लेट थप्नुहोस्' : 'Add New Template'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{isNe ? 'कुल टेम्प्लेटहरू' : 'Total Templates'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-[#18A999]">
                <Layers className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-[#123B5D] font-outfit">{templates.length}</p>
            <p className="mt-1 text-[11px] text-slate-400 font-outfit">{isNe ? 'सरकारी कागजात लेआउटहरू' : 'Official layouts'}</p>
          </div>

          <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{isNe ? 'प्रकाशित (सक्रिय)' : 'Published (Live)'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-600 font-outfit">{publishedCount}</p>
            <p className="mt-1 text-[11px] text-emerald-700/80 font-medium">{isNe ? 'सार्वजनिक फारममा चालु' : 'Active on live portal'}</p>
          </div>

          <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{isNe ? 'मस्यौदा (Draft)' : 'Draft / Staging'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-amber-600 font-outfit">{draftCount}</p>
            <p className="mt-1 text-[11px] text-amber-700/80 font-medium">{isNe ? 'सम्पादनमा रहेको' : 'Editable in studio'}</p>
          </div>

          <div className="rounded-2xl border border-teal-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{isNe ? 'गुणस्तर परीक्षण (QA)' : 'QA Verified'}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <FileCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-black text-sky-600 font-outfit">{qaCount}</p>
            <p className="mt-1 text-[11px] text-sky-700/80 font-medium">{isNe ? 'स्वीकृत रेकर्डहरू' : 'Ready for production'}</p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="rounded-3xl border border-teal-200/90 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isNe ? 'टेम्प्लेट वा कागजातको नाम खोज्नुहोस्...' : 'Search template, document, or slug...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs text-slate-800 focus:border-[#18A999] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#18A999]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Department Select */}
            <div className="flex items-center gap-2">
              <CustomSelect
                value={selectedDept}
                onChange={(val) => setSelectedDept(val)}
                icon={<Building2 className="h-4 w-4" />}
                className="w-48 sm:w-56"
                options={[
                  { value: 'all', label: isNe ? 'सबै निकाय' : 'All Departments' },
                  { value: 'IRD', label: isNe ? 'आन्तरिक राजस्व (IRD)' : 'Inland Revenue (IRD)' },
                  { value: 'OCR', label: isNe ? 'कम्पनी रजिस्ट्रार (OCR)' : 'Company Registrar (OCR)' },
                  { value: 'LEGAL', label: isNe ? 'कानुनी लिखत (LEGAL)' : 'Legal Agreements (LEGAL)' },
                  { value: 'WARD', label: isNe ? 'वडा तथा स्थानीय (WARD)' : 'Local Ward (WARD)' },
                  { value: 'GENERAL', label: isNe ? 'सामान्य (GENERAL)' : 'General (GENERAL)' },
                ]}
              />
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3" />
              <span>{isNe ? 'स्थिति:' : 'Status:'}</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedStatus === 'all'
                  ? 'bg-[#123B5D] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isNe ? 'सबै' : 'All'} ({templates.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('published')}
              className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                selectedStatus === 'published'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{isNe ? 'प्रकाशित' : 'Published'}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedStatus === 'published' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {publishedCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('draft')}
              className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                selectedStatus === 'draft'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{isNe ? 'मस्यौदा (Draft)' : 'Draft'}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedStatus === 'draft' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {draftCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('qa')}
              className={`admin-btn rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                selectedStatus === 'qa'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{isNe ? 'QA परीक्षण' : 'QA Review'}</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${selectedStatus === 'qa' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {qaCount}
              </span>
            </button>
          </div>
        </div>

        {/* Template Table */}
        <div className="overflow-hidden rounded-3xl border border-teal-200/90 bg-white shadow-xs animate-admin-page-in mb-10">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isNe ? 'दर्ता गरिएका टेम्प्लेट सूची' : 'Registered Templates Ledger'}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 font-outfit">
              {isNe ? `कुल ${filteredTemplates.length} वटा टेम्प्लेट उपलब्ध` : `${filteredTemplates.length} templates available`}
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-500 font-outfit flex flex-col items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-[#18A999] mb-3" />
              <span>Loading template schemas & fields...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">
              <span className="text-3xl">🗂️</span>
              <p className="mt-2 font-bold text-slate-700">{isNe ? 'कुनै टेम्प्लेट फेला परेन।' : 'No templates found.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">{isNe ? 'टेम्प्लेटको नाम' : 'Template Details'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'जोडिएको कागजात' : 'Linked Document'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'कागज ढाँचा' : 'Paper Setup'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'फिल्ड संख्या' : 'Fields'}</th>
                    <th className="px-6 py-3.5">{isNe ? 'स्थिति' : 'Status'}</th>
                    <th className="px-6 py-3.5 text-right">{isNe ? 'कार्यहरू' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.map((tpl) => {
                    const doc = tpl.document_version?.document;
                    const docTitle = isNe ? (doc?.name_np || doc?.name) : (doc?.name || 'Linked Document');
                    const fieldsCount = (tpl as any).fields_count ?? (tpl.fields?.length || 4);
                    const savedLayout = (tpl.form_schema as any)?.doc_layout;
                    const mode = savedLayout?.paperMode || 'full_header_footer';

                    return (
                      <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Template Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#18A999] font-bold shadow-xs">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-bold text-[#123B5D] text-xs">
                                {tpl.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  ID: {tpl.id.slice(0, 10)}...
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Linked Document */}
                        <td className="px-6 py-4">
                          {doc ? (
                            <div>
                              <p className="font-bold text-slate-800 text-xs">
                                {docTitle}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.2 text-[10px] font-bold text-[#18A999] font-outfit">
                                  <Building2 className="h-2.5 w-2.5" />
                                  <span>{doc.department || 'GENERAL'}</span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-400">
                                  /{doc.slug}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No document attached</span>
                          )}
                        </td>

                        {/* Paper Setup Mode Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {mode === 'plain_preprinted' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-sky-800 font-outfit">
                              <span>📄 सादा / प्रि-प्रिन्टेड</span>
                            </span>
                          ) : mode === 'legal_deed' ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 font-outfit">
                              <span>📜 कानुनी लिखत</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#148C7E] font-outfit">
                              <span>🏛️ पूर्ण लेटरहेड</span>
                            </span>
                          )}
                        </td>

                        {/* Fields */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-[11px] font-bold text-[#148C7E] font-outfit">
                            <Code className="h-3 w-3" />
                            <span>{fieldsCount} {isNe ? 'फिल्डहरू' : 'fields'}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              tpl.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : tpl.status === 'qa'
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {tpl.status === 'published' ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            <span>
                              {tpl.status === 'published'
                                ? isNe ? 'प्रकाशित' : 'Published'
                                : tpl.status === 'qa'
                                ? isNe ? 'परीक्षण' : 'QA'
                                : isNe ? 'मस्यौदा' : 'Draft'}
                            </span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-1.5">
                          {/* Live Document A4 Preview Button */}
                          <button
                            type="button"
                            onClick={() => openLivePreviewModal(tpl, 'doc')}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-[#148C7E] transition hover:bg-teal-100"
                            title={isNe ? 'तयार हुने सरकारी कागजात A4 प्रिभ्यू हेर्नुहोस्' : 'Preview official A4 document paper'}
                          >
                            <FileText className="h-3 w-3" />
                            <span>{isNe ? 'कागजात प्रिभ्यू' : 'Doc Preview'}</span>
                          </button>

                          {/* Live Form Preview Button */}
                          <button
                            type="button"
                            onClick={() => openLivePreviewModal(tpl, 'form')}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 transition hover:bg-sky-100"
                            title={isNe ? 'ग्राहकले भर्ने अनलाइन फारम चलाएर हेर्नुहोस्' : 'Preview online input form'}
                          >
                            <Eye className="h-3 w-3" />
                            <span>{isNe ? 'फारम प्रिभ्यू' : 'Form Preview'}</span>
                          </button>

                          {/* Publish & Make Live Button */}
                          {tpl.status !== 'published' ? (
                            <button
                              type="button"
                              onClick={() => handlePublishTemplate(tpl)}
                              className="widget-click inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-xs transition hover:bg-emerald-100"
                              title={isNe ? 'आधिकारिक रूपमा प्रकाशित गरी वेबसाइटमा मुख्य सक्रिय फारम बनाउनुहोस्' : 'Publish & make live on website'}
                            >
                              <Globe className="h-3 w-3 text-emerald-600" />
                              <span>{isNe ? 'लाइभ बनाउनुहोस्' : 'Make Live'}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50/80 border border-emerald-200/80 px-2 py-1 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>{isNe ? 'वेबसाइटमा चालु' : 'Live'}</span>
                            </span>
                          )}

                          {/* Edit Template & Document Layout */}
                          <button
                            type="button"
                            onClick={() => openEditModal(tpl)}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-[#123B5D]"
                            title={isNe ? 'टेम्प्लेट तथा कागजात सम्पादन गर्नुहोस्' : 'Edit template & layout'}
                          >
                            <Edit2 className="h-3 w-3 text-slate-500" />
                            <span>{isNe ? 'सम्पादन' : 'Edit'}</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl)}
                            className="widget-click inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700 transition hover:bg-red-100"
                            title={isNe ? 'टेम्प्लेट मेटाउनुहोस्' : 'Delete template'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ─── FULL TEMPLATE & DOCUMENT STUDIO MODAL ─── */}
        {mounted && isEditorOpen && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-[1540px] h-[95vh] flex flex-col rounded-3xl border border-teal-200 bg-slate-100 shadow-2xl animate-scale-up overflow-hidden">
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-white">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-[#18A999] font-bold">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-[#123B5D]">
                      {editingTemplate
                        ? isNe ? 'सरकारी कागजात तथा टेम्प्लेट स्टुडियो' : 'Government Document & Template Studio'
                        : isNe ? 'नयाँ सरकारी कागजात टेम्प्लेट सिर्जना गर्नुहोस्' : 'Create New Document Template'}
                    </h2>
                    <p className="text-[11px] text-slate-400 font-outfit">
                      {editingTemplate ? `Template ID: ${editingTemplate.id}` : 'Configure letterhead, clearance margins, and form schema.'}
                    </p>
                  </div>
                </div>

                {/* Sub-tabs: Document Layout / Form Fields / Split / A4 Doc */}
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setEditorTab('doc_layout')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      editorTab === 'doc_layout'
                        ? 'bg-white text-[#123B5D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>{isNe ? 'कागजात तथा पृष्ठ सेटअप' : 'Doc & Paper Setup'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditorTab('fields')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      editorTab === 'fields'
                        ? 'bg-white text-[#123B5D] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>{isNe ? 'फारम फिल्डहरू' : 'Form Fields'} ({formFields.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditorTab('split')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      editorTab === 'split'
                        ? 'bg-[#18A999] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <SplitSquareVertical className="h-3.5 w-3.5" />
                    <span>{isNe ? 'स्प्लिट भ्यू (प्रिभ्यू)' : 'Split Live Preview'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditorTab('live_doc')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      editorTab === 'live_doc'
                        ? 'bg-white text-[#148C7E] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{isNe ? 'A4 कागजात' : 'A4 Document'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
                {/* Meta details always visible at top */}
                <div className="grid gap-3 sm:grid-cols-3 mb-5 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isNe ? 'टेम्प्लेटको नाम *' : 'Template Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Individual PAN Card Registration Template"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isNe ? 'जोडिने कागजात तथा संस्करण *' : 'Linked Document & Version *'}
                    </label>
                    <CustomSelect
                      value={formDocVersionId}
                      onChange={(newVerId) => {
                        setFormDocVersionId(newVerId);
                        const matchedDoc = documents.find((d) => 
                          d.active_version?.id === newVerId || d.versions?.some((v) => v.id === newVerId)
                        );
                        if (matchedDoc) {
                          setDocLayout(getDefaultDocTemplate(matchedDoc.name, matchedDoc.department));
                        }
                      }}
                      options={documentVersionOptions}
                      placeholder={isNe ? 'कागजात र संस्करण छान्नुहोस्...' : 'Select document & version...'}
                      searchPlaceholder={isNe ? 'कागजात वा संस्करण खोज्नुहोस्...' : 'Search document or version...'}
                      searchable={true}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {isNe ? 'टेम्प्लेट स्थिति (Status) *' : 'Template Status *'}
                    </label>
                    <CustomSelect
                      value={formStatus}
                      onChange={(newStatus) => setFormStatus(newStatus as any)}
                      options={[
                        {
                          value: 'draft',
                          label: isNe ? 'Draft (मस्यौदा)' : 'Draft (In Progress)',
                          subLabel: isNe ? 'सम्पादन भइरहेको' : 'Under development',
                          badge: 'Draft',
                        },
                        {
                          value: 'qa',
                          label: isNe ? 'QA Review (परीक्षण)' : 'QA Review',
                          subLabel: isNe ? 'गुणस्तर परीक्षण चरणमा' : 'Pending verification',
                          badge: 'QA',
                        },
                        {
                          value: 'published',
                          label: isNe ? 'Published (चालु)' : 'Published (Official)',
                          subLabel: isNe ? 'आधिकारिक सार्वजनिक चालु' : 'Active and available',
                          badge: 'Live',
                        },
                      ]}
                      searchable={false}
                    />
                  </div>
                </div>

                {/* TAB 1: DOCUMENT TEMPLATE LAYOUT & PAPER SETUP */}
                {editorTab === 'doc_layout' && (
                  <div className="space-y-4">
                    {/* ─── STUDIO TOOLBAR & VIEW CONTROLS ─── */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-2.5 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#18A999]">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#123B5D]">
                              {isNe ? 'कागजात ढाँचा तथा प्रत्यक्ष अवलोकन स्टुडियो' : 'Document Layout & Live Studio'}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live Sync
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {isNe
                              ? 'बायाँ स्तम्भमा विषय, व्यहोरा र चरहरू लेख्नुहोस् — दायाँ स्तम्भमा वास्तविक A4 पृष्ठ तुरुन्तै तयार हुन्छ।'
                              : 'Edit header, subject, clauses and tags on the left — see real-time A4 paper preview on the right.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Paper & Margins Drawer Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setIsPaperConfigOpen(!isPaperConfigOpen)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition border ${
                            isPaperConfigOpen
                              ? 'bg-teal-50 border-teal-200 text-[#148C7E]'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>{isNe ? 'पृष्ठ तथा मार्जिन सेटअप' : 'Paper & Margins'}</span>
                          <span className="text-[10px] font-mono text-[#18A999] font-bold">
                            {docLayout.paperMode === 'plain_preprinted'
                              ? 'Plain 50mm'
                              : docLayout.paperMode === 'legal_deed'
                              ? 'Legal Border'
                              : 'Full Header'}
                          </span>
                        </button>

                        {/* View Switcher: Split vs Form Only */}
                        <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => setDocLayoutStudioView('split')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition ${
                              docLayoutStudioView === 'split'
                                ? 'bg-white text-[#123B5D] shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Split View (Editor on Left, Live A4 on Right)"
                          >
                            <SplitSquareVertical className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{isNe ? 'स्प्लिट स्तम्भ (Left/Right)' : 'Split Studio'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocLayoutStudioView('form')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition ${
                              docLayoutStudioView === 'form'
                                ? 'bg-white text-[#123B5D] shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                            title="Full Width Form"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{isNe ? 'फारम मात्र (Full Width)' : 'Form Only'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ─── OPTIONAL / COLLAPSIBLE PAPER MODE & CLEARANCE SETUP CARD ─── */}
                    {isPaperConfigOpen && (
                      <div className="rounded-3xl border-2 border-teal-200 bg-white p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#123B5D] flex items-center gap-1.5">
                              <Sparkles className="h-4 w-4 text-[#18A999]" />
                              <span>{isNe ? 'कागजात प्रिन्ट र पृष्ठ ढाँचा (Paper & Header/Footer Setup)' : 'Paper & Header/Footer Setup'}</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {isNe
                                ? 'कागजात सादा A4 मा छाप्ने हो कि पहिले नै लोगो भएको लेटरहेडमा वा पूर्ण हेडर-फुटर सहित?'
                                : 'Select whether to render on plain A4 / pre-printed stationery letterhead or include full official header & footer.'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsPaperConfigOpen(false)}
                            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* 3 Interactive Cards */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          {/* Option 1: Full Header & Footer */}
                          <div
                            onClick={() =>
                              setDocLayout({
                                ...docLayout,
                                paperMode: 'full_header_footer',
                                showHeader: true,
                                showFooter: true,
                                topMarginMm: 15,
                              })
                            }
                            className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                              docLayout.paperMode === 'full_header_footer'
                                ? 'border-[#18A999] bg-teal-50/50 shadow-xs'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-base">🏛️</span>
                              {docLayout.paperMode === 'full_header_footer' && (
                                <Check className="h-4 w-4 text-[#18A999]" />
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#123B5D]">
                              {isNe ? 'पूर्ण लेटरहेड र फुटर सहित' : 'Full Header & Footer'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                              {isNe
                                ? 'खाली सेतो A4 मा नेपाल सरकारको निशान छाप, लेटरहेड, छाप र सबै विवरण सहित।'
                                : 'Prints emblem, full letterhead, stamps, and footer on blank A4 paper.'}
                            </p>
                          </div>

                          {/* Option 2: Plain / Pre-printed Letterhead */}
                          <div
                            onClick={() =>
                              setDocLayout({
                                ...docLayout,
                                paperMode: 'plain_preprinted',
                                showHeader: false,
                                topMarginMm: 50,
                              })
                            }
                            className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                              docLayout.paperMode === 'plain_preprinted'
                                ? 'border-[#18A999] bg-teal-50/50 shadow-xs'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-base">📄</span>
                              {docLayout.paperMode === 'plain_preprinted' && (
                                <Check className="h-4 w-4 text-[#18A999]" />
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#123B5D]">
                              {isNe ? 'सादा A4 / प्रि-प्रिन्टेड लेटरहेड' : 'Plain A4 / Pre-printed'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                              {isNe
                                ? 'पहिले नै लेटरहेड छापिएको कागजका लागि (शीर्ष हेडर हट्नेछ र ठाउँ खाली रहनेछ)।'
                                : 'Hides digital header to print seamlessly on pre-printed stationery.'}
                            </p>
                          </div>

                          {/* Option 3: Legal Deed Bordered */}
                          <div
                            onClick={() =>
                              setDocLayout({
                                ...docLayout,
                                paperMode: 'legal_deed',
                                showHeader: true,
                                showFooter: true,
                                topMarginMm: 15,
                              })
                            }
                            className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                              docLayout.paperMode === 'legal_deed'
                                ? 'border-[#18A999] bg-teal-50/50 shadow-xs'
                                : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-base">📜</span>
                              {docLayout.paperMode === 'legal_deed' && (
                                <Check className="h-4 w-4 text-[#18A999]" />
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#123B5D]">
                              {isNe ? 'कानुनी लिखत / करारनामा बोर्डर' : 'Legal Deed Bordered'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                              {isNe
                                ? 'अदालत तथा मालपोतमा पेश गरिने कानुनी सम्झौताका लागि परम्परागत डबल बोर्डर।'
                                : 'Formal ornamental double border for agreements and legal deeds.'}
                            </p>
                          </div>
                        </div>

                        {/* Detailed Margin & Toggle Controls */}
                        <div className="grid gap-4 sm:grid-cols-4 pt-3 border-t border-slate-100">
                          {/* Font Style Selection */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                              <span>{isNe ? 'फन्ट (Typography):' : 'Typography / Font:'}</span>
                              <span className="font-mono text-[#18A999] font-bold">
                                {docLayout.fontFamily === 'serif' ? 'Serif' : 'Outfit'}
                              </span>
                            </div>
                            <CustomSelect
                              value={docLayout.fontFamily || 'outfit'}
                              onChange={(val) => setDocLayout({ ...docLayout, fontFamily: val as 'outfit' | 'serif' })}
                              options={[
                                { value: 'outfit', label: 'Outfit (Modern / आधुनिक)', subLabel: isNe ? 'आधुनिक र सफा' : 'Clean geometric sans' },
                                { value: 'serif', label: 'Serif (Traditional / सेरिफ)', subLabel: isNe ? 'परम्परागत लिखत' : 'Traditional legal font' },
                              ]}
                              searchable={false}
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {isNe ? 'अङ्ग्रेजी पाठ Outfit फन्टमा प्रस्तुत हुन्छ' : 'English text rendered in Outfit font'}
                            </p>
                          </div>

                          {/* Top Margin Slider */}
                          <div>
                            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                              <span>{isNe ? 'शीर्ष मार्जिन (Clearance):' : 'Top Margin:'}</span>
                              <span className="font-mono text-[#18A999] font-bold">{docLayout.topMarginMm || 15} mm</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="80"
                              step="5"
                              value={docLayout.topMarginMm || 15}
                              onChange={(e) => setDocLayout({ ...docLayout, topMarginMm: Number(e.target.value) })}
                              className="w-full accent-[#18A999]"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {docLayout.paperMode === 'plain_preprinted'
                                ? isNe ? 'लेटरहेडका लागि ४५-६०mm' : '45-60mm for preprinted'
                                : isNe ? 'साधारण १५mm उपयुक्त' : '15mm standard'}
                            </p>
                          </div>

                          {/* Granular Toggles */}
                          <div className="sm:col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(docLayout.showHeader)}
                                onChange={(e) => setDocLayout({ ...docLayout, showHeader: e.target.checked })}
                                className="h-3.5 w-3.5 rounded text-[#18A999] focus:ring-[#18A999]"
                              />
                              <span>{isNe ? 'हेडर देखाउने (Header)' : 'Show Header'}</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(docLayout.showFooter)}
                                onChange={(e) => setDocLayout({ ...docLayout, showFooter: e.target.checked })}
                                className="h-3.5 w-3.5 rounded text-[#18A999] focus:ring-[#18A999]"
                              />
                              <span>{isNe ? 'फुटर र छाप देखाउने (Footer & Seal)' : 'Show Footer & Seal'}</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(docLayout.showDateRef)}
                                onChange={(e) => setDocLayout({ ...docLayout, showDateRef: e.target.checked })}
                                className="h-3.5 w-3.5 rounded text-[#18A999] focus:ring-[#18A999]"
                              />
                              <span>{isNe ? 'चलानी नं र मिति (Ref & Date)' : 'Show Ref & Date'}</span>
                            </label>

                            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(docLayout.showWatermark)}
                                onChange={(e) => setDocLayout({ ...docLayout, showWatermark: e.target.checked })}
                                className="h-3.5 w-3.5 rounded text-[#18A999] focus:ring-[#18A999]"
                              />
                              <span>{isNe ? 'वाटरमार्क (Watermark)' : 'Show Watermark'}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── MAIN TWO-COLUMN STUDIO GRID ─── */}
                    <div className={`grid gap-6 items-start ${docLayoutStudioView === 'split' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
                      {/* ─── LEFT COLUMN: PROFESSIONAL DOCUMENT EDITOR ─── */}
                      <div className={`${docLayoutStudioView === 'split' ? 'lg:col-span-6' : 'col-span-1'} space-y-4 max-h-[79vh] overflow-y-auto pr-1 pb-6`}>
                        {/* 1. Available Variables Quick Insert Bar */}
                        <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-teal-900 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-[#18A999]" />
                              <span>{isNe ? 'प्रयोग गर्न मिल्ने चरहरू (Click to Embed Tag):' : 'Available Variables (Click tag to insert into body):'}</span>
                            </span>
                            <span className="text-[10px] font-bold text-[#148C7E]">
                              {formFields.length} {isNe ? 'फिल्डहरू' : 'Tags'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {formFields.map((f, idx) => (
                              <button
                                key={f._id || `var-chip-${idx}`}
                                type="button"
                                onClick={() => insertVariableIntoDoc(f.key)}
                                className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-white px-2 py-0.5 text-[10px] font-mono text-teal-800 hover:bg-teal-100 hover:border-teal-300 transition shadow-2xs active:scale-95 cursor-pointer"
                                title={`Click to insert {{${f.key}}}`}
                              >
                                <span className="font-bold text-[#148C7E]">+</span>
                                <span>{`{{${f.key}}}`}</span>
                                <span className="text-slate-400">({f.label_np || f.label})</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 2. Document Title / Header & Recipient Office */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#123B5D] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-[#18A999]" />
                            <span>{isNe ? '१. पत्रको सम्बोधन र कार्यालय (Header & Recipient)' : '1. Header & Recipient Office'}</span>
                          </h4>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                {isNe ? 'शीर्षक / हेडिङ (Title / Header - Optional)' : 'Document Title / Header (Optional)'}
                              </label>
                              <textarea
                                rows={2}
                                value={docLayout.header}
                                onChange={(e) => setDocLayout({ ...docLayout, header: e.target.value })}
                                placeholder={isNe ? 'संस्थागत पत्र वा सम्झौताका लागि (साधारण निवेदनमा खाली छोड्नुहोस्)' : 'For deeds or company letterheads (leave blank for applications)'}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden font-outfit"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                {isNe ? 'सम्बोधन / प्राप्तकर्ता कार्यालय (Recipient Office)' : 'Addressed To / Recipient Office'}
                              </label>
                              <textarea
                                rows={2}
                                value={docLayout.office}
                                onChange={(e) => setDocLayout({ ...docLayout, office: e.target.value })}
                                placeholder="श्रीमान् कार्यालय प्रमुख ज्यू,&#10;करदाता सेवा कार्यालय, काठमाडौँ।"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 3. Subject Line & Application Body */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#123B5D] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-[#18A999]" />
                            <span>{isNe ? '२. विषय र मुख्य व्यहोरा (Subject & Document Body)' : '2. Subject Line & Document Body'}</span>
                          </h4>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              {isNe ? 'विषय (Subject Line) *' : 'Subject Line *'}
                            </label>
                            <input
                              type="text"
                              value={docLayout.subject}
                              onChange={(e) => setDocLayout({ ...docLayout, subject: e.target.value })}
                              placeholder="विषय: व्यक्तिगत स्थायी लेखा नम्बर (PAN) उपलब्ध गराइदिने सम्बन्धमा।"
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#123B5D] focus:border-[#18A999] focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                {isNe ? 'निवेदन / सम्झौताको मुख्य व्यहोरा (Body Text with Variables) *' : 'Application Body & Clauses *'}
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {docLayout.fontFamily === 'serif' ? 'Serif Font' : 'Outfit Font'}
                              </span>
                            </div>
                            <textarea
                              rows={10}
                              value={docLayout.body}
                              onChange={(e) => setDocLayout({ ...docLayout, body: e.target.value })}
                              placeholder="महोदय, ..."
                              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-outfit font-sans leading-relaxed text-slate-800 focus:border-[#18A999] focus:outline-hidden"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              {isNe
                                ? 'ग्राहकले अनलाइन फारम भर्दा पेश गरेका विवरणहरू {{applicant.full_name}} जस्ता ट्यागहरू भएको ठाउँमा स्वतः भरिन्छ।'
                                : 'Variables like {{applicant.full_name}} are dynamically replaced when the citizen submits the form.'}
                            </p>
                          </div>
                        </div>

                        {/* 4. Enclosures & Declaration */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#123B5D] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#18A999]" />
                            <span>{isNe ? '३. संलग्न कागजातहरू वा घोषणा (Enclosures / Declaration)' : '3. Enclosures / Declaration'}</span>
                          </h4>
                          <div>
                            <input
                              type="text"
                              value={docLayout.declaration}
                              onChange={(e) => setDocLayout({ ...docLayout, declaration: e.target.value })}
                              placeholder="संलग्न कागजातहरू: (१) नागरिकताको प्रतिलिपि, (२) फोटो..."
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* 5. Signatories & Authority */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#123B5D] border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            <Stamp className="h-3.5 w-3.5 text-[#18A999]" />
                            <span>{isNe ? '४. हस्ताक्षरकर्ता विवरण (Signatories & Parties)' : '4. Signatories & Authority'}</span>
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                {isNe ? 'हस्ताक्षरकर्ता / निवेदक (Signatory Label)' : 'Signatory / Applicant Label'}
                              </label>
                              <input
                                type="text"
                                value={docLayout.signatory}
                                onChange={(e) => setDocLayout({ ...docLayout, signatory: e.target.value })}
                                placeholder="निवेदकको दस्तखत"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                {isNe ? 'प्रथम पक्ष / साक्षी (Authority / Witness)' : 'First Party / Authority (For Agreements)'}
                              </label>
                              <input
                                type="text"
                                value={docLayout.authority}
                                onChange={(e) => setDocLayout({ ...docLayout, authority: e.target.value })}
                                placeholder="कार्यालयको छाप / प्रथम पक्ष"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── RIGHT COLUMN: REAL-TIME LIVE A4 PAPER PREVIEW ─── */}
                      {docLayoutStudioView === 'split' && (
                        <div className="lg:col-span-6 sticky top-0 max-h-[79vh] overflow-y-auto pr-2 pb-6 space-y-2">
                          <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[11px] font-bold text-[#123B5D]">
                                {isNe ? 'प्रत्यक्ष A4 कागजात अवलोकन (Live A4 Preview)' : 'Real-Time A4 Document Preview'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#148C7E]">
                                {docLayout.paperMode === 'plain_preprinted'
                                  ? '📄 Plain Pre-printed'
                                  : docLayout.paperMode === 'legal_deed'
                                  ? '📜 Legal Deed'
                                  : '🏛️ Official Header'}
                              </span>
                              <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600 font-mono">
                                {docLayout.fontFamily === 'serif' ? 'Serif' : 'Outfit'}
                              </span>
                            </div>
                          </div>

                          {/* Paper Viewer Container */}
                          <div className="w-full flex justify-center bg-slate-200/70 rounded-2xl p-3 border border-slate-200 overflow-x-auto shadow-inner">
                            {renderA4Document(docLayout)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: FORM FIELDS BUILDER */}
                {editorTab === 'fields' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B5D]">
                          {isNe ? 'अनलाइन फारमका इनपुट फिल्डहरू' : 'Online Form Input Fields'}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {isNe
                            ? 'ग्राहकले फारम भर्दा देखिने इनपुट बक्स, प्रकार र अनिवार्य सर्तहरू:'
                            : 'Fields filled by the user on the public portal to populate the document.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddField}
                        className="widget-click inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-bold text-[#148C7E] hover:bg-teal-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{isNe ? 'नयाँ फिल्ड थप्नुहोस्' : 'Add Field'}</span>
                      </button>
                    </div>

                    <div className="space-y-3.5 overflow-y-auto max-h-[65vh] pr-1 pb-4">
                      {formFields.map((f, idx) => (
                        <div
                          key={f._id || `field-card-${idx}`}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-[#18A999] hover:shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                            <span className="flex items-center gap-2 font-mono text-xs font-bold text-[#123B5D]">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#123B5D] text-white text-[10px]">
                                {idx + 1}
                              </span>
                              <span>{f.key || `field_${idx + 1}`}</span>
                            </span>

                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={f.required}
                                  onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                                  className="h-3.5 w-3.5 rounded text-[#18A999] focus:ring-[#18A999]"
                                />
                                <span>{isNe ? 'अनिवार्य (Required)' : 'Required'}</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveField(idx)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition"
                                title="Remove Field"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Field Key (API & Tag) *
                              </label>
                              <input
                                type="text"
                                value={f.key}
                                onChange={(e) => handleUpdateField(idx, { key: e.target.value })}
                                placeholder="applicant.citizenship_no"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Input Type *
                              </label>
                              <CustomSelect
                                value={f.type}
                                onChange={(val) => handleUpdateField(idx, { type: val })}
                                options={FIELD_TYPE_OPTIONS}
                                searchable={false}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Section / Group
                              </label>
                              <CustomSelect
                                value={f.group || 'personal'}
                                onChange={(val) => handleUpdateField(idx, { group: val })}
                                options={FIELD_GROUP_OPTIONS}
                                searchable={false}
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Label (English) *
                              </label>
                              <input
                                type="text"
                                value={f.label}
                                onChange={(e) => handleUpdateField(idx, { label: e.target.value })}
                                placeholder="e.g. Full Legal Name"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                                Label (नेपाली)
                              </label>
                              <input
                                type="text"
                                value={f.label_np || ''}
                                onChange={(e) => handleUpdateField(idx, { label_np: e.target.value })}
                                placeholder="उदा. पूरा नाम थर"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>
                          </div>

                          {/* Secondary Row: Placeholder & Select Options */}
                          <div className="grid gap-3 sm:grid-cols-2 mt-3 pt-2.5 border-t border-slate-50">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                {isNe ? 'प्लेसहोल्डर (Placeholder Hint):' : 'Placeholder Hint:'}
                              </label>
                              <input
                                type="text"
                                value={f.placeholder || ''}
                                onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                                placeholder={isNe ? 'उदा. ९८XXXXXXXX' : 'e.g. 98XXXXXXXX'}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs focus:border-[#18A999] focus:outline-hidden"
                              />
                            </div>

                            {f.type === 'select' ? (
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                                  {isNe ? 'ड्रपडाउन विकल्पहरू (label:value, comma-separated):' : 'Dropdown Options (label:value, comma-separated):'}
                                </label>
                                <input
                                  type="text"
                                  value={f.options_raw || ''}
                                  onChange={(e) => handleUpdateField(idx, { options_raw: e.target.value })}
                                  placeholder="पुरुष:male, महिला:female, अन्य:other"
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs focus:border-[#18A999] focus:outline-hidden font-mono"
                                />
                              </div>
                            ) : (
                              <div className="flex items-end justify-end">
                                <button
                                  type="button"
                                  onClick={() => insertVariableIntoDoc(f.key)}
                                  className="text-[11px] font-semibold text-[#18A999] hover:text-[#148C7E] flex items-center gap-1 py-1"
                                >
                                  <span>+ Insert &ldquo;{`{{${f.key}}}`}&rdquo; to Document Body</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: SPLIT VIEW (LIVE FORM ON LEFT, A4 DOCUMENT ON RIGHT) */}
                {editorTab === 'split' && (
                  <div className="grid gap-6 lg:grid-cols-12 items-start">
                    {/* Left: Interactive Input Form (5 cols) */}
                    <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                      <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#123B5D]">
                            {isNe ? 'विवरण भर्नुहोस् (Test Inputs)' : 'Input Form Values'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {isNe ? 'यहाँ लेख्दा दायाँपट्टिको सरकारी कागजातमा सिधै भरिन्छ:' : 'Type here to see live updates on the A4 document:'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewValues({
                              'applicant.full_name': 'सीता देवी शर्मा',
                              'applicant.citizenship_no': '२७-०२-७८-०५६७८',
                              'applicant.phone': '९८५१२३४५६७',
                              'applicant.permanent_address': 'पोखरा महानगरपालिका - ८, कास्की',
                            })
                          }
                          className="text-[10px] font-bold text-[#18A999] hover:underline"
                        >
                          Auto Fill Sample
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
                        {formFields.map((f, idx) => (
                          <div key={f._id || `preview-${idx}`} className="space-y-0.5">
                            <label className="block text-[11px] font-semibold text-slate-700">
                              {f.label_np || f.label} <span className="font-mono text-[9px] text-slate-400">({`{{${f.key}}}`})</span>
                            </label>
                            <input
                              type="text"
                              value={previewValues[f.key] || ''}
                              onChange={(e) => setPreviewValues({ ...previewValues, [f.key]: e.target.value })}
                              placeholder={f.placeholder || f.label}
                              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Live A4 Document Paper (7 cols) */}
                    <div className="lg:col-span-7 max-h-[78vh] overflow-y-auto pr-2">
                      {renderA4Document(docLayout)}
                    </div>
                  </div>
                )}

                {/* TAB 4: PURE A4 DOCUMENT PREVIEW */}
                {editorTab === 'live_doc' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[#123B5D] flex items-center gap-1.5">
                          <Printer className="h-4 w-4 text-[#18A999]" />
                          <span>{isNe ? 'आधिकारिक A4 कागजात प्रिन्ट तथा डाउनलोड प्रिभ्यू' : 'Official A4 Document Paper Preview'}</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {isNe ? 'प्रणालीबाट ग्राहकले भुक्तानी गरेपछि डाउनलोड हुने अन्तिम PDF कागजात:' : 'This is the exact verified A4 paper generated and downloadable after checkout:'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="widget-click inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                      >
                        <Printer className="h-3.5 w-3.5 text-[#18A999]" />
                        <span>{isNe ? 'प्रिन्ट गर्नुहोस्' : 'Print / Export'}</span>
                      </button>
                    </div>

                    <div className="py-4 bg-slate-200/60 rounded-3xl p-4 flex justify-center">
                      {renderA4Document(docLayout)}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Bottom Action Bar */}
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-white">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {isNe ? 'रद्द' : 'Cancel'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditorTab(editorTab === 'split' ? 'doc_layout' : 'split')}
                    className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-bold text-[#148C7E] hover:bg-teal-100 flex items-center gap-1.5"
                  >
                    <SplitSquareVertical className="h-3.5 w-3.5" />
                    <span>{editorTab === 'split' ? (isNe ? 'लेआउट सम्पादकमा फर्कनुहोस्' : 'Back to Editor') : (isNe ? 'स्प्लिट लाइभ प्रिभ्यू' : 'Split Live Preview')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={editorSubmitting}
                    onClick={handleSaveTemplate}
                    className="widget-click rounded-xl bg-[#123B5D] px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0E2E4A] disabled:opacity-50"
                  >
                    {editorSubmitting
                      ? isNe ? 'सुरक्षित हुँदैछ...' : 'Saving Template...'
                      : isNe ? 'टेम्प्लेट सुरक्षित गर्नुहोस्' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ─── STANDALONE DOCUMENT & FORM PREVIEW MODAL ─── */}
        {mounted && isPreviewOpen && previewTemplate && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[95vh] flex flex-col rounded-3xl border border-teal-200 bg-slate-100 shadow-2xl animate-scale-up overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5 bg-white">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-[#18A999]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#123B5D]">
                      {previewTemplate.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-outfit">
                      {previewTemplate.document_version?.document?.name} • Version: {previewTemplate.document_version?.version_number || 'v2026.1'}
                    </p>
                  </div>
                </div>

                {/* View Mode Toggle: Document Paper vs Input Form vs Split */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-2xl bg-slate-100 p-1 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('doc')}
                      className={`rounded-xl px-3 py-1.5 transition flex items-center gap-1 ${
                        previewViewMode === 'doc' ? 'bg-[#18A999] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{isNe ? 'A4 सरकारी कागजात' : 'A4 Document'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('form')}
                      className={`rounded-xl px-3 py-1.5 transition flex items-center gap-1 ${
                        previewViewMode === 'form' ? 'bg-[#18A999] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{isNe ? 'अनलाइन फारम' : 'Input Form'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('split')}
                      className={`rounded-xl px-3 py-1.5 transition flex items-center gap-1 ${
                        previewViewMode === 'split' ? 'bg-[#123B5D] text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      <SplitSquareVertical className="h-3.5 w-3.5" />
                      <span>{isNe ? 'स्प्लिट भ्यू' : 'Split View'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Sub-toolbar: Quick Paper Mode Switcher in Preview! */}
              <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>{isNe ? 'प्रिन्ट ढाँचा परीक्षण:' : 'Test Print Paper Mode:'}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewPaperModeOverride('full_header_footer')}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                        (previewPaperModeOverride || (previewTemplate.form_schema as any)?.doc_layout?.paperMode || 'full_header_footer') === 'full_header_footer'
                          ? 'bg-[#123B5D] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>🏛️ पूर्ण लेटरहेड</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewPaperModeOverride('plain_preprinted')}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                        (previewPaperModeOverride || (previewTemplate.form_schema as any)?.doc_layout?.paperMode) === 'plain_preprinted'
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>📄 सादा / प्रि-प्रिन्टेड लेटरहेड</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewPaperModeOverride('legal_deed')}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold transition flex items-center gap-1 ${
                        (previewPaperModeOverride || (previewTemplate.form_schema as any)?.doc_layout?.paperMode) === 'legal_deed'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>📜 कानुनी लिखत</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  {previewPaperModeOverride === 'plain_preprinted' ? (
                    <span className="text-sky-700 font-semibold">Pre-printed Station Clearance: 50mm Active</span>
                  ) : previewPaperModeOverride === 'legal_deed' ? (
                    <span className="text-amber-800 font-semibold">Legal Deed Double Border Active</span>
                  ) : (
                    <span className="text-teal-800 font-semibold">Official Emblem & Full Header Active</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/50 flex justify-center">
                {previewViewMode === 'doc' && (
                  <div className="w-full flex justify-center">
                    {renderA4Document(
                      (previewTemplate.form_schema as any)?.doc_layout ||
                        getDefaultDocTemplate(
                          previewTemplate.document_version?.document?.name || previewTemplate.name,
                          previewTemplate.document_version?.document?.department || 'IRD'
                        ),
                      (previewTemplate.fields as any) || DEFAULT_STARTER_FIELDS,
                      previewPaperModeOverride
                    )}
                  </div>
                )}

                {previewViewMode === 'form' && (
                  <div className="w-full max-w-xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="rounded-full bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-[#18A999] font-outfit">
                        {previewTemplate.document_version?.document?.department || 'OFFICIAL'}
                      </span>
                      <h4 className="mt-1 text-base font-bold text-[#123B5D]">
                        {previewTemplate.name}
                      </h4>
                    </div>

                    <div className="space-y-3">
                      {(previewTemplate.fields && previewTemplate.fields.length > 0
                        ? previewTemplate.fields
                        : DEFAULT_STARTER_FIELDS
                      ).map((f: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            {f.label_np || f.label} {f.required && <span className="text-rose-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={previewValues[f.key] || ''}
                            onChange={(e) => setPreviewValues({ ...previewValues, [f.key]: e.target.value })}
                            placeholder={f.placeholder || f.label}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-[#18A999] focus:outline-hidden"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewViewMode === 'split' && (
                  <div className="w-full grid gap-6 lg:grid-cols-12 items-start">
                    <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#123B5D] border-b pb-2">
                        {isNe ? 'फारममा विवरण टाइप गर्नुहोस्' : 'Interactive Form Test'}
                      </h4>
                      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                        {(previewTemplate.fields && previewTemplate.fields.length > 0
                          ? previewTemplate.fields
                          : DEFAULT_STARTER_FIELDS
                        ).map((f: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                              {f.label_np || f.label}
                            </label>
                            <input
                              type="text"
                              value={previewValues[f.key] || ''}
                              onChange={(e) => setPreviewValues({ ...previewValues, [f.key]: e.target.value })}
                              placeholder={f.placeholder || f.label}
                              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-[#18A999] focus:outline-hidden"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="lg:col-span-7 max-h-[78vh] overflow-y-auto pr-1">
                      {renderA4Document(
                        (previewTemplate.form_schema as any)?.doc_layout ||
                          getDefaultDocTemplate(
                            previewTemplate.document_version?.document?.name || previewTemplate.name,
                            previewTemplate.document_version?.document?.department || 'IRD'
                          ),
                        (previewTemplate.fields as any) || DEFAULT_STARTER_FIELDS,
                        previewPaperModeOverride
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-white">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="h-3.5 w-3.5 text-[#18A999]" />
                  <span>{isNe ? 'A4 कागजात प्रिन्ट / डाउनलोड' : 'Print / Export PDF'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreviewOpen(false);
                      openEditModal(previewTemplate);
                    }}
                    className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-[#148C7E] hover:bg-teal-100 flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>{isNe ? 'टेम्प्लेट सम्पादन गर्नुहोस्' : 'Edit in Studio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="rounded-xl bg-[#123B5D] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#0E2E4A]"
                  >
                    {isNe ? 'बन्द' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminShell>
  );
}
