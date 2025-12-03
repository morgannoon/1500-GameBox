import { useState, useEffect } from "react";
import "../styles/EmployeeDash.css";

function EmployeeDash() {
  const [games, setGames] = useState([]);
  const [editingGameId, setEditingGameId] = useState(null);
  const [newGame, setNewGame] = useState({
    title: "",
    platform_name: "", // Updated field for consistency
    availability: true,
    total_available: 1, // Updated field for consistency
    rentalPrice: 0, // Updated field for consistency
  });

  // Fetch all games on mount
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/games", {
        credentials: "include",
      });
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Error fetching games:", err);
      // Optional: set a visible error state here if needed
    }
  };

  const handleEditChange = (e, gameId) => {
    const { name, value, type, checked } = e.target;
    
    // Map input 'price' field back to 'rentalPrice' key, and 'copies' to 'total_available' key
    let fieldName = name;
    if (name === 'price') fieldName = 'rentalPrice';
    if (name === 'copies') fieldName = 'total_available';
    if (name === 'genre') fieldName = 'platform_name';
    
    setGames((prev) =>
      prev.map((game) =>
        // Use game_id for the lookup
        game.game_id === gameId
          ? { ...game, [fieldName]: type === "checkbox" ? checked : value }
          : game
      )
    );
  };

  const saveGame = async (game) => {
    try {
      // Use game_id in the URL
      const res = await fetch(`http://localhost:5001/api/games/${game.game_id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(game),
      });

      if (res.ok) {
        setEditingGameId(null);
        fetchGames();
      } else {
        console.error("Failed to update game");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteGame = async (gameId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/games/${gameId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) fetchGames();
      else console.error("Failed to delete game");
    } catch (err) {
      console.error(err);
    }
  };

  const addGame = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/games", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // NOTE: The backend needs to be able to process these keys now
        body: JSON.stringify({
            title: newGame.title,
            platform_name: newGame.platform_name, // Mapped to API key
            total_available: newGame.total_available, // Mapped to API key
            rentalPrice: newGame.rentalPrice, // Mapped to API key
            // The backend must also handle the insertion into Game and Inventory tables
        }),
      });

      if (res.ok) {
        setNewGame({ title: "", platform_name: "", availability: true, total_available: 1, rentalPrice: 0 });
        fetchGames();
      } else {
        console.error("Failed to add game");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="employee-dash">
      <h1>Employee Dashboard</h1>

      {/* Add New Game */}
<form onSubmit={addGame} className="add-game-form">
  <h2>Add New Game</h2>

  <div className="form-group">
    <label htmlFor="title">Title:</label>
    <input
      id="title"
      type="text"
      placeholder="Enter game title"
      value={newGame.title}
      onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
      required
    />
  </div>

  <div className="form-group">
    <label htmlFor="platform_name">Platform Name / Genre:</label>
    <input
      id="platform_name"
      type="text"
      placeholder="Enter platform or genre"
      value={newGame.platform_name}
      onChange={(e) => setNewGame({ ...newGame, platform_name: e.target.value })}
      required
    />
  </div>

  <div className="form-group">
    <label htmlFor="total_available">Copies Available:</label>
    <input
      id="total_available"
      type="number"
      placeholder="Enter number of copies"
      min="1"
      value={newGame.total_available}
      onChange={(e) => setNewGame({ ...newGame, total_available: Number(e.target.value) })}
      required
    />
  </div>

  <div className="form-group">
    <label htmlFor="rentalPrice">Rental Price:</label>
    <input
      id="rentalPrice"
      type="number"
      placeholder="Enter rental price"
      min="0"
      step="0.01"
      value={newGame.rentalPrice}
      onChange={(e) => setNewGame({ ...newGame, rentalPrice: Number(e.target.value) })}
      required
    />
  </div>

  <div className="form-group">
    <label htmlFor="availability">
      Available:
      <input
        id="availability"
        type="checkbox"
        checked={newGame.availability}
        onChange={(e) => setNewGame({ ...newGame, availability: e.target.checked })}
      />
    </label>
  </div>

  <button type="submit">Add Game</button>
</form>


      {/* Games Table */}
      <h2>Inventory</h2>
      <table className="games-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Platform Name</th>
            <th>Copies Available</th>
            <th>Price</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            // Use game_id for key and editing
            <tr key={game.game_id}>
              <td>
                {editingGameId === game.game_id ? (
                  <input
                    name="title"
                    value={game.title}
                    onChange={(e) => handleEditChange(e, game.game_id)}
                  />
                ) : (
                  game.title
                )}
              </td>
              <td>
                {editingGameId === game.game_id ? (
                  <input
                    name="platform_name" // Use correct key
                    value={game.platform_name}
                    onChange={(e) => handleEditChange(e, game.game_id)}
                  />
                ) : (
                  // Use correct key
                  game.platform_name 
                )}
              </td>
              <td>
                {editingGameId === game.game_id ? (
                  <input
                    type="number"
                    name="copies"
                    // Use total_available key for copies count
                    value={game.total_available} 
                    onChange={(e) => handleEditChange(e, game.game_id)}
                  />
                ) : (
                  // Use total_available key
                  game.total_available 
                )}
              </td>
              <td>
                {editingGameId === game.game_id ? (
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    // Use rentalPrice key
                    value={game.rentalPrice} 
                    onChange={(e) => handleEditChange(e, game.game_id)}
                  />
                ) : (
                  // Use rentalPrice and add safe check
                  `$${game.rentalPrice ? Number(game.rentalPrice).toFixed(2) : 'N/A'}`
                )}
              </td>
              <td>
                {editingGameId === game.game_id ? (
                  <input
                    type="checkbox"
                    name="availability"
                    checked={game.available} // Use API's 'available' boolean
                    onChange={(e) => handleEditChange(e, game.game_id)}
                  />
                ) : game.available ? ( // Use API's 'available' boolean
                  "Yes"
                ) : (
                  "No"
                )}
              </td>
              <td>
                {editingGameId === game.game_id ? (
                  <>
                    <button onClick={() => saveGame(game)}>Save</button>
                    <button onClick={() => setEditingGameId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingGameId(game.game_id)}>Edit</button>
                    <button onClick={() => deleteGame(game.game_id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeDash;