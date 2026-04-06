import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Post from "./pages/Post";
import Layout from "./components/Layout";
import { usePageTracking } from "./hooks/usePageTracking";
import { SidebarProvider } from "./context/SidebarContext";

function App() {
  usePageTracking();

  return (
    <SidebarProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<Post />} />
        </Routes>
      </Layout>
    </SidebarProvider>
  );
}

export default App;
