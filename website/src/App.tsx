import { useLocation, useRoutes } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import Layout from "./components/Layout";
import PageTransition from "./components/PageTransition";
import AppMotionConfig from "./components/MotionConfig";
import Home from "./pages/Home";
import Host from "./pages/Host";
import Play from "./pages/Play";
import Contribute from "./pages/Contribute";
import Games from "./pages/Games";

const routes = [
  { path: "/", element: <Home /> },
  { path: "/host", element: <Host /> },
  { path: "/play", element: <Play /> },
  { path: "/contribute", element: <Contribute /> },
  { path: "/games", element: <Games /> },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  const element = useRoutes(routes);

  return (
    <AppMotionConfig>
      <Layout>
        <ScrollToTop />
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {element}
          </PageTransition>
        </AnimatePresence>
      </Layout>
    </AppMotionConfig>
  );
}

export default App;
