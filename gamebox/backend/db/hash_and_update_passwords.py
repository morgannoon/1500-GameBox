import mysql.connector
from werkzeug.security import generate_password_hash

# --- MySQL connection settings ---
MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = "mysqlpassword4life"
MYSQL_DB = "videogamedb"

# --- Employee emails + password ---
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
employee_plain_password = "emp123"

# --- Customer emails + password ---
customer_emails = [
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
customer_plain_password = "pass123"

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

    # --- Generate hashes ---
    employee_hash = generate_password_hash(employee_plain_password)
    customer_hash = generate_password_hash(customer_plain_password)

    print(f"Employee password hash: {employee_hash[:30]}...")
    print(f"Customer password hash: {customer_hash[:30]}...")

    # --- Update Employees ---
    for email in employee_emails:
        cursor.execute(
            "UPDATE Employee SET password=%s WHERE business_email=%s",
            (employee_hash, email)
        )
        print(f"Updated Employee: {email}")

    # --- Update Customers ---
    for email in customer_emails:
        cursor.execute(
            "UPDATE Customer SET password=%s WHERE email=%s",
            (customer_hash, email)
        )
        print(f"Updated Customer: {email}")

    # Commit everything
    con.commit()
    print("\nAll employee and customer passwords updated successfully!")

except mysql.connector.Error as err:
    print(f"Error: {err}")

finally:
    if cursor:
        cursor.close()
    if con:
        con.close()
