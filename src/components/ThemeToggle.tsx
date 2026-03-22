'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ 
      display: 'flex', 
      gap: '4px', 
      padding: '4px', 
      backgroundColor: 'var(--button-secondary-hover)', 
      borderRadius: '8px',
      border: '1px solid var(--button-secondary-border)'
    }}>
      {(['light', 'dark', 'system'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: theme === t ? 'var(--background)' : 'transparent',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: theme === t ? 600 : 400,
            cursor: 'pointer',
            textTransform: 'capitalize',
            transition: 'all 0.2s ease',
            boxShadow: theme === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
};
