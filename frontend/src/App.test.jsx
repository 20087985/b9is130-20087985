import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

vi.mock('./components/Login', () => ({
  default: ({ onLoginSuccess }) => (
    <div>
      <span>Mock Login Screen</span>
      <button type="button" onClick={onLoginSuccess}>
        Trigger Login Success
      </button>
    </div>
  ),
}));

vi.mock('./components/Home', () => ({
  default: ({ onLogout }) => (
    <div>
      <span>Mock Home Screen</span>
      <button type="button" onClick={onLogout}>
        Trigger Logout
      </button>
    </div>
  ),
}));

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Login when no token exists in localStorage', () => {
    render(<App />);
    expect(screen.getByText('Mock Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Mock Home Screen')).not.toBeInTheDocument();
  });

  it('renders Home when a token already exists in localStorage', () => {
    localStorage.setItem('token', 'sample-jwt-token');

    render(<App />);
    expect(screen.getByText('Mock Home Screen')).toBeInTheDocument();
    expect(screen.queryByText('Mock Login Screen')).not.toBeInTheDocument();
  });

  it('switches to Home when Login calls onLoginSuccess', () => {
    render(<App />);
    expect(screen.getByText('Mock Login Screen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /trigger login success/i }));

    expect(screen.getByText('Mock Home Screen')).toBeInTheDocument();
    expect(screen.queryByText('Mock Login Screen')).not.toBeInTheDocument();
  });

  it('clears token and user from localStorage and returns to Login on logout', () => {
    localStorage.setItem('token', 'sample-jwt-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Alex' }));

    render(<App />);
    expect(screen.getByText('Mock Home Screen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /trigger logout/i }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(screen.getByText('Mock Login Screen')).toBeInTheDocument();
  });
});