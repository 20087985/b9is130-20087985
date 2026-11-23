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
    return <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center' }}>No matching events found.</p>;
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
          <div
            key={event._id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
          >
            {isEditing ? (
              <form onSubmit={(e) => handleSaveEdit(e, event._id)} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  name="title"
                  placeholder="Event Title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="text"
                  name="clubName"
                  placeholder="Club Name"
                  value={editForm.clubName}
                  onChange={handleEditChange}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="date"
                  name="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={editForm.location}
                  onChange={handleEditChange}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="number"
                  name="capacity"
                  placeholder="Seat Capacity"
                  min={Math.max(1, registeredCount)}
                  value={editForm.capacity}
                  onChange={handleEditChange}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <textarea
                  name="description"
                  placeholder="Event Description"
                  rows="3"
                  value={editForm.description}
                  onChange={handleEditChange}
                  required
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      backgroundColor: '#007bff',
                      color: 'white',
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
                      backgroundColor: '#6c757d',
                      color: 'white',
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
                <h3 style={{ marginTop: '0', color: '#007bff' }}>{event.title}</h3>
                <p><strong>Club:</strong> {event.clubName}</p>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {event.location}</p>
                {hasCapacity && (
                  <p style={{ color: isFull ? '#dc3545' : '#333' }}>
                    <strong>Seats:</strong>{' '}
                    {isFull
                      ? `Full (${registeredCount}/${event.capacity})`
                      : `${spotsLeft} of ${event.capacity} spots left`}
                  </p>
                )}
                <p style={{ color: '#555' }}>{event.description}</p>

                <button
                  onClick={() => onRegister(event._id)}
                  disabled={isFull}
                  style={{
                    backgroundColor: isFull ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '4px',
                    cursor: isFull ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    width: '100%',
                    marginTop: '10px',
                    opacity: isFull ? 0.75 : 1,
                  }}
                >
                  {isFull ? 'Event Full' : 'Register Now'}
                </button>

                {userRole === 'admin' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => startEditing(event)}
                      style={{
                        flex: 1,
                        backgroundColor: '#ffc107',
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
                        backgroundColor: '#dc3545',
                        color: 'white',
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
              <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: msg.type === 'success' ? 'green' : 'red' }}>
                {msg.text}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}