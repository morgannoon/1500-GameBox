from flask import Flask, jsonify
import mysql.connector

app = Flask(__name__)

#checking to make sure running okay
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "working"})

#getting tables from videogamedb
@app.route('/getTables', methods=['GET'])
def get_tables():
    con = mysql.connector.connect(
        host='localhost',
        user='root',
        password='mysqlpassword4life',
        database='videogamedb'
    )
    cursor = con.cursor()
    cursor.execute("SHOW TABLES;")
    tables=cursor.fetchall()
    cursor.close()
    con.close()
    print(tables)
    table_names = [table[0] for table in tables]
    return jsonify({"tables": table_names}), 200

if __name__ == "__main__":
    print("connecting to DB...")
    app.run(debug=True)
