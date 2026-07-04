import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { UnsavedGuardProvider } from "@/components/admin/unsaved-guard";
import { SESSION_COOKIE } from "@/lib/constants";
import { verifySession } from "@/lib/session";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !(await verifySession(token))) {
    redirect("/admin/login");
  }

  return (
    <div className="admin">
      <UnsavedGuardProvider>
        <AdminSidebar />
        {children}
      </UnsavedGuardProvider>
    </div>
  );
}
