import React, { useState } from 'react';

function formatDateInput(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
}

export default function EventList({
  events,
  onRegister,
  messages,
  userRole = 'student',
  onEditEvent,
  onDeleteEvent,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    clubName: '',
    date: '',
    location: '',
    capacity: '',
    description: '',
  });

  if (events.length === 0) {
    return (
      <p role="status" style={{ color: '#495057', fontStyle: 'italic', textAlign: 'center' }}>
        No matching events found.
      </p>
    );
  }

  const startEditing = (event) => {
    setEditingId(event._id);
    setEditForm({
      title: event.title || '',
      clubName: event.clubName || '',
      date: formatDateInput(event.date),
      location: event.location || '',
      capacity: event.capacity ?? 1,
      description: event.description || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleEditChange = (e) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveEdit = async (e, eventId) => {
    e.preventDefault();
    if (!onEditEvent) return;
    await onEditEvent(eventId, {
      ...editForm,
      capacity: Number(editForm.capacity),
    });
    setEditingId(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {events.map((event) => {
        const msg = messages[event._id];
        const hasCapacity = typeof event.capacity === 'number';
        const registeredCount = event.registeredCount ?? 0;
        const spotsLeft = hasCapacity ? Math.max(0, event.capacity - registeredCount) : null;
        const isFull = hasCapacity && spotsLeft === 0;
        const isEditing = editingId === event._id;

        return (
          <article
            key={event._id}
            style={{
              border: '1px solid #ced4da',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff',
              color: '#212529',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            {isEditing ? (
              <form
                onSubmit={(e) => handleSaveEdit(e, event._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelEditing();
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <div>
                  <label htmlFor={`edit-title-${event._id}`} style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Event Title
                  </label>
                  <input
                    id={`edit-title-${event._id}`}
                    type="text"
                    name="title"
                    placeholder="Event Title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #495057' }}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-club-${event._id}`} style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Club Name
                  </label>
                  <input
                    id={`edit-club-${event._id}`}
                    type="text"
                    name="clubName"
                    placeholder="Club Name"
                    value={editForm.clubName}
                    onChange={handleEditChange}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #495057' }}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-date-${event._id}`} style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Date
                  </label>
                  <input
                    id={`edit-date-${event._id}`}
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditChange}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #495057' }}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-location-${event._id}`} style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Location
                  </label>
                  <input
                    id={`edit-location-${event._id}`}
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #495057' }}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-capacity-${event._id}`} style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Seat Capacity
                  </label>
                  <input
                    id={`edit-capacity-${event._id}`}
                    type="number"
                    name="capacity"
                    placeholder="Seat Capacity"
                    min={Math.max(1, registeredCount)}
                    value={editForm.capacity}
                    onChange={handleEditChange}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #495057' }}
                  />
                </div>
                <div>
                  <label htmlFor={`edit-description-${event._id}`} style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Event Description
                  </label>
                  <textarea
                    id={`edit-description-${event._id}`}
                    name="description"
                    placeholder="Event Description"
                    rows="3"
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '4px', border: '1px solid #495057' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      backgroundColor: '#0056b3',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    style={{
                      flex: 1,
                      backgroundColor: '#5a6268',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h3 style={{ marginTop: '0', color: '#0056b3' }}>{event.title}</h3>
                <p><strong>Club:</strong> {event.clubName}</p>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {event.location}</p>
                {hasCapacity && (
                  <p style={{ color: isFull ? '#b02a37' : '#212529' }}>
                    <strong>Seats:</strong>{' '}
                    {isFull
                      ? `Full (${registeredCount}/${event.capacity})`
                      : `${spotsLeft} of ${event.capacity} spots left`}
                  </p>
                )}
                <p style={{ color: '#343a40' }}>{event.description}</p>

                {userRole !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => onRegister(event._id)}
                    disabled={isFull}
                    style={{
                      backgroundColor: isFull ? '#5a6268' : '#1e7e34',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '4px',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      width: '100%',
                      marginTop: '10px',
                      opacity: isFull ? 0.85 : 1,
                    }}
                  >
                    {isFull ? 'Event Full' : 'Register Now'}
                  </button>
                )}

                {userRole === 'admin' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => startEditing(event)}
                      style={{
                        flex: 1,
                        backgroundColor: '#e0a800',
                        color: '#212529',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEvent && onDeleteEvent(event._id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#c82333',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}

            {msg && (
              <p
                role={msg.type === 'error' ? 'alert' : 'status'}
                aria-live="polite"
                style={{
                  textAlign: 'center',
                  marginTop: '10px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: msg.type === 'success' ? '#1e6b34' : '#b02a37',
                }}
              >
                {msg.text}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}