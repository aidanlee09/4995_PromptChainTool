'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

export default function FlavorSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
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

      if (error) router.push('/');
      else {
        setSlug(data.slug);
        setDescription(data.description);
      }
      setFetching(false);
    }
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('humor_flavors')
        .update({ slug: slug.toLowerCase().trim(), description: description.trim() })
        .eq('id', id);
      if (error) throw error;
      router.push(`/flavor/${id}`);
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

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
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <button onClick={() => router.push(`/flavor/${id}`)} style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '13px', fontWeight: 700, cursor: 'pointer', marginBottom: '24px' }}>← CANCEL</button>
          
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '32px', color: 'var(--text-primary)' }}>Update Flavor Settings</h2>

          <div className={styles.statCard} style={{ padding: '32px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Name Identifier</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontWeight: 600 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Description</label>
                <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--text-primary)', color: 'var(--background)', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
