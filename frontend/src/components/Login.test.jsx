import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

vi.mock('../config', () => ({
  API_URL: 'http://localhost:5000',
}));

describe('Login component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders login form by default and toggles to registration form when clicking Register here', () => {
    render(<Login onLoginSuccess={vi.fn()} />);

    expect(screen.getByText('Campus Club Login')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Full Name')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText(/register here/i));

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument();
  });

  it('logs in user, saves token and user in localStorage, and calls onLoginSuccess', async () => {
    const onLoginSuccess = vi.fn();
    const mockUser = { id: 'u-1', name: 'Basima', email: 'basima@example.com' };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'jwt-123', user: mockUser }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Login onLoginSuccess={onLoginSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { value: 'basima@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Secret123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'basima@example.com',
          password: 'Secret123!',
        }),
      })
    );
    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
  });

  it('registers a new user, shows success message, and switches back to login mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'User registered' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Login onLoginSuccess={vi.fn()} />);

    fireEvent.click(screen.getByText(/register here/i));
    fireEvent.change(screen.getByPlaceholderText('Full Name'), {
      target: { value: 'Basima Salim' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { value: 'basima@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Secret123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    await waitFor(() => {
      expect(screen.getByText('Registration successful! Please log in.')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Basima Salim',
          email: 'basima@example.com',
          password: 'Secret123!',
        }),
      })
    );
    expect(screen.getByText('Campus Club Login')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toHaveValue('');
  });

  it('displays error message when authentication fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Login onLoginSuccess={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Email Address'), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'badpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
    expect(localStorage.getItem('token')).toBeNull();
  });
});