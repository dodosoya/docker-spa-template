docker-spa-template
===
A docker compose template to develop a SPA web application using Node.js, Flask and React.
* Node web API
* Flask web API
* Nginx reverse proxy
* React application

# Set up development environment
## Node web API
### Create package.json
```bash
$ mkdir ./backend-node && vi ./backend-node/package.json
```
```json
{
  "name": "backend-node",
  "version": "1.0.0",
  "description": "Node.js on Docker",
  "author": "Ryan Hsieh",
  "main": "server.js",
  "scripts": {
    "pro": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.17.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.7"
  }
}
```
* Use [express](https://github.com/expressjs/express) to launch a node server
* Use [nodemon](https://github.com/remy/nodemon) to automatically restart the node application when file changes

### Create node server
```bash
$ vi ./backend-node/server.js
```
```javascript
'use strict';
const express = require('express');
const app = express();

const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 5000;

app.get('/api/message', (req, res) => {
  res.json({ 'message': 'Hello, I am from node.' });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
```

### Create Dockerfile
```bash
$ vi ./backend-node/Dockerfile
```
```dockerfile
FROM node:lts-slim
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
# CMD ["npm", "run", "dev"]
```

### Add .dockerignore
```bash
$ vi ./backend-node/.dockerignore
```
```
node_modules
npm-debug.log
```

## Flask web API
### Create requirements.txt
```bash
$ mkdir ./backend-flask && vi ./backend-flask/requirements.txt
```
```
flask
```
* Use [flask](https://github.com/pallets/flask) to launch a server 

### Create flask server
```bash
$ vi ./backend-flask/app.py
```
```python
from flask import Flask, jsonify

app = Flask(__name__)

HOST = '0.0.0.0'
PORT = 5000

@app.route('/api/message')
def message():
  return jsonify({ 'message': 'Hello, I am from flask.' })

if __name__ == '__main__':
  app.run(debug = True, host = HOST, port = PORT)
```

### Create Dockerfile
```bash
$ vi ./backend-flask/Dockerfile
```
```dockerfile
FROM python:3.7-alpine
RUN mkdir -p /app
WORKDIR /app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
EXPOSE 5001
COPY . .
CMD ["flask", "run"]
```

## Set up reverse proxy
Use nginx as reverse proxy
```bash
$ mkdir ./reverse-proxy && vi ./reverse-proxy/nginx.conf
```
```
server {
  listen 8080;
  server_name localhost;

  location /node/ {
    proxy_pass http://backend-node:5000/;
    proxy_set_header Host $host;
  }

  location /flask/ {
    proxy_pass http://backend-flask:5001/;
    proxy_set_header Host $host;
  }
}
```

## React application
### Initialize react application using create-react-app
```bash
$ npx create-react-app frontend-react
```

### Edit App.js to make API calls
```bash
$ vi ./frontend-react/App.js
```
```javascript
import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [data1, setData1] = useState('');
  const [data2, setData2] = useState('');

  useEffect(() => {
    fetch('node/api/message')
      .then(res => res.json())
      .then(data => {
        setData1(data.message);
      });
    fetch('flask/api/message')
      .then(res => res.json())
      .then(data => {
        setData2(data.message);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <p>{data1}</p>
        <p>{data2}</p>
      </header>
    </div>
  );
}

export default App;
```
* Call API from node and flask web API respectively

### Edit package.json
Add proxy and start settings
```bash
$ vi ./frontend-react/package.json
```
```json
{
  "proxy" : "http://reverse-proxy:8080",
  "scripts": {
    "start": "CHOKIDAR_USEPOLLING=true react-scripts start",
  }
}
```

### Create Dockerfile
```bash
$ vi ./frontend-react/Dockerfile
```
```dockerfile
FROM node:lts-slim
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Add .dockerignore
```bash
$ vi ./frontend-react/.dockerignore
```
```
node_modules
```

## Set up docker compose 
### Create docker-compose.yml (base)
```bash
$ vi ./docker-compose.yml
```
```yml
version: "3"
services:
  frontend-react:
    image: dodosoya/spa-demo-frontend-react
    container_name: spa-demo-frontend-react
    build:
      context: ./frontend-react
      dockerfile: Dockerfile
    volumes:
      - ./frontend-react:/app
      - /app/node_modules
      
  backend-node:
    image: dodosoya/spa-demo-backend-node
    container_name: spa-demo-backend-node
    build:
      context: ./backend-node
      dockerfile: Dockerfile
    environment:
      - HOST=0.0.0.0
    volumes:
      - ./backend-node:/app
      - /app/node_modules

  backend-flask:
    image: dodosoya/spa-demo-backend-flask
    container_name: spa-demo-backend-flask
    build:
      context: ./backend-flask
      dockerfile: Dockerfile
    environment: 
      - FLASK_APP=app.py
      - FLASK_RUN_HOST=0.0.0.0
    volumes:
      - ./backend-flask:/app

  reverse-proxy:
    image: nginx:latest
    container_name: spa-demo-reverse-proxy
    depends_on:
      - backend-node
      - backend-flask
    volumes:
      - ./reverse-proxy/nginx.conf:/etc/nginx/conf.d/default.conf
```

### Create docker-compose.override.yml (development)
```bash
$ vi ./docker-compose.override.yml
```
```yml
version: "3"
services:
  frontend-react:
    ports:
      - "3000:3000"
    command: "npm start"
  backend-node:
    environment:
      - NODE_ENV=development
      - PORT=5000
    ports:
      - "5000:5000"
    command: "npm run dev"
  backend-flask:
    environment: 
      - FLASK_ENV=development
      - FLASK_RUN_PORT=5001
    ports:
      - "5001:5001"
    command: "flask run"
  reverse-proxy:
    ports:
      - "8080:8080"
```

## Create and start containers
```
$ docker-compose up
```

## Test 
### Node web API
Make API call
```
$ curl http://localhost:8080/node/api/message
$ curl http://localhost:5000/api/message
```
return
```json
{
  "message": "Hello, I am from node."
}
```

### Flask web API
Make API call
```
$ curl http://localhost:8080/flask/api/message
$ curl http://localhost:5001/api/message
```
return
```json
{
  "message": "Hello, I am from flask."
}
```

### React application
Open browser and go to http://localhost:3000
