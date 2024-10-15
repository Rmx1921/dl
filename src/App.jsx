import React, { useEffect } from 'react';
import { Routes, Route,useNavigate} from 'react-router-dom';
import SerialNumberGenerator from './components/SerialNumberGenerator';
import BillDetails from './components/BillDetails';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    window.electronAPI.onOpenBillsPage(() => {
      navigate('/bills');
    });
    return () => {
      window.electronAPI.removeAllListeners('open-bills-page');
    };
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