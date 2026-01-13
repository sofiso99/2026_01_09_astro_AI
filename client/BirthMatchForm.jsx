import React, { useState } from "react";

export default function BirthMatchForm({ onResult }) {
  const [username, setUsername] = useState("");

  // Backend enum is: 'man' | 'woman' | 'any'
  const [matchPreference, setMatchPreference] = useState("any");
  const [birthdate, setBirthdate] = useState("");

  // Send as "HH:MM" from <input type="time"> 
  const [birthtime, setBirthtime] = useState("");
  const [birthtimeUnknown, setBirthtimeUnknown] = useState(true);

  const [birthplace, setBirthplace] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    // Basic validation (match backend requirements)
    if (!username.trim()) return setErrorMsg("Please enter your name.");
    if (!birthdate) return setErrorMsg("Please enter your birthdate.");
    if (!birthplace.trim()) return setErrorMsg("Please enter your birthplace.");
    if (!currentLocation.trim())
      return setErrorMsg("Please enter your current location.");

    // Backend requires birthtime to exist:
    // - if unknown => "unknown"
    // - else => "HH:MM"
    const normalizedBirthtime = birthtimeUnknown ? "unknown" : birthtime;

    if (!birthtimeUnknown && !/^\d{2}:\d{2}$/.test(normalizedBirthtime || "")) {
      return setErrorMsg("Birth time must be a valid time (HH:MM) or select Unknown.");
    }

    
    const payload = {
      username: username.trim(),
      birthdate, // "YYYY-MM-DD"
      birthtime: normalizedBirthtime, 
      birthplace: birthplace.trim(),
      current_location: currentLocation.trim(),
      match_preference: matchPreference, 
    };

    try {
      setLoading(true);

      const res = await fetch("/api/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // backend returns { err: "..." } on errors
      const text = await res.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        ///
      }

      if (!res.ok) {
        const msg = data?.err || data?.error || text || "Request failed.";
        throw new Error(msg);
      }

      // Success response shape:
      onResult?.(data);
    } catch (err) {
      setErrorMsg(err?.message || "Request failed. Check server console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {errorMsg && <div className="errorBanner">{errorMsg}</div>}

      <label className="label">
        Name (initial or nickname)
        <input
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g., karl"
        />
      </label>

      <div className="label">
        I prefer
        <div className="pillRow">
          <label className="pill">
            <input
              type="radio"
              name="matchPreference"
              checked={matchPreference === "man"}
              onChange={() => setMatchPreference("man")}
            />
            Men
          </label>

          <label className="pill">
            <input
              type="radio"
              name="matchPreference"
              checked={matchPreference === "woman"}
              onChange={() => setMatchPreference("woman")}
            />
            Women
          </label>

          <label className="pill">
            <input
              type="radio"
              name="matchPreference"
              checked={matchPreference === "any"}
              onChange={() => setMatchPreference("any")}
            />
            Any
          </label>
        </div>
      </div>

      <div className="row2">
        <label className="label">
          Birthdate
          <input
            className="input"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </label>

        <label className="label">
          Birth time
          <input
            className="input"
            type="time"
            value={birthtime}
            onChange={(e) => setBirthtime(e.target.value)}
            disabled={birthtimeUnknown}
          />
          <div className="checkboxRow">
            <input
              type="checkbox"
              checked={birthtimeUnknown}
              onChange={(e) => {
                const checked = e.target.checked;
                setBirthtimeUnknown(checked);
                if (checked) setBirthtime("");
              }}
            />
            <span>Unknown</span>
          </div>
        </label>
      </div>

      <label className="label">
        Birthplace (city, country)
        <input
          className="input"
          value={birthplace}
          onChange={(e) => setBirthplace(e.target.value)}
          placeholder="e.g., Accra, Ghana"
        />
      </label>

      <label className="label">
        Current location (city, country)
        <input
          className="input"
          value={currentLocation}
          onChange={(e) => setCurrentLocation(e.target.value)}
          placeholder="e.g., Rochester, United States"
        />
      </label>

      <button className="submitBtn" type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
