import { useEffect, useState } from "react";
import SearchPage from "./pages/SearchPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import { USE_MOCK } from "./api.js";

const getRoute = () => (window.location.hash === "#/admin" ? "admin" : "search");

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6" />
                <path d="M15 15l5 5" />
              </svg>
            </span>
            ScholarFind
          </a>
          <nav className="nav" aria-label="Main">
            <a href="#/" className={route === "search" ? "active" : ""} aria-current={route === "search" ? "page" : undefined}>
              Search
            </a>
            <a href="#/admin" className={route === "admin" ? "active" : ""} aria-current={route === "admin" ? "page" : undefined}>
              Admin
            </a>
          </nav>
        </div>
      </header>

      <main>{route === "admin" ? <AdminPage /> : <SearchPage />}</main>

      <footer className="footer">
        <span>ScholarFind · UCS531 Cloud Computing project</span>
        {USE_MOCK && <span className="demo-tag">Showing sample data</span>}
      </footer>
    </div>
  );
}
