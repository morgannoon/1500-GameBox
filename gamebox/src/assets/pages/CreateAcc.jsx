import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CreateAcc.css";

function CreateAcc() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(""); // For server or validation errors

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5001/api/register", {
        method: "POST",
        credentials: "include", // CRITICAL: This sends the session cookie after registration
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Status 201: Registration successful
        console.log("Registration successful:", data);
        alert(`Account created for ${data.username}! Please sign in.`);
        // Redirect to sign-in page after successful registration
        navigate("/signin");
      } else {
        // Handle server errors (400, 409, 500)
        console.log("Registration failed:", data);
        // Display the specific error message from the server (e.g., "Email already exists")
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Error connecting to server:", err);
      setError("Could not connect to the API server.");
    }
  };

  return (
    <div className="create-page">
      <div className="background-overlay"></div>

      <div className="create-card">
        <h1 className="create-title">Create Your GameBox Account</h1>
        <p className="create-subtitle">
          Join and start exploring exclusive deals and your game library
        </p>

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="firstname_lastname (e.g., Jane_Doe)"
            />
          </div>

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

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="create-button">
            Create Account
          </button>
        </form>

        <div className="divider">
          <div className="line"></div>
          <span>or</span>
          <div className="line"></div>
        </div>

        <p className="signin-link">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default CreateAcc;