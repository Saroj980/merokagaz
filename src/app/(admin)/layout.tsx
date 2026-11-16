import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Mero Kagaz Admin', template: '%s | MK Admin' },
  robots: 'noindex, nofollow',
};

/** Admin layout — dark theme, no public nav */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#E6F6F3] text-[#17212B]">{children}</div>;
}
