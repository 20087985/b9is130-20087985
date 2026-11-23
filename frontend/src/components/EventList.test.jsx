import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventList from './EventList';

const sampleEvents = [
  {
    _id: 'evt-1',
    title: 'Hackathon Kickoff',
    clubName: 'Computer Science Society',
    date: '2026-12-10T18:00:00.000Z',
    location: 'Main Hall',
    capacity: 20,
    registeredCount: 5,
    description: 'Annual campus hackathon briefing.',
  },
  {
    _id: 'evt-2',
    title: 'Photography Walk',
    clubName: 'Photo Club',
    date: '2026-12-15T10:00:00.000Z',
    location: 'Campus Courtyard',
    capacity: 10,
    registeredCount: 3,
    description: 'Morning street and nature photography.',
  },
];

describe('EventList component', () => {
  it('renders a helpful empty message when events array is empty', () => {
    render(<EventList events={[]} onRegister={vi.fn()} messages={{}} />);

    expect(screen.getByText('No matching events found.')).toBeInTheDocument();
  });

  it('renders event cards with title, club, date, location, seats left, description, and Register Now button', () => {
    render(<EventList events={sampleEvents} onRegister={vi.fn()} messages={{}} />);

    expect(screen.getByText('Hackathon Kickoff')).toBeInTheDocument();
    expect(screen.getByText('Computer Science Society')).toBeInTheDocument();
    expect(screen.getByText('Main Hall')).toBeInTheDocument();
    expect(screen.getByText('15 of 20 spots left')).toBeInTheDocument();
    expect(screen.getByText('Annual campus hackathon briefing.')).toBeInTheDocument();

    expect(screen.getByText('Photography Walk')).toBeInTheDocument();
    expect(screen.getByText('Photo Club')).toBeInTheDocument();
    expect(screen.getByText('Campus Courtyard')).toBeInTheDocument();
    expect(screen.getByText('7 of 10 spots left')).toBeInTheDocument();
    expect(screen.getByText('Morning street and nature photography.')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: /register now/i });
    expect(buttons).toHaveLength(2);
    buttons.forEach((btn) => expect(btn).not.toBeDisabled());
  });

  it('calls onRegister with the specific event _id when Register Now is clicked', () => {
    const onRegister = vi.fn();
    render(<EventList events={sampleEvents} onRegister={onRegister} messages={{}} />);

    const buttons = screen.getAllByRole('button', { name: /register now/i });
    fireEvent.click(buttons[1]);

    expect(onRegister).toHaveBeenCalledTimes(1);
    expect(onRegister).toHaveBeenCalledWith('evt-2');
  });

  it('displays full status and disables the button when an event reaches capacity', () => {
    const onRegister = vi.fn();
    const eventsWithFull = [
      sampleEvents[0],
      {
        ...sampleEvents[1],
        capacity: 2,
        registeredCount: 2,
      },
    ];

    render(<EventList events={eventsWithFull} onRegister={onRegister} messages={{}} />);

    expect(screen.getByText('Full (2/2)')).toBeInTheDocument();
    const fullButton = screen.getByRole('button', { name: /event full/i });
    expect(fullButton).toBeDisabled();

    fireEvent.click(fullButton);
    expect(onRegister).not.toHaveBeenCalled();
  });

  it('displays per-event feedback messages for matching event _id keys', () => {
    const messages = {
      'evt-1': { text: 'Successfully registered!', type: 'success' },
      'evt-2': { text: 'You are already registered for this event!', type: 'error' },
    };

    render(<EventList events={sampleEvents} onRegister={vi.fn()} messages={messages} />);

    const successMsg = screen.getByText('Successfully registered!');
    const errorMsg = screen.getByText('You are already registered for this event!');

    expect(successMsg).toBeInTheDocument();
    expect(errorMsg).toBeInTheDocument();
  });
});