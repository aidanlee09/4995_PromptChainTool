'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
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
  description?: string;
}

interface Props {
  humorFlavorId: string;
  flavorSlug: string;
}

export const HumorFlavorStepManager: React.FC<Props> = ({ humorFlavorId, flavorSlug }) => {
  const [steps, setSteps] = useState<HumorFlavorStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingStep, setViewingStep] = useState<HumorFlavorStep | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Metadata states
  const [models, setModels] = useState<Metadata[]>([]);
  const [inputTypes, setInputTypes] = useState<Metadata[]>([]);
  const [outputTypes, setOutputTypes] = useState<Metadata[]>([]);
  const [stepTypes, setStepTypes] = useState<Metadata[]>([]);

  // Form state
  const [formData, setFormData] = useState<Partial<HumorFlavorStep>>({
    order_by: 1,
    llm_temperature: 0.7,
    description: '',
    llm_system_prompt: '',
    llm_user_prompt: '',
    llm_model_id: '',
    llm_input_type_id: '',
    llm_output_type_id: '',
    humor_flavor_step_type_id: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchMetadata();
    fetchSteps();
  }, [humorFlavorId]);

  const fetchMetadata = async () => {
    const [m, i, o, s] = await Promise.all([
      supabase.from('llm_models').select('id, name').order('name'),
      supabase.from('llm_input_types').select('id, slug').order('slug'),
      supabase.from('llm_output_types').select('id, slug').order('slug'),
      supabase.from('humor_flavor_step_types').select('id, slug').order('slug')
    ]);

    setModels(m.data || []);
    setInputTypes(i.data || []);
    setOutputTypes(o.data || []);
    setStepTypes(s.data || []);

    // Set defaults if available
    setFormData(prev => ({
      ...prev,
      llm_model_id: m.data?.[0]?.id || '',
      llm_input_type_id: i.data?.[0]?.id || '',
      llm_output_type_id: o.data?.[0]?.id || '',
      humor_flavor_step_type_id: s.data?.[0]?.id || ''
    }));
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
    
    // Add a visual effect to the row being dragged
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

    // Update local state for immediate feedback
    const updatedSteps = newSteps.map((step, idx) => ({
      ...step,
      order_by: idx + 1
    }));
    setSteps(updatedSteps);

    // Update database
    setLoading(true);
    try {
      const updates = updatedSteps.map(step => 
        supabase
          .from('humor_flavor_steps')
          .update({ order_by: step.order_by })
          .eq('id', step.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw new Error('Some steps failed to update');
      }
      
      setMessage({ text: 'Pipeline sequence updated', isError: false });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error('Error reordering steps:', err);
      setMessage({ text: 'Reorder failed - refreshing list', isError: true });
      fetchSteps(); // Revert to database state
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      ...formData,
      humor_flavor_id: humorFlavorId,
      order_by: Number(formData.order_by),
      llm_temperature: Number(formData.llm_temperature)
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('humor_flavor_steps')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        setMessage({ text: 'Step updated successfully', isError: false });
      } else {
        const { error } = await supabase
          .from('humor_flavor_steps')
          .insert([payload]);
        if (error) throw error;
        setMessage({ text: 'New step added to chain', isError: false });
      }

      resetForm();
      fetchSteps();
    } catch (err: any) {
      setMessage({ text: err.message || 'Operation failed', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (step: HumorFlavorStep) => {
    setEditingId(step.id);
    setFormData(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this step from the prompt chain?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('humor_flavor_steps').delete().eq('id', id);
      if (error) throw error;
      fetchSteps();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      order_by: (steps.length > 0 ? Math.max(...steps.map(s => s.order_by)) + 1 : 1),
      llm_temperature: 0.7,
      description: '',
      llm_system_prompt: '',
      llm_user_prompt: '',
      llm_model_id: models[0]?.id || '',
      llm_input_type_id: inputTypes[0]?.id || '',
      llm_output_type_id: outputTypes[0]?.id || '',
      humor_flavor_step_type_id: stepTypes[0]?.id || ''
    });
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '2px solid var(--button-secondary-border)', paddingTop: '40px', width: '100%' }}>
      {/* Prompt Viewer Modal */}
      {viewingStep && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.85)', 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div className={styles.statCard} style={{ 
            width: '100%', 
            maxWidth: '800px', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            padding: '40px',
            position: 'relative',
            background: 'var(--background)',
            border: '1px solid var(--button-secondary-border)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <button 
              onClick={() => setViewingStep(null)}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'var(--button-secondary-hover)',
                border: '1px solid var(--button-secondary-border)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
            
            <div style={{ marginBottom: '32px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step {viewingStep.order_by} Configuration</span>
              <h3 style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                {stepTypes.find(s => String(s.id) === String(viewingStep.humor_flavor_step_type_id))?.slug?.toUpperCase().replace(/-/g, ' ')}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>System Prompt</label>
                <pre style={{ 
                  padding: '20px', 
                  backgroundColor: 'var(--button-secondary-hover)', 
                  borderRadius: '12px', 
                  fontSize: '13px', 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  border: '1px solid var(--button-secondary-border)'
                }}>
                  {viewingStep.llm_system_prompt || '(No system prompt defined)'}
                </pre>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>User Prompt Template</label>
                <pre style={{ 
                  padding: '20px', 
                  backgroundColor: 'var(--button-secondary-hover)', 
                  borderRadius: '12px', 
                  fontSize: '13px', 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  border: '1px solid var(--button-secondary-border)'
                }}>
                  {viewingStep.llm_user_prompt || '(No user prompt defined)'}
                </pre>
              </div>

              {viewingStep.description && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>Internal Notes</label>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{viewingStep.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>
          Prompt Chain: {flavorSlug.toUpperCase()}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Configure the sequence of LLM operations for this humor style.</p>
      </div>

      {/* Step Form */}
      <div className={styles.statCard} style={{ padding: '32px', marginBottom: '40px', background: 'var(--header-background)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Order</label>
              <input type="number" value={formData.order_by} onChange={e => setFormData({...formData, order_by: parseInt(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Model</label>
              <select value={formData.llm_model_id} onChange={e => setFormData({...formData, llm_model_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Temperature</label>
              <input type="number" step="0.1" min="0" max="2" value={formData.llm_temperature} onChange={e => setFormData({...formData, llm_temperature: parseFloat(e.target.value)})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Step Type</label>
              <select value={formData.humor_flavor_step_type_id} onChange={e => setFormData({...formData, humor_flavor_step_type_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                {stepTypes.map(s => <option key={s.id} value={s.id}>{s.slug}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Input Type</label>
              <select value={formData.llm_input_type_id} onChange={e => setFormData({...formData, llm_input_type_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                {inputTypes.map(i => <option key={i.id} value={i.id}>{i.slug}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Output Type</label>
              <select value={formData.llm_output_type_id} onChange={e => setFormData({...formData, llm_output_type_id: e.target.value})} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
                {outputTypes.map(o => <option key={o.id} value={o.id}>{o.slug}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Step Description</label>
            <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Generate sarcastic puns based on image tags" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>System Prompt</label>
            <textarea rows={4} value={formData.llm_system_prompt} onChange={e => setFormData({...formData, llm_system_prompt: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User Prompt Template</label>
            <textarea rows={2} value={formData.llm_user_prompt} onChange={e => setFormData({...formData, llm_user_prompt: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            {message && <span style={{ fontSize: '13px', color: message.isError ? '#ef4444' : '#4ade80' }}>{message.text}</span>}
            <button type="submit" disabled={loading} style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: '#4ade80', color: '#000', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {editingId ? 'Update Step' : 'Add Step to Chain'}
            </button>
            {editingId && <button type="button" onClick={resetForm} style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--button-secondary-border)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Steps Table */}
      <div className={styles.statCard} style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--button-secondary-border)' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--button-secondary-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--button-secondary-hover)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sequence Pipeline — {steps.length} steps</span>
          {fetching && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700 }}>REFRESHING...</span>}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--button-secondary-border)' }}>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '40px' }}></th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '60px' }}>Ord</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pipeline Step</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Model</th>
                <th style={{ padding: '16px 32px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, index) => (
                <tr 
                  key={step.id} 
                  draggable={!loading}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{ 
                    borderBottom: '1px solid var(--button-secondary-border)', 
                    transition: 'background-color 0.2s',
                    cursor: loading ? 'wait' : 'grab'
                  }}
                >
                  <style>{`
                    tr:hover { background-color: var(--button-secondary-hover); }
                    tr:active { cursor: grabbing; }
                  `}</style>
                  <td style={{ padding: '20px 0 20px 32px', color: 'var(--text-secondary)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="15" x2="16" y2="15"></line></svg>
                  </td>
                  <td style={{ padding: '20px 20px 20px 0' }}>
                    <span style={{ 
                      display: 'inline-block',
                      padding: '4px 10px',
                      backgroundColor: 'rgba(74, 222, 128, 0.1)',
                      color: '#4ade80',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 800,
                      fontFamily: 'monospace'
                    }}>
                      {step.order_by}
                    </span>
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {stepTypes.find(s => String(s.id) === String(step.humor_flavor_step_type_id))?.slug?.toUpperCase().replace(/-/g, ' ') || 'UNKNOWN STEP'}
                  </td>
                  <td style={{ padding: '20px 32px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {models.find(m => String(m.id) === String(step.llm_model_id))?.name || step.llm_model_id}
                  </td>
                  <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setViewingStep(step); }} 
                        title="View Prompts"
                        style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(step); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>EDIT</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(step.id); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer', opacity: 0.8 }}>REMOVE</button>
                    </div>
                  </td>
                </tr>
              ))}
              {steps.length === 0 && !fetching && (
                <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No steps defined for this prompt chain.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
