'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from '../../../page.module.css';
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";

interface ImageInfo {
  id: string;
  url: string;
}

interface StudyImageSet {
  id: number;
  slug: string;
  images: ImageInfo[];
}

interface GenerationResult {
  imageId: string;
  imageUrl: string;
  caption?: string;
  loading: boolean;
  error?: string;
  debug?: any;
}

export default function TestFlavorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [flavor, setFlavor] = useState<any>(null);
  const [imageSets, setImageSets] = useState<StudyImageSet[]>([]);
  const [fetching, setFetching] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Evaluation state
  const [activeSet, setActiveSet] = useState<StudyImageSet | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: flavorData } = await supabase
        .from('humor_flavors')
        .select('*')
        .eq('id', id)
        .single();
      setFlavor(flavorData);

      const { data: sets } = await supabase
        .from('study_image_sets')
        .select('*')
        .order('id', { ascending: true });

      if (sets) {
        const setsWithImages = await Promise.all(sets.map(async (set) => {
          const { data: mappings } = await supabase
            .from('study_image_set_image_mappings')
            .select('image_id')
            .eq('study_image_set_id', set.id);

          const imageIds = mappings?.map(m => m.image_id) || [];
          
          if (imageIds.length > 0) {
            const { data: images } = await supabase
              .from('images')
              .select('id, url')
              .in('id', imageIds);
            
            return {
              ...set,
              images: images || []
            };
          }
          return { ...set, images: [] };
        }));
        setImageSets(setsWithImages);
      }
      
      setFetching(false);
    }
    fetchData();
  }, [id]);

  const handleSetClick = async (set: StudyImageSet) => {
    if (set.images.length === 0) return;
    
    setActiveSet(set);
    setIsEvaluating(true);
    
    // Initialize results
    const initialResults = set.images.map(img => ({
      imageId: img.id,
      imageUrl: img.url,
      loading: true
    }));
    setResults(initialResults);

    // Process images sequentially
    for (let i = 0; i < set.images.length; i++) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-caption', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            flavorId: id,
            imageId: set.images[i].id
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`);
        }
        
        setResults(prev => {
          const newResults = [...prev];
          newResults[i] = {
            ...newResults[i],
            caption: data.caption,
            debug: data.debug || data.raw,
            loading: false
          };
          return newResults;
        });
      } catch (err: any) {
        setResults(prev => {
          const newResults = [...prev];
          newResults[i] = {
            ...newResults[i],
            loading: false,
            error: err.message || "Generation failed"
          };
          return newResults;
        });
      }
    }
    setIsEvaluating(false);
  };

  if (fetching) return <div className={styles.page}><main className={styles.main}><p>Loading image sets...</p></main></div>;

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

      {/* Evaluation Overlay */}
      {activeSet && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'var(--background)', 
          zIndex: 1000, 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '24px 40px', 
            borderBottom: '1px solid var(--header-border)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--header-background)',
            zIndex: 10
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase' }}>Evaluating {flavor?.slug.toUpperCase()}</span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{activeSet.slug.toUpperCase().replace(/-/g, ' ')}</h2>
            </div>
            <button 
              onClick={() => {
                if (isEvaluating && !confirm('Stop evaluation and close?')) return;
                setActiveSet(null);
              }}
              style={{
                background: 'var(--button-secondary-hover)',
                border: '1px solid var(--button-secondary-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--button-secondary-border)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)'}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            {results.map((result, idx) => (
              <div key={idx} style={{ 
                display: 'grid', 
                gridTemplateColumns: '300px 1fr', 
                gap: '32px',
                padding: '32px',
                borderRadius: '16px',
                backgroundColor: 'var(--button-secondary-hover)',
                border: '1px solid var(--button-secondary-border)'
              }}>
                <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--button-secondary-border)' }}>
                  <Image src={result.imageUrl} alt="Test image" fill sizes="300px" style={{ objectFit: 'cover' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Generated Caption</span>
                  </div>
                  {result.loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '20px', height: '20px', border: '2px solid var(--button-secondary-border)', borderTopColor: '#4ade80', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Generating caption...</span>
                    </div>
                  ) : result.error ? (
                    <p style={{ color: '#ef4444', fontSize: '14px' }}>{result.error}</p>
                  ) : (
                    <>
                      <p style={{ fontSize: '18px', color: 'var(--text-primary)', lineHeight: '1.6', fontWeight: 500 }}>
                        {result.caption}
                      </p>
                      {result.caption === "No caption generated by pipeline" && result.debug && (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pipeline returned data but no caption_text found. Full response logged to console.</p>
                          <pre style={{ fontSize: '10px', color: 'var(--text-secondary)', backgroundColor: 'var(--background)', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '150px', border: '1px solid var(--button-secondary-border)' }}>
                            {JSON.stringify(result.debug, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}

      <main className={styles.main} style={{ maxWidth: '1400px', padding: '40px 20px' }}>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <button onClick={() => router.push(`/flavor/${id}`)} style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}>← BACK TO FLAVOR</button>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Test Environment: {flavor?.slug.toUpperCase()}</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Select an image set to evaluate the prompt chain.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {imageSets.map((set) => (
              <div 
                key={set.id} 
                className={styles.statCard} 
                onClick={() => handleSetClick(set)}
                style={{ 
                  padding: '20px', 
                  gap: '16px', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid var(--button-secondary-border)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#4ade80';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--button-secondary-border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ backgroundColor: 'rgba(74, 222, 128, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>SET {set.id}</span>
                    {set.slug.toUpperCase().replace(/-/g, ' ')}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'var(--button-secondary-hover)', padding: '2px 8px', borderRadius: '4px' }}>
                    {set.images.length} IMAGES
                  </span>
                </div>
                
                {set.images.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Empty set.</p>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))', 
                    gap: '8px' 
                  }}>
                    {set.images.slice(0, 10).map((img, idx) => (
                      <div key={idx} style={{ 
                        position: 'relative', 
                        aspectRatio: '1', 
                        borderRadius: '4px', 
                        overflow: 'hidden',
                        border: '1px solid var(--button-secondary-border)',
                        opacity: 0.6
                      }}>
                        <Image src={img.url} alt="" fill sizes="50px" style={{ objectFit: 'cover' }} />
                      </div>
                    ))}
                    {set.images.length > 10 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)', backgroundColor: 'var(--button-secondary-hover)', borderRadius: '4px' }}>
                        +{set.images.length - 10}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
