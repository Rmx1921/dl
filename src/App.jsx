import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import SerialNumberGenerator from './components/SerialNumberGenerator';
import BillDetails from './components/BillDetails';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onOpenBillsPage) {
      try {
        window.electronAPI.onOpenBillsPage(() => {
          navigate('/bills');
        });

        return () => {
          if (window.electronAPI.removeAllListeners) {
            window.electronAPI.removeAllListeners('open-bills-page');
          }
        };
      } catch (error) {
        console.error('Error setting up electron event listener:', error);
      }
    }
  }, [navigate]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SerialNumberGenerator />} />
        <Route path="/bills" element={<BillDetails />} />
      </Routes>
    </div>
  );
}

export default App;