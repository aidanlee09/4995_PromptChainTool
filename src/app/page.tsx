import styles from "./page.module.css";
import { SignOutButton } from "@/components/SignOutButton";
import { HumorFlavorManager } from "@/components/HumorFlavorManager";
import { createClientServer } from "@/lib/supabase-server";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Chain Tool",
};

export default async function Home() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  // The middleware already protects this page, but we fetch profile data
  // to show role info if it exists.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user?.id)
    .single();

  const isAlwaysAllowed = user?.email === 'atl2159@columbia.edu';
  const role = isAlwaysAllowed ? 'Owner (me)' : 
               profile?.is_superadmin ? 'Super Admin' : 
               profile?.is_matrix_admin ? 'Matrix Admin' : 'Authorized User';

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className={styles.page}>
      <header style={{ 
        width: '100%', 
        padding: '0.75rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--header-border)',
        backgroundColor: 'var(--header-background)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {avatarUrl && (
            <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--header-border)' }}>
              <Image src={avatarUrl} alt={fullName} fill sizes="36px" style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{fullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{role} • {user?.email}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>
      <main className={styles.main}>
        <HumorFlavorManager />
      </main>
    </div>
  );
}
