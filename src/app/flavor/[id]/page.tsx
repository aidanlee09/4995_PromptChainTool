'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from '../../page.module.css';
import { HumorFlavorStepTable } from '@/components/HumorFlavorStepTable';
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

interface HumorFlavor {
  id: string;
  slug: string;
  description: string;
  created_datetime_utc: string;
}

export default function FlavorDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [flavor, setFlavor] = useState<HumorFlavor | null>(null);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data, error } = await supabase
        .from('humor_flavors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching flavor:', error);
        router.push('/');
      } else {
        setFlavor(data);
      }
      setFetching(false);
    }
    fetchData();
  }, [id, router]);

  if (fetching) return <div className={styles.page}><main className={styles.main}><p>Loading...</p></main></div>;

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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle />
          <SignOutButton />
        </div>
      </header>

      <main className={styles.main}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <button 
                onClick={() => router.push('/')}
                style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '13px', fontWeight: 700, cursor: 'pointer', padding: '0', marginBottom: '12px' }}
              >
                ← BACK TO ALL FLAVORS
              </button>
              <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {flavor?.slug.toUpperCase()}
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '4px' }}>{flavor?.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => router.push(`/flavor/${id}/test`)}
                style={{ padding: '12px 24px', borderRadius: '10px', backgroundColor: 'transparent', color: '#4ade80', border: '1px solid #4ade80', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Test Flavor
              </button>
              <button 
                onClick={() => router.push(`/flavor/${id}/settings`)}
                style={{ padding: '12px 24px', borderRadius: '10px', backgroundColor: 'var(--button-secondary-hover)', color: 'var(--text-primary)', border: '1px solid var(--button-secondary-border)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Update Flavor Settings
              </button>
              <button 
                onClick={() => router.push(`/flavor/${id}/step/new`)}
                style={{ padding: '12px 24px', borderRadius: '10px', backgroundColor: '#4ade80', color: '#000', border: 'none', fontSize: '13px', fontWeight: 800, cursor: 'pointer' }}
              >
                Add Step to Chain
              </button>
            </div>
          </div>

          <HumorFlavorStepTable humorFlavorId={id} flavorSlug={flavor?.slug || ''} />
        </div>
      </main>
    </div>
  );
}
