import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './Home';

vi.mock('../config', () => ({
  API_URL: 'http://localhost:5000',
}));

vi.mock('./EventList', () => ({
  default: ({ events, onRegister, messages, userRole, onEditEvent, onDeleteEvent }) => (
    <div>
      <span>EventList Count: {events.length}</span>
      <span>Role: {userRole}</span>
      {events.map((evt) => (
        <div key={evt._id}>
          <span>{evt.title}</span>
          {typeof evt.capacity === 'number' && (
            <span>
              Seats: {evt.registeredCount ?? 0}/{evt.capacity}
            </span>
          )}
          <button type="button" onClick={() => onRegister(evt._id)}>
            Register {evt.title}
          </button>
          {userRole === 'admin' && (
            <>
              <button
                type="button"
                onClick={() =>
                  onEditEvent &&
                  onEditEvent(evt._id, {
                    title: `${evt.title} Edited`,
                    clubName: evt.clubName,
                    date: '2026-12-20',
                    location: 'Updated Hall',
                    capacity: (evt.capacity ?? 2) + 5,
                    description: 'Updated event description.',
                  })
                }
              >
                Edit {evt.title}
              </button>
              <button type="button" onClick={() => onDeleteEvent && onDeleteEvent(evt._id)}>
                Delete {evt.title}
              </button>
            </>
          )}
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
  { _id: 'evt-1', title: 'Hackathon Kickoff', clubName: 'CS Society', capacity: 2, registeredCount: 0 },
  { _id: 'evt-2', title: 'Chess Tournament', clubName: 'Board Games Club', capacity: 4, registeredCount: 1 },
];

describe('Home component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('displays welcome user name from localStorage, fetches events, and supports search filtering', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Basima', role: 'student' }));

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

  it('hides Create Event tab for non-admin users', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Basima', role: 'student' }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockEvents,
      })
    );

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 2')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /\+ create event/i })).not.toBeInTheDocument();
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

  it('handles event registration, shows success feedback, and refreshes event seat counts', async () => {
    localStorage.setItem('token', 'test-token');

    const updatedEvents = [
      { ...mockEvents[0], registeredCount: 1 },
      mockEvents[1],
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Successfully registered!' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedEvents,
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /register hackathon kickoff/i }));

    await waitFor(() => {
      expect(screen.getByText('Successfully Registered!')).toBeInTheDocument();
      expect(screen.getByText('Seats: 1/2')).toBeInTheDocument();
    });
  });

  it('shows error feedback and refreshes events when registration fails due to full capacity', async () => {
    localStorage.setItem('token', 'test-token');

    const fullEvents = [
      { ...mockEvents[0], capacity: 1, registeredCount: 1 },
      mockEvents[1],
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fullEvents,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Event is full! No seats available.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => fullEvents,
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /register hackathon kickoff/i }));

    await waitFor(() => {
      expect(screen.getByText('Event is full! No seats available.')).toBeInTheDocument();
    });
  });

  it('cancels a registration in My Registrations and refreshes event seat counts', async () => {
    localStorage.setItem('token', 'test-token');

    const initialEvents = [{ ...mockEvents[0], capacity: 1, registeredCount: 1 }];
    const reopenedEvents = [{ ...mockEvents[0], capacity: 1, registeredCount: 0 }];
    const mockRegs = [
      { _id: 'reg-1', event: { _id: 'evt-1', title: 'Hackathon Kickoff' } },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRegs,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Successfully canceled registration' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => reopenedEvents,
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Seats: 1/1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /my registrations/i }));

    await waitFor(() => {
      expect(screen.getByText('MyRegistrations Count: 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /unregister hackathon kickoff/i }));

    await waitFor(() => {
      expect(screen.getByText('MyRegistrations Count: 0')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /all events/i }));

    await waitFor(() => {
      expect(screen.getByText('Seats: 0/1')).toBeInTheDocument();
    });
  });

  it('allows admin to edit an event via PUT, shows success message, and refreshes events', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Basima', role: 'admin' }));
    localStorage.setItem('token', 'admin-token');

    const editedEvents = [
      { ...mockEvents[0], title: 'Hackathon Kickoff Edited', capacity: 7, registeredCount: 0 },
      mockEvents[1],
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Event updated successfully!' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => editedEvents,
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /edit hackathon kickoff/i }));

    await waitFor(() => {
      expect(screen.getByText('Event updated successfully!')).toBeInTheDocument();
      expect(screen.getByText('Hackathon Kickoff Edited')).toBeInTheDocument();
      expect(screen.getByText('Seats: 0/7')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/events/evt-1',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
      })
    );
  });

  it('allows admin to delete an event via DELETE and removes it from the list', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Basima', role: 'admin' }));
    localStorage.setItem('token', 'admin-token');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Event deleted successfully!' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    render(<Home onLogout={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /delete hackathon kickoff/i }));

    await waitFor(() => {
      expect(screen.getByText('EventList Count: 1')).toBeInTheDocument();
      expect(screen.queryByText('Hackathon Kickoff')).not.toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/events/evt-1',
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer admin-token' },
      })
    );
  });

  it('switches to Create Event tab and returns to Events tab on creation for admin users', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Basima', role: 'admin' }));

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