from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import traceback


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

def require_employee(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace("Bearer ", "")

        if not token:
            return jsonify({"error": "Token missing"}), 401

        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])

            # Must contain employee_id
            if "employee_id" not in payload:
                return jsonify({"error": "Employee token required"}), 403

            request.employee = payload
        except Exception as e:
            print("Employee token error:", e)
            return jsonify({"error": "Invalid or expired token"}), 401

        return f(*args, **kwargs)

    return wrapper

def get_employee_from_token():
    auth_header = request.headers.get("Authorization")

    if not auth_header or "Bearer " not in auth_header:
        return None

    try:
        token = auth_header.split(" ")[1]
        decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
        return decoded
    except Exception as e:
        print("Token decode error:", e)
        return None

# --------------------------
#       REGISTRATION
# --------------------------
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
 
        if not username or not email or not password:
            return jsonify({"error": "All fields are required"}), 400
 
        first_name, last_name = username.split('_') if '_' in username else (username, '')
 
        hashed_password = generate_password_hash(password)
 
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
 
        cursor.execute("SELECT * FROM Customer WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            con.close()
            return jsonify({"error": "Email already exists"}), 409
 
        cursor.execute(
            "INSERT INTO Customer (password, first_name, last_name, email) VALUES (%s, %s, %s, %s)",
            (hashed_password, first_name, last_name, email)
        )
        con.commit()
        customer_id = cursor.lastrowid
 
        cursor.close()
        con.close()
 
        session.permanent = True
        session['customer_id'] = customer_id
        session['email'] = email
        session['username'] = username
 
        return jsonify({
            "message": "Registration successful",
            "customer_id": customer_id,
            "username": username,
            "email": email
        }), 201
 
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({"error": "Registration failed"}), 500

# --------------------------
#       SIGN IN (User)
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
        traceback.print_exc()
        return jsonify({"error": "Internal error"}), 500


# --------------------------
#       CHECK AUTH user
# --------------------------
@app.route('/api/check-auth', methods=['GET'])
@require_auth
def check_auth():
    user = request.user
    
    # FIX: Safely check for 'customer_id' to prevent KeyError crash 
    if 'customer_id' not in user:
        # Return 403 because a valid token was presented, but for the wrong role (employee)
        return jsonify({"authenticated": False, "error": "Token is not for a customer"}), 403
        
    try:
        return jsonify({
            "authenticated": True,
            "customer_id": user["customer_id"],
            "email": user["email"]
        }), 200
    except Exception as e:
        print("Check auth error:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error during auth check"}), 500


