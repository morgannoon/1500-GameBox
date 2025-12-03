from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)

# --- Secret for JWT ---
SECRET = "your-secret-key-change-this-in-production"

# --- Enable CORS (credentials optional, adjust for sessions if needed) ---
CORS(app,
     origins=["http://localhost:5173", "http://127.0.0.1:5173"],
     supports_credentials=True,
     methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
     allow_headers=["Content-Type", "Authorization"]
)

# --- DB connection ---
def get_db_connection():
    return mysql.connector.connect(
        host='127.0.0.1',
        user='root',
        password='mysqlpassword4life',
        database='videogamedb',
        port=3306
    )

# --- JWT helpers ---
def create_token(user):
    payload = {
        "customer_id": user["customer_id"],
        "email": user["email"],
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            # Allow preflight requests to pass
            return "", 200

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header.split(" ")[1]
        try:
            decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
            request.user = decoded
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return func(*args, **kwargs)
    return wrapper

# --------------------------
#         SIGN IN (User)
# --------------------------
@app.route('/api/sign-in', methods=['POST'])
def sign_in():
    try:
        data = request.get_json()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()
        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Customer WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        con.close()

        if not user or not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_token(user)
        return jsonify({
            "message": "Login successful",
            "token": token,
            "customer_id": user["customer_id"],
            "username": f"{user['first_name']} {user['last_name']}"
        }), 200
    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": "Internal error"}), 500

# --------------------------
#         SIGN IN (Employee)
# --------------------------
@app.route("/api/login-employee", methods=["POST"])
def login_employee():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Employee WHERE business_email = %s", (email,))
        employee = cursor.fetchone()
        cursor.close()
        con.close()

        if not employee:
            return jsonify({"error": "Invalid email or password"}), 401

        if not check_password_hash(employee["password"], password):
            return jsonify({"error": "Invalid email or password"}), 401

        # TODO: Generate JWT here
        token = "FAKE_JWT_FOR_NOW"

        return jsonify({"token": token, "employee_id": employee["employee_id"]}), 200

    except Exception as e:
        print("Login error:", e)
        return jsonify({"error": "Server error during login"}), 500

# --------------------------
#       CHECK AUTH
# --------------------------
@app.route('/api/check-auth', methods=['GET'])
@require_auth
def check_auth():
    user = request.user
    return jsonify({
        "authenticated": True,
        "customer_id": user["customer_id"],
        "email": user["email"]
    }), 200

# --------------------------
#       GAMES
# --------------------------
@app.route('/api/games', methods=['GET'])
def get_games():
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("""
            SELECT g.game_id, g.title, g.description, g.image_url AS image,
                   g.price AS rentalPrice, g.maturity_rating AS maturity,
                   g.platform_name, g.release_year AS releaseYear,
                   IFNULL(SUM(i.available_copies),0) AS total_available,
                   IFNULL(AVG(r.rating),0) AS rating
            FROM Game g
            LEFT JOIN Inventory i ON g.game_id = i.game_id
            LEFT JOIN Reviews r ON g.game_id = r.game_id
            GROUP BY g.game_id
        """)
        games = cursor.fetchall()
        for game in games:
            game['available'] = game['total_available'] > 0
        cursor.close()
        con.close()
        return jsonify(games), 200
    except Exception as e:
        print(f"Game fetch error: {e}")
        return jsonify({"error": "Failed to fetch games"}), 500

# --------------------------
#   RESERVE GAME
# --------------------------
@app.route('/api/games/<int:game_id>/reserve', methods=['POST'])
@require_auth
def reserve_game(game_id):
    try:
        user_id = request.user["customer_id"]
        data = request.get_json()
        store_id = data.get("store_id")
        inventory_id = data.get("inventory_id")

        if not store_id or not inventory_id:
            return jsonify({"error": "Missing reservation data"}), 400

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("""
            INSERT INTO Reserve (customer_id, store_id, game_id, inventory_id)
            VALUES (%s, %s, %s, %s)
        """, (user_id, store_id, game_id, inventory_id))
        con.commit()
        cursor.close()
        con.close()

        return jsonify({"message": "Game reserved successfully"}), 200

    except Exception as e:
        print("Reserve game error:", e)
        return jsonify({"error": "Internal server error"}), 500

# --------------------------
#       STORES
# --------------------------
@app.route("/api/stores", methods=["GET"])
def get_stores():
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT store_id, address, city FROM Store")
        stores = cursor.fetchall()
        cursor.close()
        con.close()
        return jsonify(stores)
    except Exception as e:
        print("Error fetching stores:", e)
        return jsonify({"error": "Failed to fetch stores"}), 500

# --------------------------
#       INVETNROY
# --------------------------

@app.route('/api/stores/<int:store_id>/inventory/<int:inventory_id>', methods=['GET'])
def get_inventory_by_store(store_id, inventory_id):
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("""
            SELECT *
            FROM Inventory
            WHERE store_id = %s AND inventory_id = %s
        """, (store_id, inventory_id))
        inventory = cursor.fetchone()
        cursor.close()
        con.close()

        if not inventory:
            return jsonify({"error": "Inventory not found"}), 404

        return jsonify(inventory), 200
    except Exception as e:
        print("Error fetching inventory:", e)
        return jsonify({"error": "Could not fetch inventory"}), 500


# --------------------------
#   CURRENT RENTALS
# --------------------------
# --------------------------
@app.route("/api/current-rentals", methods=["GET", "OPTIONS"])
@require_auth
def current_rentals():
    if request.method == "OPTIONS":
        return "", 200

    try:
        customer_id = request.user["customer_id"]

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                g.game_id, 
                g.title, 
                g.price AS rentalPrice,  -- rename for frontend
                r.rental_date, 
                r.return_date, 
                s.address AS store_address, 
                r.status
            FROM Reserve r
            JOIN Game g ON r.game_id = g.game_id
            JOIN Store s ON r.store_id = s.store_id
            WHERE r.customer_id = %s AND r.status IN ('waiting_for_pickup', 'picked_up')
        """, (customer_id,))
        rentals = cursor.fetchall()
        cursor.close()
        con.close()

        return jsonify(rentals), 200
    except Exception as e:
        print("Current rentals error:", e)
        return jsonify({"error": "Failed to fetch current rentals"}), 500


# --------------------------
#   RENTAL HISTORY
# --------------------------
@app.route("/api/rental-history", methods=["GET", "OPTIONS"])
@require_auth
def rental_history():
    if request.method == "OPTIONS":
        return "", 200

    try:
        customer_id = request.user["customer_id"]

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("""
            SELECT 
                g.game_id, 
                g.title, 
                g.price AS rentalPrice,  -- include price for frontend
                r.rental_date, 
                r.return_date, 
                s.address AS store_address, 
                r.status
            FROM Reserve r
            JOIN Game g ON r.game_id = g.game_id
            JOIN Store s ON r.store_id = s.store_id
            WHERE r.customer_id = %s AND r.status = 'returned'
            ORDER BY r.return_date DESC
        """, (customer_id,))
        history = cursor.fetchall()
        cursor.close()
        con.close()

        return jsonify(history), 200
    except Exception as e:
        print("Rental history error:", e)
        return jsonify({"error": "Failed to fetch rental history"}), 500

# --------------------------
#         REVIEWS
# --------------------------
@app.route('/api/games/<int:game_id>/reviews', methods=['GET', 'POST', 'OPTIONS'])
@require_auth  # ensures we have request.user with customer_id
def game_reviews(game_id):
    if request.method == "OPTIONS":
        return "", 200

    con = get_db_connection()
    cursor = con.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            # Fetch reviews for the game
            cursor.execute("""
                SELECT r.review_id, r.rating, r.review, r.creation_date, r.customer_id, c.name AS customer_name
                FROM Reviews r
                JOIN Customer c ON r.customer_id = c.customer_id
                WHERE r.game_id = %s
                ORDER BY r.creation_date DESC
            """, (game_id,))
            reviews = cursor.fetchall()
            return jsonify(reviews), 200

        elif request.method == 'POST':
            data = request.get_json()
            rating = data.get('rating')
            review_text = data.get('review', '')
            customer_id = request.user["customer_id"]

            if not rating:
                return jsonify({"error": "Rating is required"}), 400

            cursor.execute("""
                INSERT INTO Reviews (game_id, customer_id, rating, review, creation_date)
                VALUES (%s, %s, %s, %s, CURDATE())
            """, (game_id, customer_id, rating, review_text))
            con.commit()
            review_id = cursor.lastrowid

            # Return the newly created review
            cursor.execute("SELECT * FROM Reviews WHERE review_id = %s", (review_id,))
            new_review = cursor.fetchone()

            return jsonify(new_review), 201

    except Exception as e:
        print("Game reviews error:", e)
        return jsonify({"error": "Could not process reviews"}), 500

    finally:
        cursor.close()
        con.close()


# --------------------------
#       ADD/UPDATE/DELETE GAME
# --------------------------
@app.route("/api/games", methods=["POST"])
def add_game():
    try:
        data = request.get_json()
        title = data.get("title")
        platform_name = data.get("platform_name")
        total_available = data.get("total_available", 1)
        rentalPrice = data.get("rentalPrice", 0.0)
        available = data.get("availability", True)

        if not title or not platform_name:
            return jsonify({"error": "Title and Platform Name are required"}), 400

        con = get_db_connection()
        cursor = con.cursor()
        cursor.execute("""
            INSERT INTO Game (title, platform_name, total_available, rentalPrice, available)
            VALUES (%s, %s, %s, %s, %s)
        """, (title, platform_name, total_available, rentalPrice, available))
        con.commit()
        game_id = cursor.lastrowid
        cursor.close()
        con.close()
        return jsonify({"message": "Game added", "game_id": game_id}), 201
    except Exception as e:
        print("Add game error:", e)
        return jsonify({"error": "Failed to add game"}), 500

@app.route("/api/games/<int:game_id>", methods=["PUT"])
def update_game(game_id):
    try:
        data = request.get_json()
        title = data.get("title")
        platform_name = data.get("platform_name")
        total_available = data.get("total_available")
        rentalPrice = data.get("rentalPrice")
        available = data.get("available")

        con = get_db_connection()
        cursor = con.cursor()
        cursor.execute("""
            UPDATE Game
            SET title=%s, platform_name=%s, total_available=%s, rentalPrice=%s, available=%s
            WHERE game_id=%s
        """, (title, platform_name, total_available, rentalPrice, available, game_id))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"message": "Game updated"}), 200
    except Exception as e:
        print("Update game error:", e)
        return jsonify({"error": "Failed to update game"}), 500

@app.route("/api/games/<int:game_id>", methods=["DELETE"])
def delete_game(game_id):
    try:
        con = get_db_connection()
        cursor = con.cursor()
        cursor.execute("DELETE FROM Game WHERE game_id=%s", (game_id,))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"message": "Game deleted"}), 200
    except Exception as e:
        print("Delete game error:", e)
        return jsonify({"error": "Failed to delete game"}), 500


# --------------------------
#       RUN SERVER
# --------------------------
if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5001)
