import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/CreateAcc.css";

function CreateAcc() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    console.log("Account created:", { username, email, password });
    navigate("/home"); // Navigate to Home page after creation
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
              placeholder="Your gamer tag"
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
          Already have an account?{" "}
          <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default CreateAcc;
