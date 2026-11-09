import React from 'react';

export default function EventList({ events, onRegister, messages }) {
  if (events.length === 0) {
    return <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center' }}>No matching events found.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {events.map((event) => {
        const msg = messages[event._id];
        return (
          <div key={event._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: '0', color: '#007bff' }}>{event.title}</h3>
            <p><strong>Club:</strong> {event.clubName}</p>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p style={{ color: '#555' }}>{event.description}</p>
            
            <button
              onClick={() => onRegister(event._id)}
              style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '10px' }}
            >
              Register Now
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