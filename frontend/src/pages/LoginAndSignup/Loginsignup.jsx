import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./loginsignup.css";

const Loginsignup = () => {
  const [state, setState] = useState("Login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const changeHandle = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in all required fields.");
      return false;
    }

    if (state === "Sign Up" && !formData.username) {
      setErrorMessage("Please enter a username.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Please enter a valid email address.");
      return false;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const url =
      state === "Login"
        ? "https://collab-space-backend-login-ats.vercel.app/login"
        : "https://collab-space-backend-login-ats.vercel.app/signup";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (responseData.success) {
        // Set auth data
        localStorage.setItem("auth-token", responseData.token);
        localStorage.setItem("username", responseData.username);
        
        // Force a page reload to update all components
        window.location.href = '/';
      } else {
        setErrorMessage(responseData.errors || "Something went wrong.");
      }
    } catch (error) {
      console.error("Login/Signup error:", error);
      setErrorMessage("Server error. Please try again later.");
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const switchState = () => {
    setState(state === "Login" ? "Sign Up" : "Login");
    setErrorMessage("");
    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };

  return (
    <div className="loginsignup">
      <div className="container">
        <h1>{state}</h1>
        
        {errorMessage && (
          <div className="error-message">
            {errorMessage}
          </div>
        )}
        
        <div className="loginsignupfields">
          {state === "Sign Up" && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={changeHandle}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={changeHandle}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={changeHandle}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>
        
        <button 
          className="submit" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? "Processing..." : "Submit"}
        </button>
        
        {state === "Sign Up" ? (
          <p className="signup">
            Already have an account?{" "}
            <span onClick={switchState}>Login here</span>
          </p>
        ) : (
          <p className="signup">
            Create an account?{" "}
            <span onClick={switchState}>Sign up here</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Loginsignup;