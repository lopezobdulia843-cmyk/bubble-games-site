from flask import Flask, request, jsonify
from flask_cors import CORS

# 1. SETUP: This starts your server engine
app = Flask(__name__)

# 2. SECURITY: This lets your "Bubble Games" site talk to this server
CORS(app)

# 3. THE WELCOME MAT: This is what you see if you visit the server URL directly
@app.route('/')
def home():
    return "Bubble Games Server is officially online! 🫧"

# 4. THE LOGIN DESK: This is where your login button will send data later
@app.route('/login', methods=['POST'])
def login():
    # Grab the data sent from your website
    data = request.json
    username = data.get('username')
    
    # For now, we'll just say "Hello" to prove it's working!
    # Later, we will add the code here to check a real database.
    return jsonify({
        "status": "success",
        "message": f"Welcome to the game, {username}!"
    })

# 5. START: This keeps the server running
if __name__ == '__main__':
    app.run(debug=True)
