import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import CEJ from './components/CEJ';


function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente" />} /> {/* Redirige a login */}
        <Route path="/cliente" element={<CEJ />} />
      </Routes>
    </Router>
  )
}

export default App
