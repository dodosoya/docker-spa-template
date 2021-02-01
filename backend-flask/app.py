from flask import Flask, jsonify

app = Flask(__name__)

HOST = '0.0.0.0'
PORT = 5000

@app.route('/api/message')
def message():
  return jsonify({ 'message': 'Hello, I am from flask.' })

if __name__ == '__main__':
  app.run(debug = True, host = HOST, port = PORT)
