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
