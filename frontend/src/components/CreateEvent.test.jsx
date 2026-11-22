import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateEvent from './CreateEvent';

vi.mock('../config', () => ({
  API_URL: 'http://localhost:5000',
}));

function fillEventForm() {
  fireEvent.change(screen.getByPlaceholderText('Event Title'), {
    target: { name: 'title', value: 'AI Workshop' },
  });
  fireEvent.change(screen.getByPlaceholderText(/club name/i), {
    target: { name: 'clubName', value: 'Tech Club' },
  });
  fireEvent.change(document.querySelector('input[name="date"]'), {
    target: { name: 'date', value: '2026-12-15' },
  });
  fireEvent.change(screen.getByPlaceholderText(/location/i), {
    target: { name: 'location', value: 'Room 101' },
  });
  fireEvent.change(screen.getByPlaceholderText(/event description/i), {
    target: { name: 'description', value: 'Hands-on session on AI tools.' },
  });
}

describe('CreateEvent component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the form heading, inputs, and submit button', () => {
    render(<CreateEvent />);

    expect(screen.getByText('Post a New Campus Event')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Event Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/club name/i)).toBeInTheDocument();
    expect(document.querySelector('input[name="date"]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/location/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/event description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish event/i })).toBeInTheDocument();
  });

  it('submits form with Authorization header, shows success message, resets fields, and calls onEventCreated', async () => {
    localStorage.setItem('token', 'mock-auth-token');
    const onEventCreated = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Event created successfully!' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CreateEvent onEventCreated={onEventCreated} />);
    fillEventForm();
    fireEvent.click(screen.getByRole('button', { name: /publish event/i }));

    await waitFor(() => {
      expect(screen.getByText('Event created successfully!')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/events',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-auth-token',
        },
        body: JSON.stringify({
          title: 'AI Workshop',
          clubName: 'Tech Club',
          date: '2026-12-15',
          location: 'Room 101',
          description: 'Hands-on session on AI tools.',
        }),
      })
    );

    expect(onEventCreated).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Event Title')).toHaveValue('');
    expect(screen.getByPlaceholderText(/club name/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/location/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/event description/i)).toHaveValue('');
  });

  it('displays API error message when the server returns an error response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'All fields are required' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CreateEvent />);
    fillEventForm();
    fireEvent.click(screen.getByRole('button', { name: /publish event/i }));

    await waitFor(() => {
      expect(screen.getByText('All fields are required')).toBeInTheDocument();
    });
  });

  it('displays network error message when fetch rejects', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchMock);

    render(<CreateEvent />);
    fillEventForm();
    fireEvent.click(screen.getByRole('button', { name: /publish event/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});