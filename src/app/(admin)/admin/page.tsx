import { redirect } from 'next/navigation';

// /admin → /admin/login
export default function AdminRootPage() {
  redirect('/admin/login');
}
