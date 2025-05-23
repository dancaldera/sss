// src/App.tsx

import { useState, useEffect } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
// import honoLogo from "./assets/hono.svg";
import "./App.css";

function App() {
  const [pepper, setPepper] = useState("");
  const [word, setWord] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });

  // Track if user has started typing to avoid showing empty results initially
  const [hasInteracted, setHasInteracted] = useState(false);

  // Handle input changes
  const handlePepperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasInteracted) setHasInteracted(true);
    setPepper(e.target.value);
  };

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasInteracted) setHasInteracted(true);
    setWord(e.target.value);
  };

  // Effect to generate password when inputs change
  useEffect(() => {
    // Only run if user has interacted with the form
    if (!hasInteracted) return;
    
    // Reset password if either field is empty
    if (!pepper || !word) {
      setPassword("");
      return;
    }

    // Don't generate if inputs are too short
    if (pepper.length < 3 || word.length < 3) {
      return;
    }

    const generatePassword = async () => {
      try {
        setLoading(true);
        setError("");

        // Use the new POST API endpoint with JSON payload
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pepper,
            word
          })
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        setPassword(data.password);
        
        // Optional: you could store the additional security info here if needed
        // const { salt, iterations, hash, rawHash } = data;
        // console.log('Security info:', { salt, iterations, hash, rawHash });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent too many requests while typing
    const debounceTimer = setTimeout(() => {
      generatePassword();
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [pepper, word, hasInteracted]);

  return (
    <div>
      {toast.visible && (
        <div className="toast success">{toast.message}</div>
      )}
      <h1>Password Generator</h1>

      <div>
        <div className="input-group">
          <label htmlFor="pepper">Master Password:</label>
          <input
            type="password"
            id="pepper"
            value={pepper}
            onChange={handlePepperChange}
            placeholder="Enter a master password"
          />
        </div>

        <div className="input-group">
          <label htmlFor="word">Base Word:</label>
          <input
            type="text"
            id="word"
            value={word}
            onChange={handleWordChange}
            placeholder="Enter a base word"
          />
        </div>

        {loading && <div>Generating...</div>}

        {error && <div className="error-message">{error}</div>}

        {password && (
          <div className="password-result">
            <h3>Generated Password:</h3>
            <div className="password-value">{password}</div>
            <button
              onClick={() => {
                // Copy to clipboard
                navigator.clipboard.writeText(password);
                
                // Show toast notification
                setToast({ visible: true, message: "Password copied!" });
                
                // Add a class to the button for visual feedback
                const button = document.querySelector('.copy-button') as HTMLElement;
                if (button) {
                  button.classList.add('copied');
                  button.innerText = 'Copied!';
                  
                  // Reset button after animation
                  setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerText = 'Copy to Clipboard';
                  }, 1500);
                }
                
                // Automatically hide the toast after 3 seconds
                setTimeout(() => {
                  setToast({ visible: false, message: "" });
                }, 3000);
              }}
              className="copy-button"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
      </div>

      {/* <footer className="logos">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo" alt="React logo" />
        </a>
        <a href="https://hono.dev/" target="_blank" rel="noreferrer">
          <img src={honoLogo} className="logo" alt="Hono logo" />
        </a>
        <a
          href="https://workers.cloudflare.com/"
          target="_blank"
          rel="noreferrer"
        >
          <img src={cloudflareLogo} className="logo" alt="Cloudflare logo" />
        </a>
      </footer> */}
    </div>
  );
}

export default App;