# --------------------------
#       GAMES
# --------------------------
@app.route('/api/games', methods=['GET'])
def get_games():
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("""
            SELECT g.game_id, g.title, g.description,
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
#   RESERVE GAME (FIXED: INVENTORY DECREMENT)
# --------------------------
@app.route('/api/games/<int:game_id>/reserve', methods=['POST'])
@require_auth
def reserve_game(game_id):
    con = get_db_connection()
    cursor = con.cursor(dictionary=True)
    
    try:
        user_id = request.user["customer_id"]
        data = request.get_json()
        store_id = data.get("store_id")
        inventory_id = data.get("inventory_id")

        if not store_id or not inventory_id:
            return jsonify({"error": "Missing reservation data"}), 400

        # --- CRITICAL UPDATE: DECREASE INVENTORY COUNT ---
        
        # 1. Decrease the available copies (atomically check if > 0)
        cursor.execute(
            """
            UPDATE Inventory 
            SET available_copies = available_copies - 1 
            WHERE inventory_id = %s AND available_copies > 0
            """,
            (inventory_id,)
        )
        
        # If the update failed (because available_copies was 0 or less), abort reservation
        if cursor.rowcount == 0:
            return jsonify({"error": "No copies available for reservation. Try again."}), 409 # Conflict

        # 2. Insert the new reservation record
        cursor.execute("""
            INSERT INTO Reserve (customer_id, store_id, game_id, inventory_id)
            VALUES (%s, %s, %s, %s)
        """, (user_id, store_id, game_id, inventory_id))
        
        # Commit both the inventory update and the reservation insertion as a single transaction
        con.commit()
        
        return jsonify({"message": "Game reserved successfully", "inventory_updated": True}), 200

    except Exception as e:
        # Rollback if any error occurs (e.g., database failure)
        con.rollback()
        print("Reserve game error:", e)
        traceback.print_exc()
        return jsonify({"error": "Internal server error during reservation."}), 500
        
    finally:
        cursor.close()
        con.close()

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
#       INVENTORY (FIXED ROUTE TO LOOK UP BY GAME ID)
# --------------------------
# FIX: Route changed to accept game_id
@app.route('/api/stores/<int:store_id>/inventory/<int:game_id>', methods=['GET'])
def get_inventory_by_store(store_id, game_id):
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        
        # FIX: Query searches by store_id AND game_id to find the inventory_id
        cursor.execute("""
            SELECT inventory_id, available_copies
            FROM Inventory
            WHERE store_id = %s AND game_id = %s
        """, (store_id, game_id)) 
        
        inventory = cursor.fetchone()
        cursor.close()
        con.close()

        if not inventory or inventory.get('available_copies', 0) < 1:
            return jsonify({"error": "Inventory not found or copies unavailable"}), 404

        # Return the actual inventory_id needed for the reservation POST
        return jsonify({"inventory_id": inventory['inventory_id']}), 200 
    except Exception as e:
        print("Error fetching inventory:", e)
        traceback.print_exc()
        return jsonify({"error": "Could not fetch inventory"}), 500


# --------------------------
#   CURRENT RENTALS
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
                r.reserve_id, 
                r.status, 
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
#       REVIEWS
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
            # Fix: Concatenate first_name and last_name since 'c.name' doesn't exist
            cursor.execute("""
                SELECT r.review_id, r.rating, r.review, r.creation_date, r.customer_id, 
                       CONCAT(c.first_name, ' ', c.last_name) AS customer_name
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
#       GET/ADD/UPDATE/DELETE GAME EMPLOYEE
# --------------------------
@app.route("/api/employee/games", methods=["GET"])
@require_employee
def get_employee_games():
    employee = request.employee 
    store_id = employee.get("store_id")

    if not store_id:
        return jsonify({"error": "Employee store ID not found"}), 400

    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        
        # MODIFIED QUERY: Joins Inventory and filters by the employee's store_id
        cursor.execute("""
            SELECT g.game_id, g.title, g.platform_name, g.price, g.availability,
                   IFNULL(i.available_copies, 0) AS total_available,
                   i.inventory_id
            FROM Game g
            LEFT JOIN Inventory i ON g.game_id = i.game_id AND i.store_id = %s
            ORDER BY g.game_id
        """, (store_id,)) 
        
        games = cursor.fetchall()
        cursor.close()
        con.close()

        return jsonify(games), 200

    except Exception as e:
        print("Games fetch error:", e)
        traceback.print_exc()
        return jsonify([]), 500


@app.route("/api/games", methods=["POST"])
@require_employee # Fix: Added employee authentication
def add_game():
    try:
        data = request.get_json()
        title = data.get("title")
        platform_name = data.get("platform_name")
        price = data.get("price", 0.0)
        availability = data.get("availability", True)
        
        # New Field: Get total_available copies from the request body
        total_available = data.get("total_available", 0) 
        
        # Get employee's store_id from the token payload (set by @require_employee)
        store_id = request.employee.get("store_id")

        if not title or not platform_name:
            return jsonify({"error": "Title and Platform Name are required"}), 400
        
        # CRITICAL CHECK: Ensure the employee is associated with a store
        if not store_id:
             return jsonify({"error": "Employee token does not contain a store ID."}), 403

        con = get_db_connection()
        cursor = con.cursor()

        # Convert availability to 1/0 for MySQL
        availability_int = 1 if availability else 0

        # 1. Insert into the Game table
        cursor.execute("""
            INSERT INTO Game (title, platform_name, price, availability)
            VALUES (%s, %s, %s, %s)
        """, (title, platform_name, price, availability_int))

        game_id = cursor.lastrowid
        
        # 2. Insert into the Inventory table (linked to the employee's store)
        if game_id and total_available > 0:
            cursor.execute("""
                INSERT INTO Inventory (store_id, game_id, available_copies)
                VALUES (%s, %s, %s)
            """, (store_id, game_id, total_available))

        con.commit()
        cursor.close()
        con.close()

        return jsonify({"message": "Game added and inventory updated", "game_id": game_id, "store_id": store_id}), 201

    except Exception as e:
        import traceback
        print("Add game error:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/games/<int:game_id>", methods=["PUT"])
@require_employee # Fix: Added employee authentication
def update_game(game_id):
    try:
        data = request.get_json()
        title = data.get("title")
        platform_name = data.get("platform_name")
        price = data.get("price")  # renamed from rentalPrice
        availability = data.get("availability")  # renamed from available

        con = get_db_connection()
        cursor = con.cursor()

        # Convert availability to 1/0 for MySQL
        availability_int = 1 if availability else 0

        cursor.execute("""
            UPDATE Game
            SET title=%s,
                platform_name=%s,
                price=%s,
                availability=%s
            WHERE game_id=%s
        """, (title, platform_name, price, availability_int, game_id))

        con.commit()
        cursor.close()
        con.close()

        return jsonify({"message": "Game updated"}), 200

    except Exception as e:
        import traceback
        print("Update game error:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/games/<int:game_id>", methods=["DELETE"])
@require_employee # Fix: Added employee authentication
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
# Employee get User's Rentals
# --------------------------
@app.route("/api/employee/current-rentals", methods=["GET"])
@require_employee  # JWT check for employee
def get_current_rentals_employee():
    # Get email from query parameters
    customer_email = request.args.get("email")
    if not customer_email:
        return jsonify({"error": "Customer email query parameter is required"}), 400

    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)

        # Fetch rentals for the given customer email
        cursor.execute("""
            SELECT 
                r.reserve_id, 
                r.status, 
                c.email AS user_email, 
                g.title, 
                r.rental_date, 
                r.return_date, 
                s.address AS store_address
            FROM Reserve r
            JOIN Customer c ON r.customer_id = c.customer_id
            JOIN Game g ON r.game_id = g.game_id
            JOIN Store s ON r.store_id = s.store_id
            WHERE c.email = %s
        """, (customer_email,))

        rentals = cursor.fetchall()
        cursor.close()
        con.close()

        return jsonify(rentals), 200

    except Exception as e:
        print("Error fetching current rentals (employee):", e)
        traceback.print_exc()  # Prints full stack trace for debugging
        return jsonify({"error": "Failed to fetch rentals"}), 500


