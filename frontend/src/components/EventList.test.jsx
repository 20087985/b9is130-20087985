import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  it('hides Edit and Delete buttons for non-admin users', () => {
    render(
      <EventList
        events={sampleEvents}
        onRegister={vi.fn()}
        messages={{}}
        userRole="student"
        onEditEvent={vi.fn()}
        onDeleteEvent={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
  });

  it('shows Edit and Delete buttons for admin users and calls onDeleteEvent when Delete is clicked', () => {
    const onDeleteEvent = vi.fn();
    render(
      <EventList
        events={sampleEvents}
        onRegister={vi.fn()}
        messages={{}}
        userRole="admin"
        onEditEvent={vi.fn()}
        onDeleteEvent={onDeleteEvent}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(onDeleteEvent).toHaveBeenCalledTimes(1);
    expect(onDeleteEvent).toHaveBeenCalledWith('evt-1');
  });

  it('opens inline edit form, saves changes via onEditEvent, and closes the form', async () => {
    const onEditEvent = vi.fn().mockResolvedValue(undefined);
    render(
      <EventList
        events={sampleEvents}
        onRegister={vi.fn()}
        messages={{}}
        userRole="admin"
        onEditEvent={onEditEvent}
        onDeleteEvent={vi.fn()}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    fireEvent.click(editButtons[0]);

    const titleInput = screen.getByPlaceholderText('Event Title');
    const capacityInput = screen.getByPlaceholderText('Seat Capacity');
    expect(titleInput).toHaveValue('Hackathon Kickoff');
    expect(capacityInput).toHaveValue(20);

    fireEvent.change(titleInput, { target: { name: 'title', value: 'Hackathon Kickoff v2' } });
    fireEvent.change(capacityInput, { target: { name: 'capacity', value: '30' } });

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(onEditEvent).toHaveBeenCalledTimes(1);
      expect(onEditEvent).toHaveBeenCalledWith('evt-1', {
        title: 'Hackathon Kickoff v2',
        clubName: 'Computer Science Society',
        date: '2026-12-10',
        location: 'Main Hall',
        capacity: 30,
        description: 'Annual campus hackathon briefing.',
      });
      expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    });
  });

  it('closes inline edit form when Cancel is clicked without calling onEditEvent', () => {
    const onEditEvent = vi.fn();
    render(
      <EventList
        events={sampleEvents}
        onRegister={vi.fn()}
        messages={{}}
        userRole="admin"
        onEditEvent={onEditEvent}
        onDeleteEvent={vi.fn()}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /^edit$/i });
    fireEvent.click(editButtons[0]);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    expect(onEditEvent).not.toHaveBeenCalled();
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