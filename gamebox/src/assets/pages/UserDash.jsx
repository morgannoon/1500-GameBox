import { useState, useEffect } from "react";
import "../styles/UserDash.css";
import { useNavigate } from "react-router-dom";

function UserDash() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); 

  const [currentRentals, setCurrentRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorCurrent, setErrorCurrent] = useState(null);
  const [errorHistory, setErrorHistory] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };
  const goHome = () => navigate("/home");

  const formatPrice = (value) => {
    const num = Number(value);
    return !isNaN(num) ? `$${num.toFixed(2)}` : "N/A";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString(); 
  };

  const fetchData = async (url, setData, setError, setLoading) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to fetch ${url}:`, text);
        setError(`Failed to load data`);
        setData([]);
        return;
      }
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error(`Network error fetching ${url}:`, err);
      setError("Network error while fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(
      "http://localhost:5001/api/current-rentals",
      setCurrentRentals,
      setErrorCurrent,
      setLoadingCurrent
    );
    fetchData(
      "http://localhost:5001/api/rental-history",
      setRentalHistory,
      setErrorHistory,
      setLoadingHistory
    );
  }, [token]);

  const getStatusClass = (status) => {
    switch (status) {
      case "waiting_for_pickup":
        return "status-waiting";
      case "picked_up":
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

      {/* Current Rentals */}
      <section className="current-rentals">
        <h2>Current Rentals</h2>
        {loadingCurrent ? (
          <p className="loading-message">Loading current rentals...</p>
        ) : errorCurrent ? (
          <p className="error-message">{errorCurrent}</p>
        ) : currentRentals.length === 0 ? (
          <p>No current rentals.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Game Title</th>
                <th>Price/Week</th>
                <th>Rental Date</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRentals.map((rental, index) => (
                <tr key={index}>
                  <td>{rental.title}</td>
                  <td>{formatPrice(rental.rentalPrice)}</td>
                  <td>{formatDate(rental.rental_date)}</td>
                  <td>{formatDate(rental.return_date)}</td>
                  <td className={getStatusClass(rental.status)}>
                    {rental.status.replace("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Rental History */}
      <section className="rental-history">
        <h2>Rental History</h2>
        {loadingHistory ? (
          <p className="loading-message">Loading rental history...</p>
        ) : errorHistory ? (
          <p className="error-message">{errorHistory}</p>
        ) : rentalHistory.length === 0 ? (
          <p>No rental history.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Game Title</th>
                <th>Price/Week</th>
                <th>Rental Date</th>
                <th>Return Date</th>
              </tr>
            </thead>
            <tbody>
              {rentalHistory.map((rental, index) => (
                <tr key={index}>
                  <td>{rental.title}</td>
                  <td>{formatPrice(rental.rentalPrice)}</td>
                  <td>{formatDate(rental.rental_date)}</td>
                  <td>{formatDate(rental.return_date)}</td>
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
