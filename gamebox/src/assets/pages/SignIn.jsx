import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/SignIn.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const endpoint = isEmployee
          ? "http://localhost:5001/api/check-auth-employee"
          : "http://localhost:5001/api/check-auth";

        const response = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          navigate(isEmployee ? "/employeeDash" : "/userDash");
        }
      } catch (err) {
        console.error("Error checking auth:", err);
      }
    };
    checkAuth();
  }, [navigate, isEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isEmployee
        ? "http://localhost:5001/api/login"
        : "http://localhost:5001/api/login";

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate(isEmployee ? "/employeeDash" : "/userDash");
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to the API server.");
    }
  };

  return (
    <div className="signin-page">
      <div className="background-overlay"></div>

      <div className="signin-card">
        <h1 className="signin-title">
          {isEmployee ? "💼 Employee Login" : "🎮 User Login"}
        </h1>
        <p className="signin-subtitle">
          {isEmployee
            ? "Sign in to manage inventory and orders"
            : "Sign in to access your library and store deals"}
        </p>

        {/* Toggle User/Employee */}
        <div className="toggle-login">
          <button
            type="button"
            className={isEmployee ? "" : "active-toggle"}
            onClick={() => setIsEmployee(false)}
          >
            User
          </button>
          <button
            type="button"
            className={isEmployee ? "active-toggle" : ""}
            onClick={() => setIsEmployee(true)}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isEmployee ? "employee@company.com" : "you@example.com"}
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

        {/* Only show account creation for Users */}
        {!isEmployee && (
          <p className="signup-link">
            New here? <Link to="/CreateAcc">Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default SignIn;
