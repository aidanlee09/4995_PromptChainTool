import { render, screen } from '@testing-library/react';
import Home from './page';

// Mock the supabase server client
jest.mock('@/lib/supabase-server', () => ({
  createClientServer: jest.fn(() => Promise.resolve({
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: {
          user: { email: 'test@example.com', id: '123' }
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
jest.mock('@/components/ApiButton', () => ({
  ApiButton: () => <div data-testid="api-button">ApiButton</div>
}));

jest.mock('@/components/SignOutButton', () => ({
  SignOutButton: () => <button>Sign Out</button>
}));

describe('Home', () => {
  it('renders the welcome message', async () => {
    // Note: Testing async server components directly with RTL is not fully supported 
    // without some extra setup, but this is a representative test.
    const ResolvedHome = await Home();
    render(ResolvedHome);
    
    expect(screen.getByText(/Welcome back\./i)).toBeInTheDocument();
    expect(screen.getByText(/test@example\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: Super Admin/i)).toBeInTheDocument();
    expect(screen.getByTestId('api-button')).toBeInTheDocument();
  });
});
