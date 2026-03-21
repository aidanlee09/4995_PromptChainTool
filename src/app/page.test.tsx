import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders the Next.js logo', () => {
    render(<Home />);
    const logo = screen.getByAltText('Next.js logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders the getting started text', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', {
      name: /to get started, edit the page\.tsx file\./i,
    });
    expect(heading).toBeInTheDocument();
  });
});
