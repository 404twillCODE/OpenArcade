import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Landing } from "./routes/Landing";
import { Admin } from "./routes/Admin";
import { Play } from "./routes/Play";

function App() {
  const location = useLocation();
  const isPlay = location.pathname === "/play";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {!isPlay && <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/play" element={<Play />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isPlay && <Footer />}
    </div>
  );
}

export default App;
