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
  stepId?: string; // Optional: if provided, we're editing
  onSuccess?: () => void;
}

export const HumorFlavorStepForm: React.FC<Props> = ({ humorFlavorId, stepId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!stepId);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [models, setModels] = useState<Metadata[]>([]);
  const [inputTypes, setInputTypes] = useState<Metadata[]>([]);
  const [outputTypes, setOutputTypes] = useState<Metadata[]>([]);
  const [stepTypes, setStepTypes] = useState<Metadata[]>([]);

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
  const router = useRouter();

  useEffect(() => {
    fetchMetadata();
    if (stepId) fetchStep();
  }, [stepId]);

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

    if (!stepId) {
      setFormData(prev => ({
        ...prev,
        llm_model_id: m.data?.[0]?.id || '',
        llm_input_type_id: i.data?.[0]?.id || '',
        llm_output_type_id: o.data?.[0]?.id || '',
        humor_flavor_step_type_id: s.data?.[0]?.id || ''
      }));
    }
  };

  const fetchStep = async () => {
    const { data, error } = await supabase.from('humor_flavor_steps').select('*').eq('id', stepId).single();
    if (error) {
      console.error(error);
      router.push(`/flavor/${humorFlavorId}`);
    } else {
      setFormData(data);
    }
    setFetching(false);
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
      if (stepId) {
        const { error } = await supabase.from('humor_flavor_steps').update(payload).eq('id', stepId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('humor_flavor_steps').insert([payload]);
        if (error) throw error;
      }
      if (onSuccess) onSuccess();
      else router.push(`/flavor/${humorFlavorId}`);
    } catch (err: any) {
      setMessage({ text: err.message || 'Operation failed', isError: true });
      setLoading(false);
    }
  };

  if (fetching) return <p>Loading step configuration...</p>;

  return (
    <div className={styles.statCard} style={{ padding: '32px', background: 'var(--header-background)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Step</label>
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
          <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Generate sarcastic puns" style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>System Prompt</label>
          <textarea rows={6} value={formData.llm_system_prompt} onChange={e => setFormData({...formData, llm_system_prompt: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User Prompt Template</label>
          <textarea rows={3} value={formData.llm_user_prompt} onChange={e => setFormData({...formData, llm_user_prompt: e.target.value})} style={{ padding: '12px', borderRadius: '6px', border: '1px solid var(--button-secondary-border)', backgroundColor: 'var(--background)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '13px' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          {message && <span style={{ fontSize: '13px', color: message.isError ? '#ef4444' : '#4ade80' }}>{message.text}</span>}
          <button type="submit" disabled={loading} style={{ padding: '12px 32px', borderRadius: '8px', backgroundColor: '#4ade80', color: '#000', border: 'none', fontWeight: 800, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {stepId ? 'Update Pipeline Step' : 'Add Step to Chain'}
          </button>
          <button type="button" onClick={() => router.push(`/flavor/${humorFlavorId}`)} style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--button-secondary-border)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
};
