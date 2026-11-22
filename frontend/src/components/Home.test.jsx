import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';

vi.mock('../config', () => ({
  API_URL: 'http://localhost:5000',
}));

vi.mock('./EventList', () => ({
  default: ({ events, onRegister, messages }) => (
    <div>
      <span>EventList Count: {events.length}</span>
      {events.map((evt) => (
        <div key={evt._id}>
          <span>{evt.title}</span>
          <button type="button" onClick={() => onRegister(evt._id)}>
            Register {evt.title}
          </button>
          {messages[evt._id] && <span>{messages[evt._id].text}</span>}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./MyRegistrations', () => ({
  default: ({ registrations, onUnregister }) => (
    <div>
      <span>MyRegistrations Count: {registrations.length}</span>
      {registrations.map((reg) => (
        <div key={reg._id}>
          <span>{reg.event.title}</span>
          <button type="button" onClick={() => onUnregister(reg.event._id)}>
            Unregister {reg.event.title}
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./CreateEvent', () => ({
  default: ({ onEventCreated }) => (
    <div>
      <span>Mock CreateEvent</span>
      <button type="button" onClick={onEventCreated}>
        Simulate Event Created
      </button>
    </div>
  ),
}));

const mockEvents = [
  { _id: 'evt-1', title: 'Hackathon Kickoff', clubName: 'CS Society' },
  { _id: 'evt-2', title: 'Chess Tournament', clubName: 'Board Games Club' },
];

describe('Home component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('displays welcome user name from localStorage, fetches events, and supports search filtering', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Basima' }));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEvents,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    expect(screen.getByText(/basima/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 2')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search events by title or club/i);
    fireEvent.change(searchInput, { target: { value: 'Chess' } });

    expect(screen.getByText('EventList Count: 1')).toBeInTheDocument();
    expect(screen.getByText('Chess Tournament')).toBeInTheDocument();
    expect(screen.queryByText('Hackathon Kickoff')).not.toBeInTheDocument();
  });

  it('calls onLogout when Logout button is clicked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    );

    const onLogout = vi.fn();
    render(<Home onLogout={onLogout} />);

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('switches to My Registrations tab and fetches user registrations', async () => {
    localStorage.setItem('token', 'test-token');

    const mockRegs = [
      { _id: 'reg-1', event: { _id: 'evt-1', title: 'Hackathon Kickoff' } },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegs,
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /my registrations/i }));

    await waitFor(() => {
      expect(screen.getByText('MyRegistrations Count: 1')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:5000/api/registrations/my-registrations',
      expect.objectContaining({
        headers: { Authorization: 'Bearer test-token' },
      })
    );
  });

  it('handles event registration and shows success feedback', async () => {
    localStorage.setItem('token', 'test-token');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Successfully registered!' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /register hackathon kickoff/i }));

    await waitFor(() => {
      expect(screen.getByText('Successfully Registered!')).toBeInTheDocument();
    });
  });

  it('switches to Create Event tab and returns to Events tab on creation', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockEvents,
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /\+ create event/i }));
    expect(screen.getByText('Mock CreateEvent')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /simulate event created/i }));

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 2')).toBeInTheDocument();
    });
  });

  it('shows error message when fetching events fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      })
    );

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load events.')).toBeInTheDocument();
    });
  });
});