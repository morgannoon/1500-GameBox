import { useState, useEffect } from "react";
import "../styles/SignIn.css";
import { Link, useNavigate } from "react-router-dom";

// Note: If you were using axios, you would import it here, but since you are using fetch, we don't need it.

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // display login errors
  const navigate = useNavigate();

  // --- Check if user is already logged in on mount ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Ensure you use http://localhost:5000/api
        const response = await fetch("http://localhost:5000/api/check-auth", {
          method: "GET",
          credentials: "include", // CRITICAL: Sends session cookie
        });

        if (response.ok) {
          // User is authenticated, redirect to home
          navigate("/home");
        }
        // if not authenticated, do nothing, let them see login page
      } catch (err) {
        console.error("Error checking authentication:", err);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Ensure you use http://localhost:5000/api
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        credentials: "include", // CRITICAL: This is the required fix for cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Status 200: Login successful
        console.log("Login successful:", data);
        navigate("/home");
      } else if (response.status === 401) {
        // Status 401: Invalid credentials
        console.log("Login failed:", data.error);
        setError(data.error || "Invalid email or password");
      } else {
        // Catch any other server errors (like 500)
        console.log("Login failed with server error:", data);
        setError(data.error || "Server error. Please try again.");
      }
    } catch (err) {
      console.error("Error connecting to server:", err);
      setError("Could not connect to the API server.");
    }
  };

  return (
    <div className="signin-page">
      <div className="background-overlay"></div>

      <div className="signin-card">
        <h1 className="signin-title">🎮 GameBox Login</h1>
        <p className="signin-subtitle">
          Sign in to access your library and store deals
        </p>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="signin-button">
            Sign In
          </button>
        </form>

        <div className="divider">
          <div className="line"></div>
          <span>or</span>
          <div className="line"></div>
        </div>

        <p className="signup-link">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default SignIn;