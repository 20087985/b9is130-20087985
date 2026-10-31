import React from 'react';

export default function Home() {
  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginBottom: '40px', backgroundColor: '#f8f9fa', padding: '40px', borderRadius: '8px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '36px', lineHeight: '1.3' }}>
          Campus Club Event RSVP & Attendance Manager
        </h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Discover exciting student society events, RSVP instantly, and track your attendance!
        </p>
      </header>

      {/* Events Section */}
      <section>
        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
          Upcoming Campus Events
        </h2>
        <div style={{ color: '#777', fontStyle: 'italic' }}>
          Events list structure goes here.
        </div>
      </section>
    </div>
  );
}