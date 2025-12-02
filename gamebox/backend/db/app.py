from flask import Flask, jsonify, request, session
from flask_cors import CORS
import mysql.connector
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# --- Session configuration ---
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# --- Enable CORS ---
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

# --- Health check ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "working"}), 200

# --- Registration ---
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

# --- Login ---
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Customer WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        con.close()

        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401

        session.permanent = True
        session['customer_id'] = user['customer_id']
        session['email'] = user['email']
        session['username'] = f"{user['first_name']} {user['last_name']}"

        return jsonify({
            "message": "Login successful",
            "customer_id": user['customer_id'],
            "username": f"{user['first_name']} {user['last_name']}",
            "email": user['email']
        }), 200

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "Login failed"}), 500

# --- Logout ---
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

# --- Check auth ---
@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    if 'customer_id' in session:
        return jsonify({
            "authenticated": True,
            "customer_id": session['customer_id'],
            "username": session['username'],
            "email": session['email']
        }), 200
    else:
        return jsonify({"authenticated": False}), 401

# --- Get Games ---
# --- Games endpoint with inventory & reviews aggregation ---
@app.route('/api/games', methods=['GET'])
def get_games():
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)

        # Fetch games with total_available and average rating
        cursor.execute("""
            SELECT 
                g.game_id,
                g.title,
                g.description,
                g.image_url AS image,
                g.price AS rentalPrice,
                g.maturity_rating AS maturity,
                g.platform_name,
                g.release_year AS releaseYear,
                IFNULL(SUM(i.available_copies), 0) AS total_available,
                IFNULL(AVG(r.rating), 0) AS rating
            FROM Game g
            LEFT JOIN Inventory i ON g.game_id = i.game_id
            LEFT JOIN Reviews r ON g.game_id = r.game_id
            GROUP BY g.game_id
        """)

        games = cursor.fetchall()

        # Add available field for frontend
        for game in games:
            game['available'] = game['total_available'] > 0

        cursor.close()
        con.close()
        return jsonify(games), 200

    except Exception as e:
        print(f"Game fetch error: {str(e)}")
        return jsonify({"error": "Failed to fetch games"}), 500


@app.route('/api/current-rentals', methods=['GET'])
def current_rentals():
    # Fetch current rentals for the logged-in user
    if 'customer_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    customer_id = session['customer_id']
    # Example query: replace with real DB query
    rentals = [
        {"title": "Elden Ring", "rentalPrice": 9.99, "dueDate": "2025-11-20", "status": "Active"},
    ]
    return jsonify(rentals), 200

@app.route('/api/rental-history', methods=['GET'])
def rental_history():
    if 'customer_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    customer_id = session['customer_id']
    # Example query: replace with real DB query
    history = [
        {"title": "The Witcher 3", "rentalPrice": 4.99, "returnDate": "2025-10-25"},
    ]
    return jsonify(history), 200


#reserve
@app.route('/api/games/<int:game_id>/reserve', methods=['POST'])
def reserve_game(game_id):
    if 'customer_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401

    customer_id = session['customer_id']

    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)

        # Check total available copies
        cursor.execute("""
            SELECT SUM(available_copies) AS total_available
            FROM Inventory
            WHERE game_id = %s
        """, (game_id,))
        result = cursor.fetchone()
        if not result or result['total_available'] <= 0:
            cursor.close()
            con.close()
            return jsonify({"error": "No copies available"}), 400

        # Reserve a copy: pick first inventory record with available copies
        cursor.execute("""
            SELECT inventory_id, available_copies
            FROM Inventory
            WHERE game_id = %s AND available_copies > 0
            LIMIT 1
        """, (game_id,))
        inventory = cursor.fetchone()

        if not inventory:
            cursor.close()
            con.close()
            return jsonify({"error": "No copies available"}), 400

        # Decrease available copies by 1
        cursor.execute("""
            UPDATE Inventory
            SET available_copies = available_copies - 1
            WHERE inventory_id = %s
        """, (inventory['inventory_id'],))

        # Create rental record
        today = datetime.today()
        due_date = today + timedelta(days=7)  # 1 week rental
        cursor.execute("""
            INSERT INTO Rentals (customer_id, game_id, rental_date, due_date, status)
            VALUES (%s, %s, %s, %s, %s)
        """, (customer_id, game_id, today.strftime("%Y-%m-%d"), due_date.strftime("%Y-%m-%d"), "Active"))

        con.commit()
        cursor.close()
        con.close()

        return jsonify({"message": "Game reserved successfully", "due_date": due_date.strftime("%Y-%m-%d")}), 200

    except Exception as e:
        print(f"Reserve error: {str(e)}")
        return jsonify({"error": "Reservation failed"}), 500


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

