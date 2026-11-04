
import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setBackendStatus("Connected");
        setMessage(data.message);
      })
      .catch(() => {
        setBackendStatus("Disconnected");
        setMessage("Unable to connect to FastAPI");
      });
  }, []);

  return (
    <div className="container">
      <h1>VPRO AI Agent Platform</h1>

      <p>Agentic AI Chatbot Development</p>

      <div className="status-card">
        <h2>Backend Connection</h2>

        <h3 className={
          backendStatus === "Connected" ? "success" :
          backendStatus === "Disconnected" ? "error" : ""
        }>
          {backendStatus}
        </h3>

        <p>{message}</p>
      </div>

      <p className="footer">
        React + FastAPI Integration
      </p>
    </div>
  );
}

export default App;
