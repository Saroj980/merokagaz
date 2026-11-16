/** Shared types for the Mero Kagaz document download renderer */

export interface DocLayout {
  paperMode?: 'plain_preprinted' | 'full_header_footer' | 'legal_deed';
  showHeader?: boolean;
  showFooter?: boolean;
  showDateRef?: boolean;
  showWatermark?: boolean;
  showEmblem?: boolean;
  topMarginMm?: number;
  bottomMarginMm?: number;
  header?: string;
  office?: string;
  subject?: string;
  body?: string;
  declaration?: string;
  signatory?: string;
  authority?: string;
}

export interface OrderData {
  id: number | string;
  public_order_no: string;
  created_at: string;
  form_data: Record<string, string>;
  document?: {
    slug: string;
    name: string;
    name_np: string;
  };
}

export interface RendererContext {
  orderData: OrderData;
  docSlug: string;
  docMeta: any;
  docLayout: DocLayout | null;
  formData: Record<string, string>;
  orderDate: string;
  /** Replace {{key}} placeholders with styled form values */
  replacePlaceholders: (text: string) => string;
}

export interface LayoutFlags {
  isPlainPreprinted: boolean;
  isLegalDeed: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showDateRef: boolean;
  showWatermark: boolean;
  showEmblem: boolean;
  topMargin: number;
  bottomMargin: number;
}
