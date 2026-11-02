import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const endpoint = isRegistering ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';
    const payload = isRegistering ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegistering) {
        setSuccessMsg('Registration successful! Please log in.');
        setIsRegistering(false);
        setPassword('');
      } else {
        // Save token and user info to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Trigger parent state update to switch to Home
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>
          {isRegistering ? 'Create Account' : 'Campus Club Login'}
        </h2>

        {error && <p style={{ color: 'red', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
        {successMsg && <p style={{ color: 'green', fontSize: '14px', textAlign: 'center' }}>{successMsg}</p>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            type="submit"
            style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ color: '#007bff', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isRegistering ? 'Login here' : 'Register here'}
          </span>
        </p>
      </div>
    </div>
  );
}