from flask import Flask, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # This keeps the "handshake" open for your school device!

# This route tells the brain: "When someone visits, show them the index.html"
@app.route('/')
def home():
    return render_template('index.html')

# This is your existing "status" check, but we moved it to /status
@app.route('/status')
def status():
    return "Bubble Games Server is officially online! 🫧"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
