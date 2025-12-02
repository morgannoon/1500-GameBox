import mysql.connector
from werkzeug.security import generate_password_hash

# --- MySQL connection settings ---
MYSQL_HOST = "127.0.0.1"      # Or 'mysql-gamebox' if using Docker network
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = "mysqlpassword4life"
MYSQL_DB = "videogamedb"

# --- Users and plain password ---
users = [
    "alice.johnson@example.com",
    "bob.smith@example.com",
    "charlie.brown@example.com",
    "diana.prince@example.com",
    "evan.taylor@example.com",
    "fiona.davis@example.com",
    "george.miller@example.com",
    "hannah.wilson@example.com",
    "ian.moore@example.com",
    "julia.anderson@example.com"
]

plain_password = "pass123"

# --- Connect to MySQL ---
try:
    con = mysql.connector.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB
    )
    cursor = con.cursor()
    print("Connected to MySQL successfully.")

    # --- Generate hashes and update each user ---
    for email in users:
        hashed = generate_password_hash(plain_password)
        cursor.execute(
            "UPDATE Customer SET password=%s WHERE email=%s",
            (hashed, email)
        )
        print(f"Updated password for {email}")

    # Commit changes
    con.commit()
    print("\nAll passwords updated successfully!")

except mysql.connector.Error as err:
    print(f"Error: {err}")

finally:
    if cursor:
        cursor.close()
    if con:
        con.close()
