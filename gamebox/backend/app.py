from flask import Flask, jsonify
from flask_cors import CORS
from datetime.datetime import now
import os
from dotenv import dotenv

app = Flask(__name__)
CORS(app)

#idk how to use the cursor but you may need to add a user
#during initialization

@app.route('/api/endpoint', methods=['GET'])
def example():
    return ({"Time": now(), "Server": "Flask"}), 200



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)