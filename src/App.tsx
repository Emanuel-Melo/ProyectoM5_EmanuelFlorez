import { useEffect, useState } from "react";

import AppRouter from "./app/router/AppRouter";
import { LoadingScreen } from "./shared/components/LoadingScreen";

function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1800);

    return () => window.clearTimeout(timer);
  }, []);

  if (booting) {
    return <LoadingScreen label="Preparando experiencia" />;
  }

  return <AppRouter />;
}

export default App;
