import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/UserDash.css";

function UserDash() {
  const navigate = useNavigate();

  const [currentRentals, setCurrentRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Navigation
  const handleLogout = () => navigate("/signin");
  const goHome = () => navigate("/home");

  // Safely format rental price
  const formatPrice = (value) => {
    const num = Number(value);
    return !isNaN(num) ? `$${num.toFixed(2)}` : "N/A";
  };

  // Fetch rentals from backend
  useEffect(() => {
    const fetchRentals = async () => {
      setLoading(true);
      setError(null);

      try {
        const [currentRes, historyRes] = await Promise.all([
          fetch("http://localhost:5001/api/current-rentals", { credentials: "include" }),
          fetch("http://localhost:5001/api/rental-history", { credentials: "include" }),
        ]);

        if (currentRes.ok && historyRes.ok) {
          const currentData = await currentRes.json();
          const historyData = await historyRes.json();

          // Ensure rentalPrice is numeric
          setCurrentRentals(
            currentData.map((r) => ({ ...r, rentalPrice: Number(r.rentalPrice) }))
          );
          setRentalHistory(
            historyData.map((r) => ({ ...r, rentalPrice: Number(r.rentalPrice) }))
          );
        } else {
          setError("Failed to load rental data");
        }
      } catch (err) {
        console.error(err);
        setError("Network error while fetching rentals");
      } finally {
        setLoading(false);
      }
    };

    fetchRentals();
  }, []);

  // Determine status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "waiting for pick up":
        return "status-waiting";
      case "picked up":
        return "status-active";
      case "returned":
        return "status-returned";
      case "late":
        return "status-overdue";
      default:
        return "status-unknown";
    }
  };

  return (
    <div className="userdash-page">
      <header className="userdash-header">
        <h1>Your Rentals Dashboard</h1>
        <div className="userdash-buttons">
          <button onClick={goHome}>Back to Home</button>
          <button className="logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {loading && <p className="loading-message">Loading rentals...</p>}
      {error && <p className="error-message">{error}</p>}

      {/* Current Rentals */}
      <section className="current-rentals">
        <h2>Current Rentals</h2>
        {currentRentals.length === 0 ? (
          <p>No current rentals.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Game Title</th>
                <th>Price/Week</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRentals.map((rental, index) => (
                <tr key={index}>
                  <td>{rental.title}</td>
                  <td>{formatPrice(rental.rentalPrice)}</td>
                  <td>{rental.dueDate}</td>
                  <td className={getStatusClass(rental.status)}>{rental.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Rental History */}
      <section className="rental-history">
        <h2>Rental History</h2>
        {rentalHistory.length === 0 ? (
          <p>No rental history.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Game Title</th>
                <th>Price/Week</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              {rentalHistory.map((rental, index) => (
                <tr key={index}>
                  <td>{rental.title}</td>
                  <td>{formatPrice(rental.rentalPrice)}</td>
                  <td>{rental.returnDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default UserDash;
