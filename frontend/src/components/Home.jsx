import React, { useState, useEffect } from 'react';

export default function Home({ onLogout }) {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'registrations'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.name) {
      setUserName(user.name);
    }

    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load events.');
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/registrations/my-registrations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch registrations');
      const data = await res.json();
      setMyRegistrations(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load your registrations.');
      setLoading(false);
    }
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'events') {
      fetchEvents();
    } else {
      fetchMyRegistrations();
    }
  };

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
      if (!res.ok) throw new Error(data.error || 'Failed to register');

      setMessage((prev) => ({ ...prev, [eventId]: { text: 'Successfully Registered!', type: 'success' } }));
    } catch (err) {
      setMessage((prev) => ({ ...prev, [eventId]: { text: err.message, type: 'error' } }));
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Bar with Logout & Welcome */}
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
      <header style={{ textAlign: 'center', marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '32px' }}>
          Campus Club Event RSVP & Attendance Manager
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Discover exciting student society events, register instantly, and track your attendance!
        </p>

        {/* Navigation Tabs */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button
            onClick={() => handleTabSwitch('events')}
            style={{ padding: '10px 20px', backgroundColor: activeTab === 'events' ? '#007bff' : '#e0e0e0', color: activeTab === 'events' ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            All Events
          </button>
          <button
            onClick={() => handleTabSwitch('registrations')}
            style={{ padding: '10px 20px', backgroundColor: activeTab === 'registrations' ? '#007bff' : '#e0e0e0', color: activeTab === 'registrations' ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            My Registrations
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <section>
        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
          {activeTab === 'events' ? 'Upcoming Campus Events' : 'Events You Are Registered For'}
        </h2>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Tab 1: All Events */}
        {!loading && !error && activeTab === 'events' && events.length === 0 && (
          <p style={{ color: '#777', fontStyle: 'italic' }}>No upcoming events found.</p>
        )}

        {!loading && !error && activeTab === 'events' && events.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {events.map((event) => (
              <div key={event._id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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

        {/* Tab 2: My Registrations */}
        {!loading && !error && activeTab === 'registrations' && myRegistrations.length === 0 && (
          <p style={{ color: '#777', fontStyle: 'italic' }}>You haven't registered for any events yet.</p>
        )}

        {!loading && !error && activeTab === 'registrations' && myRegistrations.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {myRegistrations.map((reg) => {
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
        )}
      </section>
    </div>
  );
}