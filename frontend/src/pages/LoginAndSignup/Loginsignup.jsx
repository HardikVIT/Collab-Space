/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation after login
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
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage("");

    const url =
      state === "Login"
        ? "http://localhost:10000/login"
        : "http://localhost:10000/signup";

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
        localStorage.setItem("auth-token", responseData.token);
        localStorage.setItem("username", responseData.username); // Store username
        navigate("/"); // Redirect to home page
      } else {
        setErrorMessage(responseData.errors || "Something went wrong.");
      }
    } catch (error) {
      setErrorMessage("Server error. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="loginsignup">
      <div className="container">
        <h1>{state}</h1>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="loginsignupfields">
          {state === "Sign Up" && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={changeHandle}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={changeHandle}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={changeHandle}
          />
        </div>
        <button className="submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : "Submit"}
        </button>
        {state === "Sign Up" ? (
          <p className="signup">
            Already have an account?{" "}
            <span onClick={() => setState("Login")}>Login here</span>
          </p>
        ) : (
          <p className="signup">
            Create an account?{" "}
            <span onClick={() => setState("Sign Up")}>Sign up here</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Loginsignup;*/
// Loginsignup.js
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
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage("");

    const url =
      state === "Login"
        ? "http://localhost:10000/login"
        : "http://localhost:10000/signup";

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
      setErrorMessage("Server error. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <div className="loginsignup">
      <div className="container">
        <h1>{state}</h1>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <div className="loginsignupfields">
          {state === "Sign Up" && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={changeHandle}
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={changeHandle}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={changeHandle}
          />
        </div>
        <button className="submit" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processing..." : "Submit"}
        </button>
        {state === "Sign Up" ? (
          <p className="signup">
            Already have an account?{" "}
            <span onClick={() => setState("Login")}>Login here</span>
          </p>
        ) : (
          <p className="signup">
            Create an account?{" "}
            <span onClick={() => setState("Sign Up")}>Sign up here</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Loginsignup;