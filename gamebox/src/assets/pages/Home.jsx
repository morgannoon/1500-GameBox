import { useState, useEffect } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

// NOTE: Mock data has been removed. Data is now fetched from the API.

function Home() {
  const navigate = useNavigate();

  // State to hold the fetched games
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Added error state
  
  const [filters, setFilters] = useState({
    store: "", // Store ID will be a string ('1', '2', etc.)
    available: false,
    minPrice: "",
    maxPrice: "",
    releaseYear: "",
    maturity: "",
    minRating: "",
  });

  const [currentRentals, setCurrentRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  
  // ----------------------------------------------------
  // Function to Fetch Games from Flask API
  // ----------------------------------------------------
  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    
    // Construct the URL with query parameters from filters
    const params = new URLSearchParams();
    
    // Add every non-empty/non-false filter to the search params
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== '' && value !== false) { 
            // Add 'available=true' only if the checkbox is checked
            if (key === 'available' && value === true) {
                params.append(key, 'true');
            } else if (key !== 'available') { // Skip if key is 'available' but value is false
                params.append(key, value);
            }
        }
    });

    const url = `http://localhost:5000/api/games?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", 
      });

      if (response.ok) {
        const data = await response.json();
        setGames(data);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch games:", errorData);
        setError("Failed to load games: " + (errorData.error || response.statusText));
        setGames([]); 
      }
    } catch (err) {
      console.error("Network error fetching games:", err);
      setError("Cannot connect to the game catalog server.");
      setGames([]); 
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // useEffect Hook to trigger fetch on filter change
  // ----------------------------------------------------
  useEffect(() => {
    // Debouncing or throttling the fetch call would be a good future improvement
    // to prevent rapid calls while typing, but for now, we call it directly:
    fetchGames();
  }, [filters]); 

  
  const goToDashboard = () => {
    navigate("/UserDash");
  };

  const handleLogout = async () => {
    try {
        await fetch("http://localhost:5000/api/logout", {
            method: "POST",
            credentials: "include",
        });
    } catch (err) {
        console.error("Logout error (network issue, session cleared regardless):", err);
    }
    // Redirect regardless of server response, as the session is usually cleared.
    navigate("/SignIn");
  };

  const reserveGame = (game) => {
    // This logic needs to be updated to call a backend API to create a 'Reserve' record
    alert(`Attempting to reserve ${game.title}. Backend API call pending.`);
    // Example: postReserve(game.game_id, filters.store, session.user_id)
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>🎮 GameBox Rentals</h1>
        <p>Manage your rentals, rental history, and explore new games!</p>
        <div className="top-buttons">
          <button className="rentals-btn" onClick={goToDashboard}>
            🧾 Your Rentals
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <section className="filters-section">
        <h2>Filters</h2>
        <div className="filters-form">
          {/* Note: Option values must match store_id in your database (1 and 2) */}
          <select name="store" value={filters.store} onChange={handleFilterChange}>
            <option value="">All Stores</option>
            <option value="1">Downtown</option> 
            <option value="2">Uptown</option>
          </select>

          <label className=" checkbox-label">
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
            max="5" // Assuming review rating is out of 5 stars based on your DDL
            min="0"
            name="minRating"
            placeholder="Min Rating (out of 5)"
            value={filters.minRating}
            onChange={handleFilterChange}
          />
        </div>
      </section>

      {/* Game List Section */}
      <section className="games-section">
        <h2>Available Games</h2>
        {loading && <p className="loading-message">Loading games...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && games.length === 0 && !error && (
            <p>No games match your current filter selection.</p>
        )}

        <div className="games-grid">
          {games.map((game, idx) => (
            <div key={game.game_id || idx} className="game-card">
              <img src={game.image} alt={game.title} onClick={() => setSelectedGame(game)} />
              <h3>{game.title}</h3>
              <p>Rental: ${game.rentalPrice.toFixed(2)}/week</p>
              <p>Available Copies: {game.total_available}</p>
              <p>Rating: {game.rating > 0 ? `${game.rating.toFixed(1)}/5` : 'N/A'}</p>
              <button onClick={() => reserveGame(game)} disabled={!game.available}>
                {game.available ? 'Reserve' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Game Details Modal (Updated to use fetched data structure) */}
      {selectedGame && (
        <div className="game-modal" onClick={() => setSelectedGame(null)}>
          <div className="game-details" onClick={(e) => e.stopPropagation()}>
            <img src={selectedGame.image} alt={selectedGame.title} />
            <h2>{selectedGame.title}</h2>
            <p>{selectedGame.description}</p>
            <p>Maturity Rating: {selectedGame.maturity}</p>
            <p>Platform: {selectedGame.platform_name}</p>
            <p>Release Year: {selectedGame.releaseYear}</p>
            <p>Available Copies: {selectedGame.total_available}</p>
            <p>Rental Price: ${selectedGame.rentalPrice.toFixed(2)}/week</p>
            <p>Overall Rating: {selectedGame.rating.toFixed(1)}/5</p>
            <button onClick={() => setSelectedGame(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;