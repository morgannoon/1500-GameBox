import { useState, useEffect } from "react";
import "../styles/EmployeeDash.css";

function EmployeeDash() {
  const [games, setGames] = useState([]);
  const [editingGameId, setEditingGameId] = useState(null);
  const [newGame, setNewGame] = useState({
    title: "",
    genre: "",
    availability: true,
    copies: 1,
    price: 0,
  });

  // Fetch all games on mount
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/games", {
        credentials: "include",
      });
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.error("Error fetching games:", err);
    }
  };

  const handleEditChange = (e, gameId) => {
    const { name, value, type, checked } = e.target;
    setGames((prev) =>
      prev.map((game) =>
        game.id === gameId
          ? { ...game, [name]: type === "checkbox" ? checked : value }
          : game
      )
    );
  };

  const saveGame = async (game) => {
    try {
      const res = await fetch(`http://localhost:5000/api/games/${game.id}`, {
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
      const res = await fetch(`http://localhost:5000/api/games/${gameId}`, {
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
      const res = await fetch("http://localhost:5000/api/games", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGame),
      });

      if (res.ok) {
        setNewGame({ title: "", genre: "", availability: true, copies: 1, price: 0 });
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
        <input
          type="text"
          placeholder="Title"
          value={newGame.title}
          onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Genre"
          value={newGame.genre}
          onChange={(e) => setNewGame({ ...newGame, genre: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Copies"
          min="1"
          value={newGame.copies}
          onChange={(e) => setNewGame({ ...newGame, copies: Number(e.target.value) })}
          required
        />
        <input
          type="number"
          placeholder="Price"
          min="0"
          step="0.01"
          value={newGame.price}
          onChange={(e) => setNewGame({ ...newGame, price: Number(e.target.value) })}
          required
        />
        <label>
          Available: 
          <input
            type="checkbox"
            checked={newGame.availability}
            onChange={(e) => setNewGame({ ...newGame, availability: e.target.checked })}
          />
        </label>
        <button type="submit">Add Game</button>
      </form>

      {/* Games Table */}
      <h2>Inventory</h2>
      <table className="games-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Genre</th>
            <th>Copies</th>
            <th>Price</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr key={game.id}>
              <td>
                {editingGameId === game.id ? (
                  <input
                    name="title"
                    value={game.title}
                    onChange={(e) => handleEditChange(e, game.id)}
                  />
                ) : (
                  game.title
                )}
              </td>
              <td>
                {editingGameId === game.id ? (
                  <input
                    name="genre"
                    value={game.genre}
                    onChange={(e) => handleEditChange(e, game.id)}
                  />
                ) : (
                  game.genre
                )}
              </td>
              <td>
                {editingGameId === game.id ? (
                  <input
                    type="number"
                    name="copies"
                    value={game.copies}
                    onChange={(e) => handleEditChange(e, game.id)}
                  />
                ) : (
                  game.copies
                )}
              </td>
              <td>
                {editingGameId === game.id ? (
                  <input
                    type="number"
                    name="price"
                    step="0.01"
                    value={game.price}
                    onChange={(e) => handleEditChange(e, game.id)}
                  />
                ) : (
                  `$${game.price.toFixed(2)}`
                )}
              </td>
              <td>
                {editingGameId === game.id ? (
                  <input
                    type="checkbox"
                    name="availability"
                    checked={game.availability}
                    onChange={(e) => handleEditChange(e, game.id)}
                  />
                ) : game.availability ? (
                  "Yes"
                ) : (
                  "No"
                )}
              </td>
              <td>
                {editingGameId === game.id ? (
                  <>
                    <button onClick={() => saveGame(game)}>Save</button>
                    <button onClick={() => setEditingGameId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingGameId(game.id)}>Edit</button>
                    <button onClick={() => deleteGame(game.id)}>Delete</button>
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
