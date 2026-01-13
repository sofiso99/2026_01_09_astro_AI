import React, { useState, useEffect } from "react";
import BirthMatchForm from "./BirthMatchForm.jsx"
import "./styles.css"

export default function App() {
  const [result, setResult] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  function handleResult(data) {
    setResult(data);
    setResultOpen(true);
    setSubmittedOnce(true);
  }

  function closeResult() {
    setResultOpen(false);
  }

  return (
    <div className="page">
      <div className={`layout ${submittedOnce ? "shifted" : ""}`}>
        <div className="card">
          <div className="titleBlock">
            <h1 className="title">Discover Your Zodiac Match</h1>
            <p className="subtitle">
              Enter your birth info — we'll calculate your sign and generate your best places.
            </p>
          </div>

          <BirthMatchForm onResult={handleResult} />
        </div>

        {/* Result box (shows after submit) */}
        {resultOpen && (
          <div className="resultCard" role="dialog" aria-modal="true">
            <button className="closeBtn" onClick={closeResult} aria-label="Close result">
              ×
            </button>

            <h2 className="resultTitle">Your Result</h2>

            {/* If backend returns { user: {...}, astroData: {...}, openAiRaw: ... } */}
            <div className="resultBody">
              {result?.user ? (
                <>
                  <div className="resultRow">
                    <span className="label">Name</span>
                    <span className="value">{result.user.username}</span>
                  </div>

                  <div className="resultRow">
                    <span className="label">Zodiac</span>
                    <span className="value">{result.user.zodiac_sign ?? "—"}</span>
                  </div>

                  <div className="resultRow">
                    <span className="label">Age</span>
                    <span className="value">
                      {typeof result.user.age === "number" ? result.user.age : "—"}
                    </span>
                  </div>

                  <div className="divider" />

                  <div className="label" style={{ marginBottom: 8 }}>
                    Best Locations
                  </div>

                  {Array.isArray(result.user.best_locations) && result.user.best_locations.length ? (
                    <ul className="locations">
                      {result.user.best_locations.map((loc, idx) => (
                        <li key={`${loc}-${idx}`}>{loc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No locations returned.</p>
                  )}
                </>
              ) : (
                <p className="muted">
                  No result yet. (If you’re seeing this after submit, check the backend response shape.)
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )}



  


