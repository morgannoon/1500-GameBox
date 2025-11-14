import { useState } from "react";
import "../styles/SignIn.css";
import { Link, useNavigate } from "react-router-dom";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);

    // Navigate to home page
    navigate("/home");
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
          New here?{" "}
          <Link to="/signup">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
