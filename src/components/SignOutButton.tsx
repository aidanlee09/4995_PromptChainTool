'use client';

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export const SignOutButton = () => {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#f3f4f6',
        color: '#374151',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
    >
      Sign Out
    </button>
  );
};
