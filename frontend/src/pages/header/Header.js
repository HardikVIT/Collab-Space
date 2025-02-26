// pages/header/Header.js
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Header.css';

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check auth status whenever the component mounts or updates
    const token = localStorage.getItem('auth-token');
    setIsLoggedIn(!!token);

    // Setup an interval to check auth status periodically
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('auth-token');
      setIsLoggedIn(!!currentToken);
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const handleLogout = (e) => {
    e.preventDefault(); // Prevent default link behavior
    localStorage.clear(); // Clear all localStorage
    setIsLoggedIn(false);
    navigate('/login');
    window.location.reload(); // Force a page refresh
  };

  return (
    <header className="header">
      <div className="logo">CollabSpace</div>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        {isLoggedIn ? (
          <a href="#" onClick={handleLogout}>Logout</a>
        ) : (
          <Link to="/login">Login/Register</Link>
        )}
        <Link to="/whiteboard">Whiteboard</Link>
        <Link to="/chatroom">Chatroom</Link>
        <Link to="/chatbot">Mock Interview</Link>
        <Link to="/aboutus">About us</Link>
      </nav>
    </header>
  );
}

export default Header;