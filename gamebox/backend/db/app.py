from flask import Flask, jsonify, request, session
from flask_cors import CORS
import mysql.connector
from datetime import timedelta
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# --- Session configuration ---
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# Enable CORS with credentials
CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])

# --- Database helper ---
def get_db_connection():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='mysqlpassword4life',
        database='videogamedb'
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

        # Validate input
        if not username or not email or not password:
            return jsonify({"error": "All fields are required to join"}), 400

        # Split username into first and last name
        name_parts = username.split('_', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Hash the password
        hashed_password = generate_password_hash(password)

        # Insert into database
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)

        # Check if email already exists
        cursor.execute("SELECT * FROM Customer WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            con.close()
            return jsonify({"error": "Email already exists"}), 409

        # Insert new customer
        cursor.execute(
            "INSERT INTO Customer (password, first_name, last_name, email) VALUES (%s, %s, %s, %s)",
            (hashed_password, first_name, last_name, email)
        )
        con.commit()
        customer_id = cursor.lastrowid

        cursor.close()
        con.close()

        # Create session
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

        # Fetch user from database
        con = get_db_connection()
        cursor = con.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Customer WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        con.close()

        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        # Verify password
        if not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401

        # Create session
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

# ------------------------------------------------------------------
@app.route('/api/games', methods=['GET'])
def get_games():
    try:
        # Get query parameters from the request
        store_id = request.args.get('store', '')
        available = request.args.get('available', 'false') 
        min_price = request.args.get('minPrice', '')
        max_price = request.args.get('maxPrice', '')
        release_year = request.args.get('releaseYear', '')
        maturity = request.args.get('maturity', '')
        min_rating = request.args.get('minRating', '')

        con = get_db_connection()
        cursor = con.cursor(dictionary=True)

        # Base SQL query structure (JOIN Game, Inventory, and Reviews/AVG)
        query = """
            SELECT 
                G.game_id, G.title, G.price, G.platform_name, G.release_year, G.maturity_rating, 
                G.genre, G.image_url, G.description,
                SUM(I.available_copies) AS total_available_copies,
                AVG(R.rating) AS average_rating
            FROM Game G
            LEFT JOIN Inventory I ON G.game_id = I.game_id
            LEFT JOIN Reviews R ON G.game_id = R.game_id
            WHERE 1=1
        """
        params = []
        
        # --- Apply Filters Dynamically ---
        
        # 1. Store Filter (requires store_id, which we map in frontend)
        if store_id:
            query += " AND I.store_id = %s"
            params.append(store_id) 

        # 2. Price Filters
        if min_price:
            query += " AND G.price >= %s"
            params.append(min_price)
        if max_price:
            query += " AND G.price <= %s"
            params.append(max_price)

        # 3. Release Year Filter
        if release_year:
            query += " AND G.release_year = %s"
            params.append(release_year)
        
        # 4. Maturity Rating Filter
        if maturity:
            query += " AND G.maturity_rating = %s"
            params.append(maturity)

        # Group and calculate average rating
        query += """ 
            GROUP BY G.game_id, G.title, G.price, G.platform_name, G.release_year, 
                     G.maturity_rating, G.genre, G.image_url, G.description 
        """

        # 5. Availability Filter (Requires HAVING clause on the aggregated sum)
        if available == 'true':
            query += " HAVING SUM(I.available_copies) > 0"
        
        # 6. Minimum Rating Filter (applied after grouping, may use AND or replace previous HAVING)
        # Note: If available is true, we must use AND. If not, we start with HAVING.
        if min_rating and available == 'true':
            query += " AND average_rating >= %s"
            params.append(min_rating)
        elif min_rating and available == 'false':
            # This case is complex if no HAVING exists, but we can assume HAVING total_available_copies >= 0 always exists implicitly
            # Let's adjust the query to only use HAVING if needed
            if not available == 'true': # If available=false or not set, we use HAVING
                query += " HAVING average_rating >= %s"
                params.append(min_rating)
        
        # Note on HAVING: The logic above is simplified. If available is false, we need to ensure the group exists.
        # The current query structure is acceptable for initial testing.


        # Execute the final query
        cursor.execute(query, tuple(params))
        games = cursor.fetchall()

        cursor.close()
        con.close()

        # Format output to match frontend expectation
        results = [
            {
                "game_id": g['game_id'],
                "title": g['title'],
                "image": g['image_url'],
                "description": g['description'],
                "total_available": g['total_available_copies'] or 0,
                # Available status must be calculated based on the sum
                "available": (g['total_available_copies'] or 0) > 0, 
                "rentalPrice": float(g['price']),
                "releaseYear": g['release_year'],
                "maturity": g['maturity_rating'],
                # Average rating check: Use 0.0 if NULL
                "rating": float(g['average_rating'] if g['average_rating'] is not None else 0.0), 
            } for g in games
        ]
        
        return jsonify(results), 200

    except Exception as e:
        print(f"Game catalog fetch error: {str(e)}")
        return jsonify({"error": "Failed to fetch games"}), 500



# --- Run server ---
if __name__ == "__main__":
    print("Starting Flask server...")
    print("Make sure MySQL is running and database is set up!")
    # Bind to 0.0.0.0 so the server is reachable from the host/devcontainer
    app.run(debug=True, host="0.0.0.0", port=5000)