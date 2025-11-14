import { useState } from "react";
import "../styles/Home.css";
import { useNavigate } from "react-router-dom";

// Mock data for demo
const gamesData = [
  {
    title: "Elden Ring",
    image: "/images/elden-ring.jpg",
    description: "Open-world action RPG from FromSoftware.",
    store: "Downtown",
    available: true,
    rentalPrice: 9.99, // rental price per week
    releaseYear: 2022,
    maturity: "M",
    rating: 9.5,
    reviews: [
      { user: "Alice", comment: "Amazing gameplay!", rating: 10 },
      { user: "Bob", comment: "Beautiful world.", rating: 9 },
    ],
  },
  {
    title: "Stardew Valley",
    image: "/images/stardew-valley.jpg",
    description: "Farm simulation with multiplayer.",
    store: "Uptown",
    available: true,
    rentalPrice: 2.99, // rental price per week
    releaseYear: 2016,
    maturity: "E10+",
    rating: 9.0,
    reviews: [
      { user: "Carol", comment: "So relaxing!", rating: 9 },
      { user: "Dan", comment: "Addictive farming.", rating: 8 },
    ],
  },
];

function Home() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    store: "",
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
  const goToDashboard = () => {
    navigate("/UserDash");
  };

  const handleLogout = () => {
    navigate("/SignIn");
  };

  const filteredGames = gamesData.filter((game) => {
    if (filters.store && game.store !== filters.store) return false;
    if (filters.available && !game.available) return false;
    if (filters.minPrice && game.rentalPrice < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && game.rentalPrice > parseFloat(filters.maxPrice)) return false;
    if (filters.releaseYear && game.releaseYear !== parseInt(filters.releaseYear)) return false;
    if (filters.maturity && game.maturity !== filters.maturity) return false;
    if (filters.minRating && game.rating < parseFloat(filters.minRating)) return false;
    return true;
  });

  const reserveGame = (game) => {
    if (!currentRentals.includes(game)) {
      setCurrentRentals((prev) => [...prev, game]);
      setRentalHistory((prev) => [...prev, game]);
      alert(`${game.title} has been added to your rentals!`);
    } else {
      alert(`${game.title} is already in your rentals.`);
    }
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



      {/* Filters */}
      <section className="filters-section">
        <h2>Filters</h2>
        <div className="filters-form">
          <select name="store" value={filters.store} onChange={handleFilterChange}>
            <option value="">All Stores</option>
            <option value="Downtown">Downtown</option>
            <option value="Uptown">Uptown</option>
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
            max="10"
            min="0"
            name="minRating"
            placeholder="Min Rating"
            value={filters.minRating}
            onChange={handleFilterChange}
          />
        </div>
      </section>

      {/* Game List */}
      <section className="games-section">
        <h2>Available Games</h2>
        <div className="games-grid">
          {filteredGames.map((game, idx) => (
            <div key={idx} className="game-card">
              <img src={game.image} alt={game.title} onClick={() => setSelectedGame(game)} />
              <h3>{game.title}</h3>
              <p>Rental: ${game.rentalPrice}/week</p>
              <button onClick={() => reserveGame(game)}>Reserve</button>
            </div>
          ))}
        </div>
      </section>

      {/* Game Details Modal */}
      {selectedGame && (
        <div className="game-modal" onClick={() => setSelectedGame(null)}>
          <div className="game-details" onClick={(e) => e.stopPropagation()}>
            <img src={selectedGame.image} alt={selectedGame.title} />
            <h2>{selectedGame.title}</h2>
            <p>{selectedGame.description}</p>
            <p>Store: {selectedGame.store}</p>
            <p>Available: {selectedGame.available ? "Yes" : "No"}</p>
            <p>Release Year: {selectedGame.releaseYear}</p>
            <p>Maturity Rating: {selectedGame.maturity}</p>
            <p>Rental Price: ${selectedGame.rentalPrice}/week</p>
            <p>Overall Rating: {selectedGame.rating}/10</p>

            <h3>Reviews</h3>
            <ul>
              {selectedGame.reviews.map((r, i) => (
                <li key={i}>
                  <strong>{r.user}:</strong> {r.comment} ({r.rating}/10)
                </li>
              ))}
            </ul>

            <button onClick={() => setSelectedGame(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
