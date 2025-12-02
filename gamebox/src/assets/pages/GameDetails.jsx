import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/GameDetails.css";

function GameDetails() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStore, setSelectedStore] = useState("");
  const [stores, setStores] = useState([]);

  // Replace this with actual session user ID from your auth
  const sessionUserId = 1;

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:5001/api/games`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch games");
        const data = await res.json();
        const selectedGame = data.find((g) => String(g.game_id) === gameId);
        setGame(selectedGame || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchStores = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5001/api/stores");
        if (!res.ok) throw new Error("Failed to fetch stores");
        const data = await res.json();
        setStores(data);
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };

    fetchGameDetails();
    fetchStores();
  }, [gameId]);

  // Fetch inventory for the selected store/game
  const fetchInventoryId = async (storeId, gameId) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:5001/api/stores/${storeId}/inventory/${gameId}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch inventory");
      const data = await res.json();
      return data.inventory_id;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const reserveGame = async () => {
    if (!selectedStore) {
      alert("Please select a store for pickup.");
      return;
    }

    try {
      const inventoryId = await fetchInventoryId(selectedStore, gameId);
      if (!inventoryId) {
        alert("No available inventory at this store.");
        return;
      }

      const res = await fetch(
        `http://127.0.0.1:5001/api/games/${gameId}/reserve`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: sessionUserId,
            store_id: parseInt(selectedStore),
            inventory_id: inventoryId,
            employee_id: null,
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Game reserved successfully!");
      } else {
        alert(data.error || "Failed to reserve game");
      }
    } catch (err) {
      console.error(err);
      alert("Network or inventory error.");
    }
  };

  if (loading) return <p>Loading game details...</p>;
  if (error) return <p>{error}</p>;
  if (!game) return <p>Game not found.</p>;

  return (
    <div className="game-details-page">
      <h1>{game.title}</h1>
      <p>
        {game.platform_name} | {game.releaseYear} | {game.maturity}
      </p>
      <p>{game.description}</p>
      <p>Available Copies: {game.total_available ?? 0}</p>

      {/* Store selection for reservation */}
      <div className="reserve-section">
        <label>
          Select Store for Pickup:
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
          >
            <option value="">--Choose Store--</option>
            {stores.map((store) => (
              <option key={store.store_id} value={store.store_id}>
                {store.address}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={reserveGame}
          disabled={!selectedStore || game.total_available === 0}
        >
          Reserve Game
        </button>
      </div>
    </div>
  );
}

export default GameDetails;
