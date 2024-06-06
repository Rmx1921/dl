import React from 'react';
import './App.css';
import SerialNumberGenerator from './components/SerialNumberGenerator';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <h1>Lottery Ticket Manager</h1> */}
        <SerialNumberGenerator />
      </header>
    </div>
  );
}

export default App;