'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from '../../../../page.module.css';
import { HumorFlavorStepForm } from '@/components/HumorFlavorStepForm';
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

export default function EditStepPage({ params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { id, stepId } = use(params);
  const router = useRouter();
  const [flavor, setFlavor] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data } = await supabase.from('humor_flavors').select('slug').eq('id', id).single();
      setFlavor(data);
      setFetching(false);
    }
    fetchData();
  }, [id]);

  if (fetching) return <div className={styles.page}><main className={styles.main}><p>Loading...</p></main></div>;

  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className={styles.page}>
      <header style={{ width: '100%', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--header-border)', backgroundColor: 'var(--header-background)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {avatarUrl && (
            <div style={{ position: 'relative', width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--header-border)' }}>
              <Image src={avatarUrl} alt={fullName} fill sizes="36px" style={{ objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{fullName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ width: '100%', maxWidth: '1000px' }}>
          <button onClick={() => router.push(`/flavor/${id}`)} style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '24px' }}>← CANCEL</button>
          
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Edit Pipeline Step</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Flavor: <span style={{ color: '#4ade80', fontWeight: 700 }}>{flavor?.slug.toUpperCase()}</span></p>
          </div>

          <HumorFlavorStepForm humorFlavorId={id} stepId={stepId} />
        </div>
      </main>
    </div>
  );
}
