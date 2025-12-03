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
     methods=["GET", "POST", "OPTIONS"],
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
#       RUN SERVER
# --------------------------
if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5001)
