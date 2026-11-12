import { useState } from "react";
import logo from "./assets/vpro-skills-logo.jpeg";
import Home from "./pages/Home";
import Ask from "./pages/Ask";
import Library from "./pages/Library";
import Admin from "./pages/Admin";
import ChatWidget from "./components/ChatWidget";

const YEAR = 2026;

const LINKS = [
  { id: "home", label: "Home" },
  { id: "ask", label: "Ask AI" },
  { id: "library", label: "Library" },
];

function readAdmin() {
  try {
    return sessionStorage.getItem("vpro-admin") === "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(readAdmin);

  function go(id) {
    setPage(id);
    window.scrollTo({ top: 0 });
  }

  function signIn() {
    try {
      sessionStorage.setItem("vpro-admin", "1");
    } catch {
      /* session storage unavailable */
    }
    setIsAdmin(true);
  }

  function signOut() {
    try {
      sessionStorage.removeItem("vpro-admin");
    } catch {
      /* session storage unavailable */
    }
    setIsAdmin(false);
    go("home");
  }

  return (
    <div className="app">
      <header className="nav">
        <div className="nav-inner">
          <button className="nav-brand" onClick={() => go("home")} aria-label="VPRO Skills home">
            <img src={logo} alt="VPRO Skills" />
          </button>
          <nav className="nav-links" aria-label="Main">
            {LINKS.map((link) => (
              <button
                key={link.id}
                className={page === link.id ? "active" : ""}
                onClick={() => go(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="nav-actions">
            {isAdmin && (
              <button className="btn btn-ghost" onClick={signOut}>
                Sign out
              </button>
            )}
            <button
              className={`btn ${page === "admin" ? "btn-dark" : "btn-outline"}`}
              onClick={() => go("admin")}
            >
              {isAdmin ? "Admin dashboard" : "Admin sign in"}
            </button>
          </div>
        </div>
      </header>

      <main>
        {page === "home" && <Home go={go} />}
        {page === "ask" && <Ask />}
        {page === "library" && <Library />}
        {page === "admin" && <Admin isAdmin={isAdmin} onSignIn={signIn} />}
      </main>

      {page !== "ask" && <ChatWidget onOpenFull={() => go("ask")} />}

      {page !== "ask" && (
        <footer className="footer">
          <img src={logo} alt="VPRO Skills" />
          <span>© {YEAR} VPRO Skills EduTech</span>
        </footer>
      )}
    </div>
  );
}
