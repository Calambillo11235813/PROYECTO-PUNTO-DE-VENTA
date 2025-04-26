import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import Inventario from './pages/Inventario/Inventario.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Inventario" element={<Inventario />} />
      </Routes>
    </Router>
  );
}

export default App;


