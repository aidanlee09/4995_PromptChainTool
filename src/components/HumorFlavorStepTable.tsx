'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from '../app/page.module.css';

interface HumorFlavorStep {
  id: string;
  humor_flavor_id: string;
  llm_temperature: number;
  order_by: number;
  llm_input_type_id: string;
  llm_output_type_id: string;
  llm_model_id: string;
  humor_flavor_step_type_id: string;
  llm_system_prompt: string;
  llm_user_prompt: string;
  description: string;
}

interface Metadata {
  id: string | number;
  slug?: string;
  name?: string;
}

interface Props {
  humorFlavorId: string;
  flavorSlug: string;
}

export const HumorFlavorStepTable: React.FC<Props> = ({ humorFlavorId, flavorSlug }) => {
  const [steps, setSteps] = useState<HumorFlavorStep[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [viewingStep, setViewingStep] = useState<HumorFlavorStep | null>(null);
  const [models, setModels] = useState<Metadata[]>([]);
  const [stepTypes, setStepTypes] = useState<Metadata[]>([]);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchMetadata();
    fetchSteps();
  }, [humorFlavorId]);

  const fetchMetadata = async () => {
    const [m, s] = await Promise.all([
      supabase.from('llm_models').select('id, name'),
      supabase.from('humor_flavor_step_types').select('id, slug')
    ]);
    setModels(m.data || []);
    setStepTypes(s.data || []);
  };

  const fetchSteps = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('humor_flavor_steps')
      .select('*')
      .eq('humor_flavor_id', humorFlavorId)
      .order('order_by', { ascending: true });

    if (error) console.error('Error fetching steps:', error);
    else setSteps(data || []);
    setFetching(false);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('draggedIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('draggedIndex'));
    if (draggedIndex === targetIndex) return;

    const newSteps = [...steps];
    const [draggedItem] = newSteps.splice(draggedIndex, 1);
    newSteps.splice(targetIndex, 0, draggedItem);

    const updatedSteps = newSteps.map((step, idx) => ({ ...step, order_by: idx + 1 }));
    setSteps(updatedSteps);

    setLoading(true);
    try {
      const updates = updatedSteps.map(step => 
        supabase.from('humor_flavor_steps').update({ order_by: step.order_by }).eq('id', step.id)
      );
      await Promise.all(updates);
    } catch (err) {
      console.error('Error reordering:', err);
      fetchSteps();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this step?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('humor_flavor_steps').delete().eq('id', id);
      if (error) throw error;
      fetchSteps();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {viewingStep && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div className={styles.statCard} style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative', background: 'var(--background)', border: '1px solid var(--button-secondary-border)' }}>
            <button onClick={() => setViewingStep(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--button-secondary-hover)', border: '1px solid var(--button-secondary-border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {viewingStep.order_by} Configuration</span>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>{stepTypes.find(s => String(s.id) === String(viewingStep.humor_flavor_step_type_id))?.slug?.toUpperCase().replace(/-/g, ' ')}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>System Prompt</label>
                <pre style={{ padding: '20px', backgroundColor: 'var(--button-secondary-hover)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6', border: '1px solid var(--button-secondary-border)' }}>{viewingStep.llm_system_prompt || '(No system prompt defined)'}</pre>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>User Prompt Template</label>
                <pre style={{ padding: '20px', backgroundColor: 'var(--button-secondary-hover)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: '1.6', border: '1px solid var(--button-secondary-border)' }}>{viewingStep.llm_user_prompt || '(No user prompt defined)'}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.statCard} style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--button-secondary-border)' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--button-secondary-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--button-secondary-hover)' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Humor Flavor Steps — {steps.length} steps</span>
          {fetching && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>REFRESHING...</span>}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--button-secondary-border)' }}>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', width: '40px' }}></th>
                <th style={{ padding: '16px 0', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', width: '60px', textAlign: 'center' }}>STEP</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>DESCRIPTION</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'right' }}>MANAGEMENT</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, index) => (
                <tr key={step.id} draggable={!loading} onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd} style={{ borderBottom: '1px solid var(--button-secondary-border)', transition: 'background-color 0.2s', cursor: loading ? 'wait' : 'grab' }}>
                  <style>{`tr:hover { background-color: var(--button-secondary-hover); } tr:active { cursor: grabbing; }`}</style>
                  <td style={{ padding: '20px 0 20px 32px', color: 'var(--text-secondary)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="15" x2="16" y2="15"></line></svg>
                  </td>
                  <td style={{ padding: '20px 0', textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', borderRadius: '6px', fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', minWidth: '32px' }}>{step.order_by}</span>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{stepTypes.find(s => String(s.id) === String(step.humor_flavor_step_type_id))?.slug?.toUpperCase().replace(/-/g, ' ') || 'UNKNOWN STEP'}</td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button onClick={(e) => { e.stopPropagation(); setViewingStep(step); }} title="View Prompts" style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                      <button onClick={(e) => { e.stopPropagation(); router.push(`/flavor/${humorFlavorId}/step/${step.id}`); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>EDIT</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(step.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: 0.8 }}>REMOVE</button>
                    </div>
                  </td>
                </tr>
              ))}
              {steps.length === 0 && !fetching && (
                <tr><td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No steps defined for this prompt chain.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
