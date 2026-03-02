import "./App.css";
import { Route, Routes } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home coming soon....</div>} />
      <Route path="/cart" element={<div>Cart coming soon....</div>} />
      <Route path="/collection" element={<div>Collect coming soon....</div>} />
    </Routes>
  );
}

export default App;