@app.route('/api/reserve/<int:reserve_id>', methods=['PUT'])
def update_reservation(reserve_id):
    try:
        data = request.get_json()
        status = data.get('status')
        if not status:
            return jsonify({"error": "Missing status field"}), 400

        con = get_db_connection()
        cursor = con.cursor()
        cursor.execute("UPDATE Reserve SET status=%s WHERE reserve_id=%s", (status, reserve_id))
        con.commit()
        cursor.close()
        con.close()
        return jsonify({"message": "Reservation status updated"}), 200
    except Exception as e:
        print("Update reservation error:", e)
        return jsonify({"error": "Could not update reservation"}), 500


# Add review
@app.route('/api/reviews', methods=['POST'])
def add_review():
    try:
        data = request.get_json()
        game_id = data.get('game_id')
        customer_id = data.get('customer_id')
        rating = data.get('rating')
        review = data.get('review', '')

        if not all([game_id, customer_id, rating]):
            return jsonify({"error": "Missing required fields"}), 400

        con = get_db_connection()
        cursor = con.cursor()
        cursor.execute("""
            INSERT INTO Reviews (game_id, customer_id, rating, review, creation_date)
            VALUES (%s,%s,%s,%s,CURDATE())
        """, (game_id, customer_id, rating, review))
        con.commit()
        review_id = cursor.lastrowid
        cursor.close()
        con.close()
        return jsonify({"message": "Review added successfully", "review_id": review_id}), 201
    except Exception as e:
        print("Add review error:", e)
        return jsonify({"error": "Could not add review"}), 500

# Get all employees
@app.route('/api/employees', methods=['GET'])
def get_employees():
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Employee")
        employees = cursor.fetchall()
        cursor.close()
        con.close()
        return jsonify(employees), 200
    except Exception as e:
        print("Get employees error:", e)
        return jsonify({"error": "Could not fetch employees"}), 500

# Get inventory
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Inventory")
        inventory = cursor.fetchall()
        cursor.close()
        con.close()
        return jsonify(inventory), 200
    except Exception as e:
        print("Get inventory error:", e)
        return jsonify({"error": "Could not fetch inventory"}), 500

# Get game by ID
@app.route('/api/games/<int:game_id>', methods=['GET'])
def get_game(game_id):
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Game WHERE game_id=%s", (game_id,))
        game = cursor.fetchone()
        cursor.close()
        con.close()
        if not game:
            return jsonify({"error": "Game not found"}), 404
        return jsonify(game), 200
    except Exception as e:
        print("Get game error:", e)
        return jsonify({"error": "Could not fetch game"}), 500

# Get customer by ID
@app.route('/api/customers/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    try:
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT customer_id, first_name, last_name, email FROM Customer WHERE customer_id = %s", (customer_id,))
        customer = cursor.fetchone()
        cursor.close()
        con.close()
        if not customer:
            return jsonify({"error": "Customer not found"}), 404
        return jsonify(customer), 200
    except Exception as e:
        print("Get customer error:", e)
        return jsonify({"error": "Could not fetch customer"}), 500

@app.route("/api/stores", methods=["GET"])
def get_stores():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Replace 'store_id', 'address', 'city' with your actual column names
        cursor.execute("SELECT store_id, address, city FROM Store")
        stores = cursor.fetchall()
        return jsonify(stores)
    except Exception as e:
        print("Error fetching stores:", e)
        return jsonify({"error": "Failed to fetch stores"}), 500


# --- Run server ---
if __name__ == "__main__":
    print("Starting Flask server...")
    print("Make sure MySQL container 'mysql-gamebox' is running and DB is initialized!")
    app.run(debug=True, host="0.0.0.0", port=5000)
