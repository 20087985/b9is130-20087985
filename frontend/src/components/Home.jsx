import React, { useState, useEffect } from 'react';

export default function Home({ onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState({}); 

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.name) {
      setUserName(user.name);
    }

    fetch('http://localhost:5000/api/events')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please make sure the backend server is running.');
        setLoading(false);
      });
  }, []);

 
  const handleRegister = async (eventId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/registrations/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setMessage((prev) => ({ ...prev, [eventId]: { text: 'Successfully Registered!', type: 'success' } }));
    } catch (err) {
      setMessage((prev) => ({ ...prev, [eventId]: { text: err.message, type: 'error' } }));
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Bar with Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '16px', color: '#555' }}>
          Welcome, <strong>{userName || 'Student'}</strong>!
        </span>
        <button
          onClick={onLogout}
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Logout
        </button>
      </div>

      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginBottom: '40px', backgroundColor: '#f8f9fa', padding: '40px', borderRadius: '8px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '36px', lineHeight: '1.3' }}>
          Campus Club Event RSVP & Attendance Manager
        </h1>
        <p style={{ color: '#666', fontSize: '18px' }}>
          Discover exciting student society events, register instantly, and track your attendance!
        </p>
      </header>

    
      <section>
        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
          Upcoming Campus Events
        </h2>

        {loading && <p>Loading events from database...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p style={{ color: '#777', fontStyle: 'italic' }}>No upcoming events found in the database.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {events.map((event) => (
              <div key={event._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', backgroundColor: '#fff' }}>
                <h3 style={{ marginTop: '0', color: '#007bff' }}>{event.title}</h3>
                <p><strong>Club:</strong> {event.clubName}</p>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p style={{ color: '#555' }}>{event.description}</p>
                
                <button 
                  onClick={() => handleRegister(event._id)}
                  style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '10px' }}
                >
                  Register Now
                </button>

                {message[event._id] && (
                  <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: message[event._id].type === 'success' ? 'green' : 'red' }}>
                    {message[event._id].text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}