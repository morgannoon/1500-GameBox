import mysql.connector
from werkzeug.security import generate_password_hash

# --- MySQL connection settings ---
MYSQL_HOST = "127.0.0.1"# Or your Docker service name if applicable
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = "mysqlpassword4life"
MYSQL_DB = "videogamedb"

# --- Employee emails and plain password ---
employee_emails = [
    "tom.hanks@gamebox.com",
    "sara.connor@gamebox.com",
    "mike.tyson@gamebox.com",
    "linda.lee@gamebox.com",
    "james.bond@gamebox.com",
    "rachel.green@gamebox.com",
    "ross.geller@gamebox.com",
    "monica.geller@gamebox.com",
    "chandler.bing@gamebox.com",
    "phoebe.buffay@gamebox.com"
]

plain_employee_password = "emp123"

# --- Connect to MySQL ---
con = None
cursor = None
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

    # --- Generate hash once for efficiency ---
    hashed_password = generate_password_hash(plain_employee_password)
    print(f"Generated hash for password '{plain_employee_password}': {hashed_password[:30]}...")

    # --- Update each employee ---
    for email in employee_emails:
        # NOTE: We assume the email is stored in the 'business_email' column for employees
        cursor.execute(
            "UPDATE Employee SET password=%s WHERE business_email=%s",
            (hashed_password, email)
        )
        print(f"Updated password for employee {email}")

    # Commit changes
    con.commit()
    print("\nAll employee passwords updated successfully!")

except mysql.connector.Error as err:
    print(f"Error updating employee passwords: {err}")

finally:
    if cursor:
        cursor.close()
    if con:
        con.close()