@app.route("/api/rentals/<int:rental_id>", methods=["PUT"])
@require_employee  # Or require_auth if both employees and users can update
def update_rental_status(rental_id):
    try:
        data = request.get_json()
        new_status = data.get("status")

        if not new_status:
            return jsonify({"error": "Status is required"}), 400

        allowed_statuses = ["waiting_for_pickup", "picked_up", "returned", "late"]
        if new_status not in allowed_statuses:
            return jsonify({"error": f"Invalid status. Allowed: {allowed_statuses}"}), 400

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)

        # Fetch the rental so we can read old status + game/store IDs
        cursor.execute(
            "SELECT reserve_id, game_id, store_id, status FROM Reserve WHERE reserve_id = %s",
            (rental_id,)
        )
        rental = cursor.fetchone()

        if not rental:
            cursor.close()
            con.close()
            return jsonify({"error": "Rental not found"}), 404

        old_status = rental["status"]
        game_id = rental["game_id"]
        store_id = rental["store_id"]

        # Update the rental status
        cursor.execute(
            "UPDATE Reserve SET status = %s WHERE reserve_id = %s",
            (new_status, rental_id)
        )

        # If the rental is being returned & WAS NOT already returned → add inventory back
        if new_status == "returned" and old_status != "returned":
            cursor.execute(
                """
                UPDATE Inventory
                SET available_copies = available_copies + 1
                WHERE game_id = %s AND store_id = %s
                """,
                (game_id, store_id)
            )

        con.commit()
        cursor.close()
        con.close()

        return jsonify({"message": "Rental status updated successfully"}), 200

    except Exception as e:
        import traceback
        print("Error updating rental status:", e)
        traceback.print_exc()
        return jsonify({"error": "Failed to update rental status"}), 500


# --------------------------
#       CHECK AUTH Employee
# --------------------------

@app.route('/api/check-auth-employee', methods=['GET'])
def check_auth_employee():
    employee = get_employee_from_token()
    if not employee:
        return jsonify({"authenticated": False, "error": "Unauthorized"}), 401
    
    # Return employee info if authenticated
    return jsonify({
        "authenticated": True,
        "employee_id": employee.get("employee_id"),
        "store_id": employee.get("store_id"),
        "role": employee.get("role")
    })

# --------------------------
#       SIGN IN (Employee)
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

        if not employee or not check_password_hash(employee["password"], password):
            return jsonify({"error": "Invalid email or password"}), 401

        # Fix: Safely get store_id and role for payload creation
        payload = {
            "employee_id": employee["employee_id"],
            "email": employee["business_email"],
            "store_id": employee.get("store_id"), 
            "role": employee.get("role"),         
            "exp": datetime.utcnow() + timedelta(hours=12)
        }
        token = jwt.encode(payload, SECRET, algorithm="HS256")

        return jsonify({"token": token, "employee_id": employee["employee_id"]}), 200

    except Exception as e:
        print("Employee login error:", e)
        traceback.print_exc()
        return jsonify({"error": "Server error during login"}), 500


# --------------------------
#       RUN SERVER
# --------------------------
if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True, host="0.0.0.0", port=5001)