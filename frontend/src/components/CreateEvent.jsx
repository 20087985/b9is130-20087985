import React, { useState } from 'react';

export default function CreateEvent({ onEventCreated }) {
  const [eventForm, setEventForm] = useState({
    title: '',
    clubName: '',
    date: '',
    location: '',
    description: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleInputChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create event');

      setMessage({ text: 'Event created successfully!', type: 'success' });
      setEventForm({ title: '', clubName: '', date: '', location: '', description: '' });
      if (onEventCreated) onEventCreated(); 
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ marginTop: '0', color: '#333', marginBottom: '20px' }}>Post a New Campus Event</h3>
      
      <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          name="title"
          placeholder="Event Title"
          value={eventForm.title}
          onChange={handleInputChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          name="clubName"
          placeholder="Club Name (e.g., CodeChef MACE)"
          value={eventForm.clubName}
          onChange={handleInputChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="date"
          name="date"
          value={eventForm.date}
          onChange={handleInputChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <input
          type="text"
          name="location"
          placeholder="Location (e.g., Auditorium Hall A)"
          value={eventForm.location}
          onChange={handleInputChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <textarea
          name="description"
          placeholder="Event Description..."
          rows="4"
          value={eventForm.description}
          onChange={handleInputChange}
          required
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        
        <button
          type="submit"
          style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Publish Event
        </button>

        {message.text && (
          <p style={{ textAlign: 'center', color: message.type === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>
            {message.text}
          </p>
        )}
      </form>
    </div>
  );
}