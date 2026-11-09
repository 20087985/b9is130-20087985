import React, { useState, useEffect } from 'react';
import EventList from './EventList';
import MyRegistrations from './MyRegistrations';
import CreateEvent from './CreateEvent';

export default function Home({ onLogout }) {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState('events'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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
    } else if (tab === 'registrations') {
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

  const handleUnregister = async (eventId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/registrations/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel registration');

      setMyRegistrations((prev) => prev.filter((reg) => reg.event._id !== eventId));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  
  const filteredEvents = events.filter((event) => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.clubName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Bar */}
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

      {/* Hero Header & Navigation Tabs */}
      <header style={{ textAlign: 'center', marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '30px', borderRadius: '8px' }}>
        <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '32px' }}>
          Campus Club Event RSVP & Attendance Manager
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Discover exciting student society events, register instantly, and track your attendance!
        </p>

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
          <button
            onClick={() => handleTabSwitch('create')}
            style={{ padding: '10px 20px', backgroundColor: activeTab === 'create' ? '#28a745' : '#e0e0e0', color: activeTab === 'create' ? '#fff' : '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Create Event
          </button>
        </div>
      </header>

      {/* Main Display Area */}
      <section>
        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
          {activeTab === 'events' && 'Upcoming Campus Events'}
          {activeTab === 'registrations' && 'Events You Are Registered For'}
          {activeTab === 'create' && 'Create a New Event'}
        </h2>

        {/* Search Bar (Only shown on 'events' tab) */}
        {activeTab === 'events' && (
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            <input
              type="text"
              placeholder="Search events by title or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                maxWidth: '500px', 
                padding: '12px 15px', 
                borderRadius: '6px', 
                border: '1px solid #ccc', 
                fontSize: '15px',
                outline: 'none',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
              }}
            />
          </div>
        )}

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {!loading && !error && activeTab === 'events' && (
          <EventList events={filteredEvents} onRegister={handleRegister} messages={message} />
        )}

        {!loading && !error && activeTab === 'registrations' && (
          <MyRegistrations registrations={myRegistrations} onUnregister={handleUnregister} />
        )}

        {!loading && !error && activeTab === 'create' && (
          <CreateEvent onEventCreated={() => handleTabSwitch('events')} />
        )}
      </section>
    </div>
  );
}