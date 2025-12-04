import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Assuming you need this for handleLogout
import "../styles/EmployeeDash.css";

function EmployeeDash() {
  const navigate = useNavigate(); // Hook to navigate
  const token = localStorage.getItem("token"); // use a single JWT for all employee calls
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({
    title: "",
    platform_name: "",
    price: 0,
    release_year: "",
    maturity_rating: "",
    genre: "",
    description: "",
    availability: true,
    // NEW FIELD ADDED for inventory count
    total_available: 1, 
  });

  const [customerEmail, setCustomerEmail] = useState("");
  const [currentRentals, setCurrentRentals] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [errorRentals, setErrorRentals] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // Fetch inventory
  const fetchGames = async () => {
    try {
      if (!token) throw new Error("Not logged in as employee");

      // The API endpoint relies on the JWT to determine the employee's store_id 
      // and returns only the inventory relevant to that store.
      const response = await fetch("http://localhost:5001/api/employee/games", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching games:", err);
      setGames([]);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [token]); // Added token as dependency

  // Add new game
  const addGame = async (e) => {
    e.preventDefault();
    try {
      if (!token) throw new Error("Not logged in as employee");

      const res = await fetch("http://localhost:5001/api/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // The entire newGame object, including total_available, is sent to the backend.
        body: JSON.stringify(newGame), 
      });

      if (res.ok) {
        // Reset form state, including total_available
        setNewGame({
          title: "",
          platform_name: "",
          price: 0,
          release_year: "",
          maturity_rating: "",
          genre: "",
          description: "",
          availability: true,
          total_available: 1,
        });
        fetchGames(); // Refresh the list of games
        alert("Game and Inventory added successfully!");
      } else {
        const errorData = await res.json();
        console.error("Failed to add game:", errorData.error);
        alert(`Failed to add game: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch rentals by customer email
  const fetchCurrentRentals = async (e) => {
    // Prevent default form submission if called from the form
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!customerEmail) {
      setErrorRentals("Please enter a customer email");
      return;
    }

    setLoadingRentals(true);
    setErrorRentals(null);

    try {
      if (!token) throw new Error("Not logged in as employee");

      const res = await fetch(
        `http://localhost:5001/api/employee/current-rentals?email=${encodeURIComponent(customerEmail)}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch rentals");
      }

      const data = await res.json();
      setCurrentRentals(data);
    } catch (err) {
      console.error(err);
      setErrorRentals(err.message || "Unable to load rentals for this email");
      setCurrentRentals([]);
    } finally {
      setLoadingRentals(false);
    }
  };

  // Update rental status
  const updateRentalStatus = async (reserveId, newStatus) => {
    try {
      if (!token) throw new Error("Not logged in as employee");
      
      // Use reserveId as confirmed by backend structure
      const res = await fetch(`http://localhost:5001/api/rentals/${reserveId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh the list of rentals after a successful update
        fetchCurrentRentals({}); 
      } else {
        console.error("Failed to update rental status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="employee-dash">
      <h1>Employee Dashboard</h1>
      <button className="logout" onClick={handleLogout}>Logout</button>

      ---
      
      {/* Add New Game */}
      <form onSubmit={addGame} className="add-game-form">
        <h2>Add New Game to Inventory</h2>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            id="title"
            type="text"
            placeholder="Title"
            value={newGame.title}
            onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
            required
          />

          <label htmlFor="platform_name">Platform:</label>
          <input
            id="platform_name"
            type="text"
            placeholder="Platform"
            value={newGame.platform_name}
            onChange={(e) =>
              setNewGame({ ...newGame, platform_name: e.target.value })
            }
            required
          />

          <label htmlFor="price">Price:</label>
          <input
            id="price"
            type="number"
            placeholder="Price"
            step="0.01"
            value={newGame.price}
            onChange={(e) =>
              setNewGame({ ...newGame, price: parseFloat(e.target.value) })
            }
            required
          />

          <label htmlFor="release_year">Release Year:</label>
          <input
            id="release_year"
            type="number"
            placeholder="Release Year"
            value={newGame.release_year}
            onChange={(e) =>
              setNewGame({ ...newGame, release_year: e.target.value })
            }
            required
          />

          {/* NEW INPUT FIELD FOR COPIES */}
          <label htmlFor="copies">Available Copies:</label>
          <input
            id="copies"
            type="number"
            placeholder="Number of copies"
            value={newGame.total_available}
            onChange={(e) =>
              setNewGame({ ...newGame, total_available: parseInt(e.target.value) || 0 })
            }
            required
            min="1"
          />
          {/* END NEW INPUT FIELD */}

          <label htmlFor="maturity_rating">Maturity Rating:</label>
          <input
            id="maturity_rating"
            type="text"
            placeholder="E, T, M"
            value={newGame.maturity_rating}
            onChange={(e) =>
              setNewGame({ ...newGame, maturity_rating: e.target.value })
            }
            required
          />

          <label htmlFor="genre">Genre:</label>
          <input
            id="genre"
            type="text"
            placeholder="Genre"
            value={newGame.genre}
            onChange={(e) =>
              setNewGame({ ...newGame, genre: e.target.value })
            }
            required
          />

          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            placeholder="Description"
            value={newGame.description}
            onChange={(e) =>
              setNewGame({ ...newGame, description: e.target.value })
            }
            required
          />

          <label htmlFor="availability">
            Available:
            <input
              id="availability"
              type="checkbox"
              checked={newGame.availability}
              onChange={(e) =>
                setNewGame({ ...newGame, availability: e.target.checked })
              }
            />
          </label>
        </div>

        <button type="submit">Add Game</button>
      </form>
      
      ---

      {/* Inventory Table */}
      <h2>Store Inventory</h2>
      <table className="games-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Platform</th>
            <th>Copies</th>
            <th>Price</th>
            <th>Available</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            // Hydration fix (tight <tr> and <td>)
            <tr key={game.game_id}><td>{game.title}</td>
              <td>{game.platform_name}</td>
              <td>{game.total_available}</td>
              <td>
                {/* TypeError fix: Ensure price is a number */}
                ${game.price != null ? Number(game.price).toFixed(2) : 'N/A'}
              </td>
              <td>{game.availability ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Rentals by Customer Email */}
      <h2>Fetch Customer Rentals</h2>
      <form onSubmit={fetchCurrentRentals} className="fetch-rentals-form">
        <input
          type="email"
          placeholder="Enter customer email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
        />
        <button type="submit">Get Rentals</button>
      </form>

      {loadingRentals ? (
        <p>Loading rentals...</p>
      ) : errorRentals ? (
        <p>{errorRentals}</p>
      ) : currentRentals.length > 0 ? (
        <table className="rentals-table">
          <thead>
            <tr>
              <th>User Email</th>
              <th>Game</th>
              <th>Status</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {currentRentals.map((rental) => (
              // Hydration fix (tight <tr> and <td>)
              <tr key={rental.reserve_id}><td>{rental.user_email}</td>
                <td>{rental.title}</td>
                <td>{rental.status}</td>
                <td>
                  <select
                    value={rental.status}
                    onChange={(e) =>
                       // Use reserve_id in the function call
                      updateRentalStatus(rental.reserve_id, e.target.value)
                    }
                  >
                    <option value="waiting_for_pickup">
                      Waiting for Pickup
                    </option>
                    <option value="picked_up">Picked Up</option>
                    <option value="returned">Returned</option>
                    <option value="late">Late</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No rentals found for this email.</p>
      )}
    </div>
  );
}

export default EmployeeDash;