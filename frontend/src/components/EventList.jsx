import React from 'react';

export default function EventList({ events, onRegister, messages }) {
  if (events.length === 0) {
    return <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center' }}>No matching events found.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {events.map((event) => {
        const msg = messages[event._id];
        const hasCapacity = typeof event.capacity === 'number';
        const registeredCount = event.registeredCount ?? 0;
        const spotsLeft = hasCapacity ? Math.max(0, event.capacity - registeredCount) : null;
        const isFull = hasCapacity && spotsLeft === 0;

        return (
          <div key={event._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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
                opacity: isFull ? 0.75 : 1
              }}
            >
              {isFull ? 'Event Full' : 'Register Now'}
            </button>

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