import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createClientServer: jest.fn(() => Promise.resolve({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: {
          user: { 
            email: 'test@example.com', 
            id: '123',
            user_metadata: { full_name: 'Test User' }
          }
        }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { is_superadmin: true, is_matrix_admin: false }
          }))
        }))
      }))
    }))
  }))
}));

// Mock the components
jest.mock('@/components/HumorFlavorManager', () => ({
  HumorFlavorManager: () => <div data-testid="flavor-manager">HumorFlavorManager</div>
}));

jest.mock('@/components/SignOutButton', () => ({
  SignOutButton: () => <button>Sign Out</button>
}));

describe('Home', () => {
  it('renders the dashboard', async () => {
    // Note: Testing async server components directly with RTL is not fully supported 
    // without some extra setup, but this is a representative test.
    const ResolvedHome = await Home();
    render(ResolvedHome);
    
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
    expect(screen.getByTestId('flavor-manager')).toBeInTheDocument();
  });
});
