import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/SignIn.css";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const navigate = useNavigate();

  // --- Check auth by trying both employee and customer endpoints ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      // NOTE: We run checks here to clear invalid tokens, but DO NOT redirect.
      // The user must click "Sign In" to use the valid token.

      // 1. Try Employee Check first
      try {
        const employeeResponse = await fetch(
          "http://localhost:5001/api/check-auth-employee",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (employeeResponse.ok) {
          // DO NOT REDIRECT HERE. Allow user to see the form.
          // navigate("/employeeDash"); 
          return;
        }
      } catch (err) {
        // Non-critical error. Continue to customer check.
      }

      // 2. Try Customer Check
      try {
        const customerResponse = await fetch(
          "http://localhost:5001/api/check-auth",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (customerResponse.ok) {
          // DO NOT REDIRECT HERE. Allow user to see the form.
          // navigate("/Home"); 
          return;
        } 
        
        // If the token fails both checks (401 or 403), clear it.
        if (customerResponse.status === 401 || customerResponse.status === 403) {
           localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Error checking customer auth:", err);
      }
    };

    // FIX: The checkAuth logic is now run to cleanup bad tokens, but won't force navigation.
    checkAuth();
  }, [isEmployee, navigate]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const endpoint = isEmployee
        ? "http://localhost:5001/api/login-employee"
        : "http://localhost:5001/api/sign-in";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear any old token and save the new JWT
        localStorage.removeItem("token");
        localStorage.setItem("token", data.token);

        // This is the ONLY place where redirection occurs: after a successful form submission.
        navigate(isEmployee ? "/employeeDash" : "/Home");
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

        <div className="toggle-login">
          <button
            type="button"
            className={!isEmployee ? "active-toggle" : ""}
            onClick={() => {
              setIsEmployee(false);
              // Clear state on toggle
              setError('');
              setEmail('');
              setPassword('');
            }}
          >
            User
          </button>

          <button
            type="button"
            className={isEmployee ? "active-toggle" : ""}
            onClick={() => {
              setIsEmployee(true);
              // Clear state on toggle
              setError('');
              setEmail('');
              setPassword('');
            }}
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

        {!isEmployee && (
          <p className="signup-link">
            New here? <Link to="/signup">Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default SignIn;