/**
 * Mero Kagaz — Typed API Client
 *
 * All API calls go through this module — never use raw fetch() in components.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

// ─── Error Types ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Base Fetcher ─────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string;
  } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;
  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    if (path.startsWith('/api/v1/admin')) {
      authToken = localStorage.getItem('mk_admin_token') || localStorage.getItem('mk_user_token') || undefined;
    } else {
      authToken = localStorage.getItem('mk_user_token') || localStorage.getItem('mk_admin_token') || undefined;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    const errorMsg =
      json.error?.message ||
      json.message ||
      (res.status === 401
        ? 'Invalid email or password.'
        : res.status === 403
        ? 'Access denied. Administrator privileges required.'
        : `Request failed with status ${res.status}`);
    throw new ApiError(json.error?.code ?? String(res.status), errorMsg, json.error?.details);
  }

  return (json.data !== undefined ? json.data : json) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  name_np: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface DocumentTemplateSummary {
  id: string;
  name: string;
  status: 'draft' | 'qa' | 'published' | 'archived';
  fields_count?: number;
}

export interface AdminTemplateItem {
  id: string;
  document_version_id: string;
  name: string;
  form_schema: Record<string, any> | null;
  pdf_template_path: string | null;
  pdf_field_mapping: Record<string, any> | null;
  status: 'draft' | 'qa' | 'published' | 'archived';
  qa_notes: string | null;
  published_by: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  fields_count?: number;
  fields?: Array<Partial<FormField> & Record<string, any>>;
  document_version?: {
    id: string;
    document_id: number;
    version_number: string;
    effective_date: string | null;
    is_active: boolean;
    document?: Document;
  };
}

export interface DocumentVersionItem {
  id: string;
  version_number: string;
  effective_date: string | null;
  is_active: boolean;
  template?: DocumentTemplateSummary | null;
}

export interface Document {
  id: number;
  slug: string;
  name: string;
  name_np: string | null;
  description: string | null;
  description_np: string | null;
  price: string;
  currency: string;
  department: string;
  processing_time: string | null;
  requirements: string[];
  category?: Category;
  category_id?: number;
  active_version?: DocumentVersionItem | null;
  versions?: DocumentVersionItem[];
  is_active: boolean;
  sort_order?: number;
}

export interface FormField {
  key: string;
  type: string;
  label: string;
  label_np: string | null;
  placeholder: string | null;
  required: boolean;
  options: Array<{ label: string; value: string }> | null;
  visible_when: Record<string, unknown> | null;
  validation_rules: Record<string, unknown> | null;
  nepali_script_required: boolean;
  group?: string | null;
  group_title?: string | null;
  group_title_np?: string | null;
  sort_order: number;
}

export function formatCurrency(amount: number | string | undefined | null, isNe: boolean): string {
  const num = Number(amount) || 0;
  if (num === 0) return isNe ? 'निःशुल्क' : 'Free';
  if (isNe) {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    const numStr = num.toLocaleString('en-IN');
    const nepStr = numStr.replace(/[0-9]/g, (d) => nepaliDigits[Number(d)]);
    return `रु. ${nepStr}`;
  }
  return `Rs. ${num.toLocaleString('en-IN')}`;
}

export interface Order {
  id: string | number;
  public_order_no: string;
  document_slug?: string;
  document?: {
    name: string;
    name_np?: string | null;
    slug: string;
  };
  form_data?: Record<string, any>;
  notes?: string | null;
  subtotal?: number | string;
  total?: number | string;
  currency?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  payment_status: 'unpaid' | 'pending_approval' | 'paid' | 'refunded';
  generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
  download_ready?: boolean;
  download_token?: string;
  user?: {
    id: number | string;
    public_id?: string;
    name: string;
    name_np?: string | null;
    email: string;
    phone?: string | null;
  } | null;
  payments?: Array<{
    id: string;
    provider: string;
    provider_reference?: string;
    amount: number | string;
    status: string;
    verified_at?: string;
  }>;
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  site_tagline_ne: string;
  site_tagline_en: string;
  notice_banner_enabled: boolean;
  notice_banner_text_ne: string;
  notice_banner_text_en: string;
  notice_banner_link: string;
  contact_email: string;
  contact_emails?: string[];
  contact_phone: string;
  contact_phones?: string[];
  office_address_ne: string;
  office_address_en: string;
  company_name: string;
  popular_tags_ne: string[];
  popular_tags_en: string[];
  stats: {
    stat1_value?: string;
    stat1_value_ne?: string;
    stat1_value_en?: string;
    stat1_label_ne: string;
    stat1_label_en: string;
    stat2_value?: string;
    stat2_value_ne?: string;
    stat2_value_en?: string;
    stat2_label_ne: string;
    stat2_label_en: string;
    stat3_value?: string;
    stat3_value_ne?: string;
    stat3_value_en?: string;
    stat3_label_ne: string;
    stat3_label_en: string;
    stat4_value?: string;
    stat4_value_ne?: string;
    stat4_value_en?: string;
    stat4_label_ne: string;
    stat4_label_en: string;
  };
  live_activities: Array<{
    cityNe: string;
    cityEn: string;
    docNe: string;
    docEn: string;
    timeNe: string;
    timeEn: string;
  }>;
}

export interface MigrationItem {
  name: string;
  filename: string;
  status: 'Ran' | 'Pending';
  batch: number | null;
}

export interface BackupItem {
  filename: string;
  size_bytes: number;
  size_human: string;
  created_at: string;
  timestamp: number;
}

export interface SystemOverview {
  php_version: string;
  laravel_version: string;
  db_connection: string;
  db_name: string;
  db_version: string;
  server_os: string;
  memory_usage: string;
  disk_free_space: string;
  cache_driver: string;
  app_env: string;
  app_debug: boolean;
}

export interface CmsContent {
  hero: {
    badge_ne: string;
    badge_en: string;
    title_prefix_ne: string;
    title_prefix_en: string;
    title_highlight_ne: string;
    title_highlight_en: string;
    title_suffix_ne: string;
    title_suffix_en: string;
    subtitle_ne: string;
    subtitle_en: string;
  };
  departments: {
    pre_title_ne: string;
    pre_title_en: string;
    main_title_ne: string;
    main_title_en: string;
    subtitle_ne: string;
    subtitle_en: string;
    ird_title_ne: string;
    ird_title_en: string;
    ird_desc_ne: string;
    ird_desc_en: string;
    ocr_title_ne: string;
    ocr_title_en: string;
    ocr_desc_ne: string;
    ocr_desc_en: string;
    legal_title_ne: string;
    legal_title_en: string;
    legal_desc_ne: string;
    legal_desc_en: string;
  };
  how_it_works: {
    pre_title_ne: string;
    pre_title_en: string;
    main_title_ne: string;
    main_title_en: string;
    subtitle_ne: string;
    subtitle_en: string;
    steps: Array<{
      step: number;
      title_ne: string;
      title_en: string;
      desc_ne: string;
      desc_en: string;
    }>;
  };
  faqs: Array<{
    qNe: string;
    qEn: string;
    aNe: string;
    aEn: string;
  }>;
  cta_banner: {
    badge_ne: string;
    badge_en: string;
    title_ne: string;
    title_en: string;
    subtitle_ne: string;
    subtitle_en: string;
    btn1_text_ne: string;
    btn1_text_en: string;
    btn1_link: string;
    btn2_text_ne: string;
    btn2_text_en: string;
    btn2_link: string;
  };
  footer: {
    about_ne: string;
    about_en: string;
    verified_badge_ne: string;
    verified_badge_en: string;
  };
}

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  action: string;
  model_type: string | null;
  model_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  description: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_verified: boolean;
  email_verified_at?: string | null;
  created_at?: string;
  // Nepal administrative address
  province?: string | null;
  province_id?: number | null;
  district?: string | null;
  district_id?: number | null;
  municipality?: string | null;
  municipality_id?: number | null;
  ward?: string | null;
  tole?: string | null;
  // Citizen & Legal identity (३ पुस्ते विवरण)
  citizenship_no?: string | null;
  citizenship_issued_district?: string | null;
  citizenship_issued_district_id?: number | null;
  citizenship_issued_date?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  grandfather_name?: string | null;
  spouse_name?: string | null;
  gender?: string | null;
  pan_number?: string | null;
}

export interface UserDocumentItem {
  id: string;
  public_order_no: string;
  document_name: string;
  document_name_np: string;
  document_slug?: string;
  category: string;
  total: number;
  currency: string;
  status: string;
  payment_status: string;
  generation_status: string;
  download_token?: string | null;
  download_url?: string | null;
  created_at: string;
}

export interface UserPaymentItem {
  id: string;
  order_no: string;
  document_name: string;
  provider: string;
  provider_reference?: string | null;
  amount: number;
  currency: string;
  status: string;
  verified_at?: string | null;
  created_at: string;
}

export interface BusinessDirector {
  name: string;
  designation: string;
  citizenship_no?: string;
  citizenship_issued_district?: string;
  citizenship_issued_district_id?: number;
  phone?: string;
  share_percent?: string | number;
  shares_count?: string | number;
  address?: string;
  province?: string;
  province_id?: number;
  district?: string;
  district_id?: number;
  municipality?: string;
  municipality_id?: number;
  ward?: string;
  tole?: string;
}

export interface BusinessItem {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  pan_vat_number?: string | null;
  registration_number?: string | null;
  registered_date_bs?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  province_id?: number | null;
  district?: string | null;
  district_id?: number | null;
  municipality?: string | null;
  municipality_id?: number | null;
  ward?: string | null;
  tole?: string | null;
  authorized_signatory_name?: string | null;
  authorized_signatory_designation?: string | null;
  authorized_signatory_citizenship?: string | null;
  business_type?: string | null;
  authorized_capital?: string | null;
  issued_capital?: string | null;
  paid_up_capital?: string | null;
  directors?: BusinessDirector[];
  status: 'active' | 'suspended';
  my_role?: 'owner' | 'admin' | 'member';
  total_documents?: number;
  total_members?: number;
  created_at?: string;
}

export interface BusinessMemberItem {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'suspended';
  joined_at?: string | null;
  invited_at?: string | null;
}

export interface BusinessDashboardData {
  kpis: {
    total_documents: number;
    documents_today: number;
    documents_this_week: number;
    documents_this_month: number;
    total_spending: number;
    successful_payments_count: number;
    pending_payments_count: number;
    failed_payments_count: number;
  };
  document_usage: Array<{
    name: string;
    name_np: string;
    count: number;
    total_spent: number;
  }>;
  orders: {
    items: Array<{
      id: string;
      public_order_no: string;
      document_name: string;
      document_name_np: string;
      created_by: string;
      price: number;
      currency: string;
      status: string;
      payment_status: string;
      generation_status: string;
      payment_provider?: string;
      payment_reference?: string;
      download_url?: string;
      created_at: string;
    }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminAnalyticsOverview {
  users: {
    total_individual: number;
    total_business: number;
    new_in_period: number;
    new_business_period: number;
  };
  documents: {
    total: number;
    today: number;
    this_week: number;
    this_month: number;
    period: number;
    currently_processing: number;
    failed_generation: number;
  };
  financials: {
    total_verified_payments: number;
    total_received_revenue: number;
    period_received_revenue: number;
    pending_payments: number;
    failed_payments: number;
    refunds: number;
  };
  emails: {
    pending: number;
    failed: number;
  };
  filter: {
    preset: string;
    start_date: string;
    end_date: string;
  };
}

export interface AdminChartsData {
  docs_over_time: Array<{
    date: string;
    total_count: number;
    paid_count: number;
    paid_amount?: number | string;
    unpaid_amount?: number | string;
  }>;
  revenue_over_time: Array<{ date: string; revenue: number }>;
  user_trends: Array<{ date: string; count: number }>;
  business_trends: Array<{ date: string; count: number }>;
  docs_by_category: Array<{ category_name: string; category_slug: string; count: number; total_amount: number }>;
  revenue_by_doc: Array<{ name: string; name_np: string; orders_count: number; total_revenue: number }>;
  payment_stats: { completed: number; failed: number; pending: number };
  top_businesses: Array<{ id: number; name: string; pan_vat_number?: string; total_docs: number; total_spent: number }>;
  email_stats: { sent: number; failed: number; pending: number };
}

export interface OperationalAlertItem {
  id: number;
  event_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  metadata?: Record<string, any> | null;
  link?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface EmailSettingsData {
  provider: 'smtp' | 'log' | 'mailgun' | 'postmark' | 'ses';
  smtp_host?: string;
  smtp_port: number;
  smtp_encryption?: string | null;
  smtp_username?: string;
  has_password?: boolean;
  from_name: string;
  from_email: string;
  notifications_enabled?: Record<string, boolean>;
}

export interface EmailTemplateItem {
  id: number;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  variables?: string[];
  is_active: boolean;
  updated_at: string;
}

export interface EmailLogItem {
  id: number;
  recipient_email: string;
  recipient_name?: string | null;
  template_key?: string | null;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string | null;
  retries_count: number;
  sent_at?: string | null;
  created_at: string;
}

export interface AuditLogMetrics {
  total: number;
  logins_today: number;
  failed_logins: number;
  doc_changes: number;
  system_actions: number;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  metrics?: AuditLogMetrics;
}

export interface AdminUserItem {
  id: number;
  public_id?: string;
  name: string;
  name_np?: string | null;
  email: string;
  phone?: string | null;
  role: 'admin' | 'user' | 'business';
  avatar?: string | null;
  is_active: boolean;
  email_verified_at?: string | null;
  orders_count?: number;
  total_spent?: number | string;
  created_at: string;
  updated_at: string;
}

export interface AdminUserStats {
  total_users: number;
  admin_count: number;
  individual_count: number;
  business_count: number;
  active_count: number;
  inactive_count: number;
  new_this_month: number;
  total_businesses: number;
}

export interface AdminUserReportFilter {
  period?: string;
  start_date?: string;
  end_date?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AdminUserDetail {
  user: AdminUserItem & {
    province?: string | null;
    province_id?: number | null;
    district?: string | null;
    district_id?: number | null;
    municipality?: string | null;
    municipality_id?: number | null;
    ward?: string | null;
    tole?: string | null;
    citizenship_no?: string | null;
    citizenship_issued_district?: string | null;
    citizenship_issued_date?: string | null;
    father_name?: string | null;
    father_name_np?: string | null;
    mother_name?: string | null;
    mother_name_np?: string | null;
    grandfather_name?: string | null;
    grandfather_name_np?: string | null;
    spouse_name?: string | null;
    spouse_name_np?: string | null;
    gender?: string | null;
    pan_number?: string | null;
    family_members?: Array<{
      relation: string;
      name_en?: string;
      name_np?: string;
      citizenship_no?: string;
      dob_bs?: string;
      phone?: string;
    }>;
    ownedBusinesses?: Array<{ id: number; name: string; pan_vat_number?: string; registration_number?: string; status?: string }>;
    businesses?: Array<{ id: number; name: string; pivot?: { role: string; status: string } }>;
    vaultDocuments?: Array<{
      id: number;
      document_type: string;
      title: string;
      document_number?: string;
      issued_date_bs?: string;
      file_path: string;
      mime_type?: string;
      file_size?: number;
      created_at: string;
    }>;
    orders?: Array<{
      id: number;
      order_number: string;
      total: number;
      payment_status: string;
      status?: string;
      created_at: string;
      document?: { id?: number; name: string; name_np: string; slug?: string; category?: { name: string; name_np: string } };
    }>;
  };
  total_spent: number;
  stats?: {
    total_orders: number;
    total_documents_generated: number;
    total_spent: number;
    vault_documents_count: number;
    businesses_count: number;
    filtered?: {
      period?: string;
      start_date?: string | null;
      end_date?: string | null;
      orders_count: number;
      documents_generated: number;
      total_spent: number;
    };
  };
  orders?: Array<{
    id: number;
    order_number: string;
    total: number;
    payment_status: string;
    status: string;
    created_at: string;
    document?: { id?: number; name: string; name_np: string; slug?: string; category?: { name: string; name_np: string } };
  }>;
  orders_meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  vault_documents?: Array<any>;
  owned_businesses?: Array<any>;
  businesses?: Array<any>;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const api = {
  // Public Site Settings
  settings: {
    get: () => request<SiteSettings>('/api/v1/settings'),
  },

  // Public CMS Content
  cms: {
    get: () => request<CmsContent>('/api/v1/cms'),
  },

  // Categories
  categories: {
    list: () => request<Category[]>('/api/v1/categories'),
    get: (slug: string) => request<Category>(`/api/v1/categories/${slug}`),
  },

  // Documents
  documents: {
    list: (params?: { category?: string; search?: string }) => {
      const cleanParams = new URLSearchParams();
      if (params) {
        if (params.category && params.category !== 'undefined') cleanParams.set('category', params.category);
        if (params.search && params.search !== 'undefined') cleanParams.set('search', params.search);
      }
      const q = cleanParams.toString();
      return request<Document[]>(`/api/v1/documents${q ? `?${q}` : ''}`);
    },
    get: (slug: string) => request<Document>(`/api/v1/documents/${slug}`),
    getSchema: (slug: string) =>
      request<{ document_slug: string; version: string | null; fields: FormField[] }>(
        `/api/v1/documents/${slug}/schema`,
      ),
  },

  // Orders
  orders: {
    create: (data: { document_slug: string; form_data: Record<string, unknown> }) =>
      request<Order>('/api/v1/orders', { method: 'POST', body: data }),
    get: (orderNo: string) => request<Order>(`/api/v1/orders/${orderNo}`),
    getStatus: (orderNo: string) =>
      request<{ public_order_no: string; status: string; payment_status: string; download_ready: boolean }>(
        `/api/v1/orders/${orderNo}/status`,
      ),
    requestApproval: (orderNo: string) =>
      request<{ success: boolean; data: Order; message: string }>(
        `/api/v1/orders/${orderNo}/request-approval`,
        { method: 'POST' },
      ),
    updateFormData: (orderNo: string, formData: Record<string, unknown>) =>
      request<{ success: boolean; data: Order; message: string }>(
        `/api/v1/orders/${orderNo}/form-data`,
        { method: 'PUT', body: { form_data: formData } },
      ),
  },

  // Payments
  payments: {
    initiateEsewa: (orderNo: string) =>
      request<{ payment_id: string; gateway_url: string; params: Record<string, string> }>(
        '/api/v1/payments/esewa/initiate',
        { method: 'POST', body: { order_no: orderNo } },
      ),
    verifyEsewa: (data: Record<string, string>) =>
      request<{ verified: boolean; order_no: string }>('/api/v1/payments/esewa/verify', {
        method: 'POST',
        body: data,
      }),
    initiateKhalti: (orderNo: string) =>
      request<{ payment_id: string; payment_url: string; pidx: string }>(
        '/api/v1/payments/khalti/initiate',
        { method: 'POST', body: { order_no: orderNo } },
      ),
    verifyKhalti: (data: Record<string, string>) =>
      request<{ verified: boolean; order_no: string }>('/api/v1/payments/khalti/verify', {
        method: 'POST',
        body: data,
      }),
  },

  // Downloads
  downloads: {
    redeem: (token: string) =>
      request<{ download_url: string; expires_in: number }>(`/api/v1/downloads/${token}`, {
        method: 'POST',
      }),
  },

  // Admin
  admin: {
    login: (email: string, password: string) =>
      request<{ token: string; user: { id: number; name: string; email: string } }>(
        '/api/v1/admin/auth/login',
        { method: 'POST', body: { email, password } },
      ),
    logout: (token: string) =>
      request<void>('/api/v1/admin/auth/logout', { method: 'POST', token }),
    me: (token: string) =>
      request<{ id: number; name: string; email: string; roles: string[] }>(
        '/api/v1/admin/me',
        { token },
      ),
    documents: {
      list: (token: string, params?: Record<string, string>) => {
        const cleanParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '' && v !== 'undefined') cleanParams.set(k, String(v));
          });
        }
        const q = cleanParams.toString();
        return request<Document[]>(`/api/v1/admin/documents${q ? `?${q}` : ''}`, { token });
      },
      get: (token: string, id: number) =>
        request<Document>(`/api/v1/admin/documents/${id}`, { token }),
      create: (token: string, data: Partial<Document>) =>
        request<Document>('/api/v1/admin/documents', { method: 'POST', body: data, token }),
      update: (token: string, id: number, data: Partial<Document>) =>
        request<Document>(`/api/v1/admin/documents/${id}`, { method: 'PATCH', body: data, token }),
      toggleStatus: (token: string, id: number) =>
        request<{ success: boolean; data: Document }>(`/api/v1/admin/documents/${id}/status`, {
          method: 'PATCH',
          token,
        }),
      checkSlug: (token: string, slug: string, excludeId?: number) => {
        const q = new URLSearchParams({
          slug,
          ...(excludeId ? { exclude_id: String(excludeId) } : {}),
        }).toString();
        return request<{ valid: boolean; available: boolean; slug: string; message: string }>(
          `/api/v1/admin/documents/check-slug?${q}`,
          { token }
        );
      },
      createVersion: (
        token: string,
        id: number,
        data: {
          version_number: string;
          effective_date?: string;
          template_name?: string;
          template_status?: 'draft' | 'published' | 'archived';
          is_active?: boolean;
        }
      ) =>
        request<{ success: boolean; data: any }>(`/api/v1/admin/documents/${id}/versions`, {
          method: 'POST',
          body: data,
          token,
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean; message: string }>(`/api/v1/admin/documents/${id}`, {
          method: 'DELETE',
          token,
        }),
    },
    templates: {
      list: (
        token: string,
        params?: {
          status?: string;
          search?: string;
          page?: number;
          per_page?: number;
        }
      ) => {
        const cleanParams: Record<string, string> = {};
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              cleanParams[k] = String(v);
            }
          });
        }
        const q = new URLSearchParams(cleanParams).toString();
        return request<{ data: AdminTemplateItem[]; total?: number; current_page?: number } | AdminTemplateItem[]>(
          `/api/v1/admin/templates${q ? `?${q}` : ''}`,
          { token }
        );
      },
      get: (token: string, id: string) =>
        request<AdminTemplateItem>(`/api/v1/admin/templates/${id}`, { token }),
      create: (token: string, data: any) =>
        request<AdminTemplateItem>('/api/v1/admin/templates', {
          method: 'POST',
          body: data,
          token,
        }),
      update: (token: string, id: string, data: Partial<AdminTemplateItem>) =>
        request<AdminTemplateItem>(`/api/v1/admin/templates/${id}`, {
          method: 'PATCH',
          body: data,
          token,
        }),
      publish: (token: string, id: string) =>
        request<{ success: boolean; data: any }>(`/api/v1/admin/templates/${id}/publish`, {
          method: 'POST',
          token,
        }),
      delete: (token: string, id: string) =>
        request<{ success: boolean; message: string }>(`/api/v1/admin/templates/${id}`, {
          method: 'DELETE',
          token,
        }),
    },
    orders: {
      list: (
        token: string,
        params?: {
          status?: string;
          payment_status?: string;
          search?: string;
          page?: number;
          per_page?: number;
        }
      ) => {
        const cleanParams: Record<string, string> = {};
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              cleanParams[k] = String(v);
            }
          });
        }
        const q = new URLSearchParams(cleanParams).toString();
        return request<{
          data: Order[];
          meta?: { current_page: number; last_page: number; total: number };
          analytics?: {
            total_orders: number;
            total_docs_generated: number;
            total_amount: number;
            collected_amount: number;
            pending_amount: number;
            paid_count: number;
            pending_approval_count: number;
          };
        }>(
          `/api/v1/admin/orders${q ? `?${q}` : ''}`,
          { token }
        );
      },
      get: (token: string, id: string) =>
        request<Order>(`/api/v1/admin/orders/${id}`, { token }),
      approvePayment: (
        token: string,
        id: string,
        data?: {
          payment_method?: string;
          reference_no?: string;
          amount?: number;
          notes?: string;
        }
      ) =>
        request<{ success: boolean; data: Order; message: string }>(
          `/api/v1/admin/orders/${id}/approve-payment`,
          {
            method: 'POST',
            body: data || {},
            token,
          }
        ),
      updateStatus: (
        token: string,
        id: string,
        data: {
          status?: string;
          payment_status?: string;
          notes?: string;
        }
      ) =>
        request<{ success: boolean; data: Order; message: string }>(
          `/api/v1/admin/orders/${id}/status`,
          {
            method: 'PATCH',
            body: data,
            token,
          }
        ),
    },
    payments: {
      list: (
        token: string,
        params?: {
          provider?: string;
          status?: string;
          page?: number;
          per_page?: number;
        }
      ) => {
        const cleanParams: Record<string, string> = {};
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              cleanParams[k] = String(v);
            }
          });
        }
        const q = new URLSearchParams(cleanParams).toString();
        return request<{ data: any; meta?: any }>(`/api/v1/admin/payments${q ? `?${q}` : ''}`, { token });
      },
    },
    auditLogs: {
      list: (
        token: string,
        params?: {
          page?: number;
          per_page?: number;
          search?: string;
          category?: string;
          date_range?: string;
          user_id?: number;
        }
      ) => {
        const cleanParams: Record<string, string> = {};
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              cleanParams[k] = String(v);
            }
          });
        }
        const q = new URLSearchParams(cleanParams).toString();
        return request<AuditLogResponse>(`/api/v1/admin/audit-logs${q ? `?${q}` : ''}`, { token });
      },
      get: (token: string, id: number) =>
        request<AuditLogItem>(`/api/v1/admin/audit-logs/${id}`, { token }),
      export: (token: string) =>
        request<AuditLogItem[]>('/api/v1/admin/audit-logs/export', { token }),
    },
    settings: {
      get: (token: string) => request<SiteSettings>('/api/v1/admin/settings', { token }),
      update: (token: string, data: Partial<SiteSettings>) =>
        request<SiteSettings>('/api/v1/admin/settings', {
          method: 'POST',
          body: data,
          token,
        }),
    },
    system: {
      overview: (token: string) =>
        request<SystemOverview>('/api/v1/admin/system/overview', { token }),
      migrations: {
        list: (token: string) =>
          request<MigrationItem[]>('/api/v1/admin/system/migrations', { token }),
        run: (token: string, files?: string[]) =>
          request<{ success: boolean; message: string; output: string }>('/api/v1/admin/system/migrations/run', {
            method: 'POST',
            body: files && files.length > 0 ? { files } : undefined,
            token,
          }),
        rollback: (token: string, payload?: number | { step?: number; files?: string[] }) => {
          const body = typeof payload === 'number' ? { step: payload } : payload || { step: 1 };
          return request<{ success: boolean; message: string; output: string }>(
            '/api/v1/admin/system/migrations/rollback',
            {
              method: 'POST',
              body,
              token,
            }
          );
        },
        refresh: (token: string, files: string[]) =>
          request<{ success: boolean; message: string; output: string }>('/api/v1/admin/system/migrations/refresh', {
            method: 'POST',
            body: { files },
            token,
          }),
        seed: (token: string) =>
          request<{ success: boolean; message: string; output: string }>('/api/v1/admin/system/migrations/seed', {
            method: 'POST',
            token,
          }),
      },
      cache: {
        clear: (token: string, type: 'all' | 'config' | 'route' | 'view' | 'app' = 'all') =>
          request<{ success: boolean; message: string; output: string }>('/api/v1/admin/system/cache/clear', {
            method: 'POST',
            body: { type },
            token,
          }),
      },
      backups: {
        list: (token: string) =>
          request<BackupItem[]>('/api/v1/admin/system/backups', { token }),
        create: (token: string) =>
          request<{ success: boolean; message: string; data: BackupItem }>('/api/v1/admin/system/backups/create', {
            method: 'POST',
            token,
          }),
        restore: (token: string, filename: string) =>
          request<{ success: boolean; message: string }>('/api/v1/admin/system/backups/restore', {
            method: 'POST',
            body: { filename },
            token,
          }),
        delete: (token: string, filename: string) =>
          request<{ success: boolean; message: string }>(`/api/v1/admin/system/backups/${filename}`, {
            method: 'DELETE',
            token,
          }),
      },
    },
    cms: {
      get: (token: string) => request<CmsContent>('/api/v1/admin/cms', { token }),
      update: (token: string, data: Partial<CmsContent>) =>
        request<CmsContent>('/api/v1/admin/cms', {
          method: 'POST',
          body: data,
          token,
        }),
    },
    portals: {
      getLinks: (token?: string) =>
        request<{ links: any[]; grouped: any; sections: any[] }>('/api/v1/external-links', { token }),
      createLink: (token: string, data: any) =>
        request<{ link: any; message: string }>('/api/v1/admin/external-links', {
          method: 'POST',
          body: data,
          token,
        }),
      updateLink: (token: string, id: number, data: any) =>
        request<{ link: any; message: string }>(`/api/v1/admin/external-links/${id}`, {
          method: 'PUT',
          body: data,
          token,
        }),
      deleteLink: (token: string, id: number) =>
        request<{ message: string }>(`/api/v1/admin/external-links/${id}`, {
          method: 'DELETE',
          token,
        }),
      getSections: (token?: string) =>
        request<{ sections: any[] }>('/api/v1/portal-sections', { token }),
      createSection: (token: string, data: any) =>
        request<{ section: any; message: string }>('/api/v1/admin/portal-sections', {
          method: 'POST',
          body: data,
          token,
        }),
      updateSection: (token: string, id: number, data: any) =>
        request<{ section: any; message: string }>(`/api/v1/admin/portal-sections/${id}`, {
          method: 'PUT',
          body: data,
          token,
        }),
      deleteSection: (token: string, id: number) =>
        request<{ message: string }>(`/api/v1/admin/portal-sections/${id}`, {
          method: 'DELETE',
          token,
        }),
      getEmergencyNumbers: (token?: string) =>
        request<{ numbers: any[]; grouped: any; categories: any[] }>('/api/v1/emergency-numbers', { token }),
      createEmergencyNumber: (token: string, data: any) =>
        request<{ emergency_number: any; message: string }>('/api/v1/admin/emergency-numbers', {
          method: 'POST',
          body: data,
          token,
        }),
      updateEmergencyNumber: (token: string, id: number, data: any) =>
        request<{ emergency_number: any; message: string }>(`/api/v1/admin/emergency-numbers/${id}`, {
          method: 'PUT',
          body: data,
          token,
        }),
      deleteEmergencyNumber: (token: string, id: number) =>
        request<{ message: string }>(`/api/v1/admin/emergency-numbers/${id}`, {
          method: 'DELETE',
          token,
        }),
      getCategories: (token?: string) =>
        request<{ categories: any[] }>('/api/v1/emergency-categories', { token }),
      createCategory: (token: string, data: any) =>
        request<{ category: any; message: string }>('/api/v1/admin/emergency-categories', {
          method: 'POST',
          body: data,
          token,
        }),
      updateCategory: (token: string, id: number, data: any) =>
        request<{ category: any; message: string }>(`/api/v1/admin/emergency-categories/${id}`, {
          method: 'PUT',
          body: data,
          token,
        }),
      deleteCategory: (token: string, id: number) =>
        request<{ message: string }>(`/api/v1/admin/emergency-categories/${id}`, {
          method: 'DELETE',
          token,
        }),
    },
    analytics: {
      overview: (token?: string, preset: string = 'this_month', start?: string, end?: string) => {
        const q = new URLSearchParams({ date_preset: preset, ...(start ? { start_date: start } : {}), ...(end ? { end_date: end } : {}) });
        return request<AdminAnalyticsOverview>(`/api/v1/admin/analytics/overview?${q}`, { token });
      },
      charts: (token?: string, preset: string = 'this_month', start?: string, end?: string) => {
        const q = new URLSearchParams({ date_preset: preset, ...(start ? { start_date: start } : {}), ...(end ? { end_date: end } : {}) });
        return request<AdminChartsData>(`/api/v1/admin/analytics/charts?${q}`, { token });
      },
    },
    alerts: {
      list: (token?: string, params?: { severity?: string; is_read?: boolean; page?: number }) => {
        const q = new URLSearchParams();
        if (params?.severity) q.set('severity', params.severity);
        if (params?.is_read !== undefined) q.set('is_read', String(params.is_read));
        if (params?.page) q.set('page', String(params.page));
        return request<OperationalAlertItem[]>(`/api/v1/admin/alerts?${q}`, { token });
      },
      unreadCount: (token?: string) =>
        request<{ unread_count: number }>('/api/v1/admin/alerts/unread-count', { token }),
      markAsRead: (id: number, token?: string) =>
        request<{ message: string }>(`/api/v1/admin/alerts/${id}/read`, { method: 'POST', token }),
      markAllAsRead: (token?: string) =>
        request<{ message: string }>('/api/v1/admin/alerts/read-all', { method: 'POST', token }),
    },
    emails: {
      getSettings: (token?: string) =>
        request<EmailSettingsData>('/api/v1/admin/emails/settings', { token }),
      updateSettings: (data: Partial<EmailSettingsData> & { smtp_password?: string }, token?: string) =>
        request<{ message: string; settings: EmailSettingsData }>('/api/v1/admin/emails/settings', {
          method: 'POST',
          body: data,
          token,
        }),
      getTemplates: (token?: string) =>
        request<EmailTemplateItem[]>('/api/v1/admin/emails/templates', { token }),
      updateTemplate: (id: number, data: Partial<EmailTemplateItem>, token?: string) =>
        request<{ template: EmailTemplateItem; message: string }>(`/api/v1/admin/emails/templates/${id}`, {
          method: 'PUT',
          body: data,
          token,
        }),
      sendTest: (recipientEmail: string, token?: string) =>
        request<{ message: string }>('/api/v1/admin/emails/send-test', {
          method: 'POST',
          body: { recipient_email: recipientEmail },
          token,
        }),
      getLogs: (token?: string, params?: { status?: string; search?: string; page?: number }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.page) q.set('page', String(params.page));
        return request<EmailLogItem[]>(`/api/v1/admin/emails/logs?${q}`, { token });
      },
      retryLog: (id: number, token?: string) =>
        request<{ message: string }>(`/api/v1/admin/emails/logs/${id}/retry`, {
          method: 'POST',
          token,
        }),
    },
    users: {
      stats: (token?: string) =>
        request<AdminUserStats>('/api/v1/admin/users/stats', { token }),
      list: (
        token?: string,
        params?: {
          role?: string;
          status?: string;
          search?: string;
          page?: number;
          sort_by?: string;
          sort_dir?: string;
        }
      ) => {
        const q = new URLSearchParams();
        if (params?.role && params.role !== 'all') q.set('role', params.role);
        if (params?.status && params.status !== 'all') q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.page) q.set('page', String(params.page));
        if (params?.sort_by) q.set('sort_by', params.sort_by);
        if (params?.sort_dir) q.set('sort_dir', params.sort_dir);
        return request<AdminUserItem[]>(`/api/v1/admin/users?${q}`, { token });
      },
      get: (id: number | string, params?: AdminUserReportFilter, token?: string) => {
        const q = new URLSearchParams();
        if (params?.period && params.period !== 'all') q.set('period', params.period);
        if (params?.start_date) q.set('start_date', params.start_date);
        if (params?.end_date) q.set('end_date', params.end_date);
        if (params?.payment_status && params.payment_status !== 'all') q.set('payment_status', params.payment_status);
        if (params?.search) q.set('search', params.search);
        if (params?.page) q.set('page', String(params.page));
        if (params?.per_page) q.set('per_page', String(params.per_page));
        const queryStr = q.toString();
        return request<AdminUserDetail>(`/api/v1/admin/users/${id}${queryStr ? `?${queryStr}` : ''}`, { token });
      },
      updateStatus: (id: number | string, is_active: boolean, token?: string) =>
        request<{ message: string; is_active: boolean }>(`/api/v1/admin/users/${id}/status`, {
          method: 'PATCH',
          body: { is_active },
          token,
        }),
      updateRole: (id: number | string, role: string, token?: string) =>
        request<{ message: string; role: string }>(`/api/v1/admin/users/${id}/role`, {
          method: 'PATCH',
          body: { role },
          token,
        }),
      updatePassword: (id: number | string, password: string, token?: string) =>
        request<{ message: string }>(`/api/v1/admin/users/${id}/password`, {
          method: 'PUT',
          body: { password },
          token,
        }),
    },
    vaultTypes: {
      list: (token?: string, params?: { search?: string; is_active?: boolean }) => {
        const q = new URLSearchParams();
        if (params?.search) q.append('search', params.search);
        if (params?.is_active !== undefined) q.append('is_active', params.is_active ? '1' : '0');
        const qs = q.toString() ? `?${q.toString()}` : '';
        return request<{ success: boolean; data: { types: any[]; count: number } }>(
          `/api/v1/admin/vault-document-types${qs}`,
          { token }
        );
      },
      create: (token: string, data: any) =>
        request<{ success: boolean; data: any; message: string }>('/api/v1/admin/vault-document-types', {
          method: 'POST',
          body: data,
          token,
        }),
      update: (token: string, id: number, data: any) =>
        request<{ success: boolean; data: any; message: string }>(`/api/v1/admin/vault-document-types/${id}`, {
          method: 'PUT',
          body: data,
          token,
        }),
      toggleStatus: (token: string, id: number) =>
        request<{ success: boolean; data: any; message: string }>(`/api/v1/admin/vault-document-types/${id}/status`, {
          method: 'PATCH',
          token,
        }),
      delete: (token: string, id: number) =>
        request<{ success: boolean; message: string }>(`/api/v1/admin/vault-document-types/${id}`, {
          method: 'DELETE',
          token,
        }),
    },
  },

  // Vault (Public / Client)
  vault: {
    getDocumentTypes: () =>
      request<{ success: boolean; data: { types: any[]; count: number } }>('/api/v1/vault/document-types'),
  },

  // User Accounts
  auth: {
    register: (data: { name: string; email: string; password: string; phone?: string }) =>
      request<{ user: UserProfile; token: string; message: string }>('/api/v1/auth/register', {
        method: 'POST',
        body: data,
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: UserProfile; businesses: BusinessItem[]; token: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: data,
      }),
    logout: (token?: string) =>
      request<{ message: string }>('/api/v1/auth/logout', { method: 'POST', token }),
    verifyEmail: (data: { token: string; email: string }) =>
      request<{ message: string; user: UserProfile }>('/api/v1/auth/verify-email', {
        method: 'POST',
        body: data,
      }),
    resendVerification: (data?: { email?: string }, token?: string) =>
      request<{ message: string }>('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: data,
        token,
      }),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: { email },
      }),
    resetPassword: (data: { token: string; email: string; password: string }) =>
      request<{ message: string }>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: data,
      }),
  },

  // User Profile & Document History
  user: {
    me: (token?: string) =>
      request<{ user: UserProfile; businesses: BusinessItem[] }>('/api/v1/user/me', { token }),
    updateProfile: (data: Partial<UserProfile>, token?: string) =>
      request<{ message: string; user: Partial<UserProfile> }>('/api/v1/user/profile', {
        method: 'PUT',
        body: data,
        token,
      }),
    changePassword: (data: { current_password: string; password: string; password_confirmation: string }, token?: string) =>
      request<{ message: string }>('/api/v1/user/password', {
        method: 'PUT',
        body: data,
        token,
      }),
    documents: (params?: { status?: string; payment_status?: string; page?: number }, token?: string) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.payment_status) q.set('payment_status', params.payment_status);
      if (params?.page) q.set('page', String(params.page));
      return request<UserDocumentItem[]>(`/api/v1/user/documents?${q}`, { token });
    },
    payments: (page: number = 1, token?: string) =>
      request<UserPaymentItem[]>(`/api/v1/user/payments?page=${page}`, { token }),
  },

  // Business Management
  business: {
    register: (data: { name: string; email: string; phone?: string; pan_vat_number?: string; registration_number?: string; address?: string; city?: string }, token?: string) =>
      request<{ business: BusinessItem; message: string }>('/api/v1/business/register', {
        method: 'POST',
        body: data,
        token,
      }),
    list: (token?: string) =>
      request<BusinessItem[]>('/api/v1/business', { token }),
    get: (id: number | string, token?: string) =>
      request<BusinessItem>(`/api/v1/business/${id}`, { token }),
    update: (id: number | string, data: Partial<BusinessItem>, token?: string) =>
      request<{ business: BusinessItem; message: string }>(`/api/v1/business/${id}`, {
        method: 'PUT',
        body: data,
        token,
      }),
    members: (id: number | string, token?: string) =>
      request<BusinessMemberItem[]>(`/api/v1/business/${id}/members`, { token }),
    invite: (id: number | string, data: { email: string; role: 'admin' | 'member'; name?: string }, token?: string) =>
      request<{ message: string }>(`/api/v1/business/${id}/members/invite`, {
        method: 'POST',
        body: data,
        token,
      }),
    removeMember: (id: number | string, userId: number | string, token?: string) =>
      request<{ message: string }>(`/api/v1/business/${id}/members/${userId}`, {
        method: 'DELETE',
        token,
      }),
    acceptInvitation: (invitationToken: string) =>
      request<{ business: { id: number; name: string }; message: string }>('/api/v1/business/invitations/accept', {
        method: 'POST',
        body: { token: invitationToken },
      }),
    dashboard: (id: number | string, params?: { date_preset?: string; start_date?: string; end_date?: string; status?: string; payment_status?: string; member_id?: string; search?: string; page?: number }, token?: string) => {
      const q = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
        });
      }
      return request<BusinessDashboardData>(`/api/v1/business/${id}/dashboard?${q}`, { token });
    },
  },
};
