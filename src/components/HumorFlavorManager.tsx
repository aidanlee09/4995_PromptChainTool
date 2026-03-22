'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from '../app/page.module.css';

interface HumorFlavor {
  id: string;
  slug: string;
  description: string;
  created_datetime_utc: string;
}

export const HumorFlavorManager: React.FC = () => {
  const [flavors, setFlavors] = useState<HumorFlavor[]>([]);
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const fetchFlavors = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('humor_flavors')
      .select('*')
      .order('slug', { ascending: true });

    if (error) {
      console.error('Error fetching flavors:', error);
    } else {
      setFlavors(data || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchFlavors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !description) {
      setMessage({ text: 'Please fill in all fields', isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('humor_flavors')
        .insert([{ slug: slug.toLowerCase().trim(), description: description.trim() }]);

      if (error) throw error;
      setMessage({ text: 'New flavor added to humor flavors', isError: false });

      setSlug('');
      setDescription('');
      setShowForm(false);
      fetchFlavors();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'Operation failed', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (flavor: HumorFlavor) => {
    router.push(`/flavor/${flavor.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this humor flavor?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('humor_flavors').delete().eq('id', id);
      if (error) throw error;
      fetchFlavors();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Humor Engine</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>Manage the linguistic styles of the prompt generation system.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            backgroundColor: showForm ? 'var(--button-secondary-hover)' : '#4ade80',
            color: showForm ? 'var(--text-primary)' : '#000',
            border: showForm ? '1px solid var(--button-secondary-border)' : 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {showForm ? 'Cancel' : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Flavor
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className={styles.statCard} style={{ padding: '32px', border: '1px solid var(--button-secondary-border)', background: 'var(--card-background)', animation: 'slideIn 0.3s ease-out' }}>
          <style>{`
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Flavor Name</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. deadpan"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--button-secondary-border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description of new humor flavor"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--button-secondary-border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              {message && (
                <span style={{ fontSize: '13px', fontWeight: 600, color: message.isError ? '#ef4444' : '#4ade80', marginRight: 'auto' }}>
                  {message.text}
                </span>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--background)',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Processing...' : 'Save Flavor'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.statCard} style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--button-secondary-border)' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--button-secondary-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--button-secondary-hover)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Humor Flavors — {flavors.length} items</span>
          {fetching && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>REFRESHING...</span>}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--button-secondary-border)' }}>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {flavors.map((flavor) => (
                <tr key={flavor.id} style={{ borderBottom: '1px solid var(--button-secondary-border)', transition: 'background-color 0.2s' }}>
                  <style>{`
                    tr:hover { background-color: var(--button-secondary-hover); }
                  `}</style>
                  <td style={{ padding: '20px 32px' }}>
                    <button 
                      onClick={() => router.push(`/flavor/${flavor.id}`)}
                      style={{ 
                        background: 'none',
                        border: 'none',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        color: '#4ade80',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(74, 222, 128, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {flavor.slug.toUpperCase()}
                    </button>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-primary)', maxWidth: '400px', lineHeight: '1.5' }}>
                    {flavor.description}
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => router.push(`/flavor/${flavor.id}/test`)}
                        style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', padding: '4px', fontSize: '12px', fontWeight: 700 }}
                      >
                        TEST
                      </button>
                      <button 
                        onClick={() => handleEdit(flavor)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', fontSize: '12px', fontWeight: 700 }}
                      >
                        EDIT
                      </button>
                      <button 
                        onClick={() => handleDelete(flavor.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', fontSize: '12px', fontWeight: 700, opacity: 0.8 }}
                      >
                        REMOVE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {flavors.length === 0 && !fetching && (
                <tr>
                  <td colSpan={3} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    The humor flavors list is currently empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
