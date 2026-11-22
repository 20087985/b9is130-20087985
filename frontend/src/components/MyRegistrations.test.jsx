import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyRegistrations from './MyRegistrations';

const sampleRegistrations = [
  {
    _id: 'reg-1',
    event: {
      _id: 'evt-1',
      title: 'Hackathon Kickoff',
      clubName: 'Computer Science Society',
      date: '2026-12-10T18:00:00.000Z',
      location: 'Main Hall',
      description: 'Annual campus hackathon briefing.',
    },
  },
  {
    _id: 'reg-2',
    event: {
      _id: 'evt-2',
      title: 'Photography Walk',
      clubName: 'Photo Club',
      date: '2026-12-15T10:00:00.000Z',
      location: 'Campus Courtyard',
      description: 'Morning street and nature photography.',
    },
  },
];

describe('MyRegistrations component', () => {
  it('renders a message when registrations array is empty', () => {
    render(<MyRegistrations registrations={[]} onUnregister={vi.fn()} />);

    expect(
      screen.getByText("You haven't registered for any events yet.")
    ).toBeInTheDocument();
  });

  it('renders registered event cards with badge, details, and Cancel RSVP buttons', () => {
    render(
      <MyRegistrations registrations={sampleRegistrations} onUnregister={vi.fn()} />
    );

    const badges = screen.getAllByText(/registered ✓/i);
    expect(badges).toHaveLength(2);

    expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    expect(screen.getByText('Computer Science Society')).toBeInTheDocument();
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('Annual campus hackathon briefing.')).toBeInTheDocument();

    expect(screen.getByText('Photography Walk')).toBeInTheDocument();
    expect(screen.getByText('Photo Club')).toBeInTheDocument();
    expect(screen.getByText('Campus Courtyard')).toBeInTheDocument();
    expect(screen.getByText('Morning street and nature photography.')).toBeInTheDocument();

    const cancelButtons = screen.getAllByRole('button', { name: /cancel rsvp/i });
    expect(cancelButtons).toHaveLength(2);
  });

  it('calls onUnregister with the event _id when Cancel RSVP is clicked', () => {
    const onUnregister = vi.fn();
    render(
      <MyRegistrations registrations={sampleRegistrations} onUnregister={onUnregister} />
    );

    const cancelButtons = screen.getAllByRole('button', { name: /cancel rsvp/i });
    fireEvent.click(cancelButtons[0]);

    expect(onUnregister).toHaveBeenCalledTimes(1);
    expect(onUnregister).toHaveBeenCalledWith('evt-1');
  });

  it('safely skips registrations where event is null or undefined', () => {
    const regsWithMissingEvent = [
      { _id: 'reg-null', event: null },
      sampleRegistrations[0],
    ];

    render(
      <MyRegistrations registrations={regsWithMissingEvent} onUnregister={vi.fn()} />
    );

    expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /cancel rsvp/i })).toHaveLength(1);
  });
});