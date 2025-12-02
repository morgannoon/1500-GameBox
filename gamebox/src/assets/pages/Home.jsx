import { useState, useEffect } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  // Game list state
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    store: "",
    available: false,
    minPrice: "",
    maxPrice: "",
    releaseYear: "",
    maturity: "",
    minRating: "",
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Fetch games based on filters
  const fetchGames = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== "" && value !== false) {
        if (key === "available" && value === true) {
          params.append(key, "true");
        } else if (key !== "available") {
          params.append(key, value);
        }
      }
    });

    const url = `http://127.0.0.1:5001/api/games?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setGames(data);
      } else {
        const data = await response.json();
        setError("Failed to load games: " + (data.error || response.statusText));
        setGames([]);
      }
    } catch (err) {
      setError("Cannot connect to the game catalog server.");
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch games whenever filters change
  useEffect(() => {
    fetchGames();
  }, [filters]);

  // Navigation actions
  const goToDashboard = () => navigate("/UserDash");
  const goToGameDetails = (gameId) => navigate(`/game/${gameId}`);

  // Logout request
  const handleLogout = async () => {
    try {
      await fetch("http://127.0.0.1:5001/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    }
    navigate("/SignIn");
  };


  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <h1>🎮 GameBox Rentals</h1>
        <p>Manage your rentals, history, and explore new games!</p>
        <div className="top-buttons">
          <button className="rentals-btn" onClick={goToDashboard}>
            🧾 Your Rentals
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="filters-section">
        <h2>Filters</h2>

        <div className="filters-form">
          <select name="store" value={filters.store} onChange={handleFilterChange}>
            <option value="">All Stores</option>
            <option value="1">Downtown</option>
            <option value="2">Uptown</option>
          </select>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="available"
              checked={filters.available}
              onChange={handleFilterChange}
            />
            <span>Available Only</span>
          </label>

          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
          />

          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
          />

          <input
            type="number"
            name="releaseYear"
            placeholder="Release Year"
            value={filters.releaseYear}
            onChange={handleFilterChange}
          />

          <select name="maturity" value={filters.maturity} onChange={handleFilterChange}>
            <option value="">All Ratings</option>
            <option value="E">E</option>
            <option value="E10+">E10+</option>
            <option value="T">T</option>
            <option value="M">M</option>
          </select>

          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            name="minRating"
            placeholder="Min Rating"
            value={filters.minRating}
            onChange={handleFilterChange}
          />
        </div>
      </section>

      {/* Games */}
      <section className="games-section">
        <h2>Available Games</h2>

        {loading && <p className="loading-message">Loading games...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && games.length === 0 && !error && (
          <p>No games match your filters.</p>
        )}

        <div className="games-grid">
          {games.map((game, i) => {
            const rentalPrice = Number(game.rentalPrice);
            const rating = Number(game.rating);

            return (
              <div key={game.game_id || i} className="game-card">
                <h3>{game.title}</h3>

                <p>
                  Rental: $
                  {!isNaN(rentalPrice) ? rentalPrice.toFixed(2) : "N/A"}/week
                </p>

                <p>Available Copies: {game.total_available ?? 0}</p>

                <p>
                  Rating: {!isNaN(rating) ? rating.toFixed(1) + "/5" : "N/A"}
                </p>

                <div className="card-buttons">
                  <button onClick={() => goToGameDetails(game.game_id)}>
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home;
