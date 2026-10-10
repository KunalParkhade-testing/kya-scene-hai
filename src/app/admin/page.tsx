import AdminStudio from '@/components/admin/AdminStudio'
import AdminAccessDenied from '@/components/admin/AdminAccessDenied'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // Preserve the existing login screen for signed-out visitors.
  if (error || !user) {
    return <AdminStudio />
  }

  // Check the trusted role on the server before rendering the editor.
  if (user.app_metadata?.role !== 'admin') {
    return <AdminAccessDenied />
  }

  return <AdminStudio />
}
