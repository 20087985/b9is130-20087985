import React from 'react';

export default function MyRegistrations({ registrations }) {
  if (registrations.length === 0) {
    return <p style={{ color: '#777', fontStyle: 'italic', textAlign: 'center' }}>You haven't registered for any events yet.</p>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
      {registrations.map((reg) => {
        const event = reg.event;
        if (!event) return null;
        return (
          <div key={reg._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#e9f7ef', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ backgroundColor: '#28a745', color: '#fff', padding: '2px 8px', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold' }}>Registered ✓</span>
            <h3 style={{ marginTop: '10px', color: '#28a745' }}>{event.title}</h3>
            <p><strong>Club:</strong> {event.clubName}</p>
            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p style={{ color: '#555' }}>{event.description}</p>
          </div>
        );
      })}
    </div>
  );
}