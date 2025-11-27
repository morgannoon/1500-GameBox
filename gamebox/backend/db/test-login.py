import requests
import json

# The URL for your running Flask server
BASE_URL = 'http://localhost:5000/api'

# Test Credentials
TEST_EMAIL = "alice@example.com"
TEST_PASSWORD = "password123"

# --- Test Login ---
print("--- Testing Login ---")
login_url = f"{BASE_URL}/login"
login_data = {
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD
}

try:
    # We need to save the session object to handle cookies
    s = requests.Session()
    login_response = s.post(login_url, json=login_data)
    
    print(f"Login Status: {login_response.status_code}")
    print(f"Login Response: {json.dumps(login_response.json(), indent=2)}")

    if login_response.status_code == 200:
        print("\n✅ Login Successful! Checking Auth...")

        # --- Test Check Auth using the session cookies ---
        auth_response = s.get(f"{BASE_URL}/check-auth")
        print(f"Auth Status: {auth_response.status_code}")
        print(f"Auth Response: {json.dumps(auth_response.json(), indent=2)}")

    else:
        print("\n❌ Login Failed. Check Flask terminal for errors.")

except requests.exceptions.ConnectionError:
    print("\n❌ CONNECTION ERROR: Ensure your Flask server is running on port 5000.")