import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/UserDash.css";

function UserDash() {
  const navigate = useNavigate();

  // Example data — later you can load this dynamically
  const [currentRentals, setCurrentRentals] = useState([
    {
      title: "Elden Ring",
      rentalPrice: 9.99,
      dueDate: "2025-11-20",
      status: "Active",
    },
    {
      title: "Stardew Valley",
      rentalPrice: 2.99,
      dueDate: "2025-11-05",
      status: "Overdue",
    },
  ]);

  const [rentalHistory, setRentalHistory] = useState([
    {
      title: "The Witcher 3",
      rentalPrice: 4.99,
      returnDate: "2025-10-25",
    },
    {
      title: "Animal Crossing",
      rentalPrice: 3.99,
      returnDate: "2025-09-12",
    },
  ]);

  // Navigation
  const handleLogout = () => navigate("/signin");
  const goHome = () => navigate("/home");

  return (
    <div className="userdash-page">
      <header className="userdash-header">
        <h1>Your Rentals Dashboard</h1>
        <div className="userdash-buttons">
          <button onClick={goHome}>Back to Home</button>
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Current Rentals Section */}
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
                  <td>${rental.rentalPrice.toFixed(2)}</td>
                  <td>{rental.dueDate}</td>
                  <td
                    className={
                      rental.status === "Overdue"
                        ? "status-overdue"
                        : "status-active"
                    }
                  >
                    {rental.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Rental History Section */}
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
                  <td>${rental.rentalPrice.toFixed(2)}</td>
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
