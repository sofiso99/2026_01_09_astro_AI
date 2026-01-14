// import React, { useState } from "react";

// export default function BirthMatchForm({ onResult }) {
//   const [username, setUsername] = useState("");

//   // Backend enum is: 'man' | 'woman' | 'any'
//   const [matchPreference, setMatchPreference] = useState("any");
//   const [birthdate, setBirthdate] = useState("");

//   // Send as "HH:MM" from <input type="time"> 
//   const [birthtime, setBirthtime] = useState("");
//   const [birthtimeUnknown, setBirthtimeUnknown] = useState(true);

//   const [birthplace, setBirthplace] = useState("");
//   const [currentLocation, setCurrentLocation] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setErrorMsg("");

//     // Basic validation (match backend requirements)
//     if (!username.trim()) return setErrorMsg("Please enter your name.");
//     if (!birthdate) return setErrorMsg("Please enter your birthdate.");
//     if (!birthplace.trim()) return setErrorMsg("Please enter your birthplace.");
//     if (!currentLocation.trim())
//       return setErrorMsg("Please enter your current location.");

//     // Backend requires birthtime to exist:
//     // - if unknown => "unknown"
//     // - else => "HH:MM"
//     const normalizedBirthtime = birthtimeUnknown ? "unknown" : birthtime;

//     if (!birthtimeUnknown && !/^\d{2}:\d{2}$/.test(normalizedBirthtime || "")) {
//       return setErrorMsg("Birth time must be a valid time (HH:MM) or select Unknown.");
//     }

    
//     const payload = {
//       username: username.trim(),
//       birthdate, // "YYYY-MM-DD"
//       birthtime: normalizedBirthtime, 
//       birthplace: birthplace.trim(),
//       current_location: currentLocation.trim(),
//       match_preference: matchPreference, 
//     };

//     try {
//       setLoading(true);

//       const res = await fetch("/api/createUser", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       // backend returns { err: "..." } on errors
//       const text = await res.text();
//       let data = null;

//       try {
//         data = text ? JSON.parse(text) : null;
//       } catch {
//         ///
//       }

//       if (!res.ok) {
//         const msg = data?.err || data?.error || text || "Request failed.";
//         throw new Error(msg);
//       }

//       // Success response shape:
//       onResult?.(data);
//     } catch (err) {
//       setErrorMsg(err?.message || "Request failed. Check server console.");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="form">
//       {errorMsg && <div className="errorBanner">{errorMsg}</div>}

//       <label className="label">
//         Name (initial or nickname)
//         <input
//           className="input"
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//           placeholder="e.g., karl"
//         />
//       </label>

//       <div className="label">
//         I prefer
//         <div className="pillRow">
//           <label className="pill">
//             <input
//               type="radio"
//               name="matchPreference"
//               checked={matchPreference === "man"}
//               onChange={() => setMatchPreference("man")}
//             />
//             Men
//           </label>

//           <label className="pill">
//             <input
//               type="radio"
//               name="matchPreference"
//               checked={matchPreference === "woman"}
//               onChange={() => setMatchPreference("woman")}
//             />
//             Women
//           </label>

//           <label className="pill">
//             <input
//               type="radio"
//               name="matchPreference"
//               checked={matchPreference === "any"}
//               onChange={() => setMatchPreference("any")}
//             />
//             Any
//           </label>
//         </div>
//       </div>

//       <div className="row2">
//         <label className="label">
//           Birthdate
//           <input
//             className="input"
//             type="date"
//             value={birthdate}
//             onChange={(e) => setBirthdate(e.target.value)}
//           />
//         </label>

//         <label className="label">
//           Birth time
//           <input
//             className="input"
//             type="time"
//             value={birthtime}
//             onChange={(e) => setBirthtime(e.target.value)}
//             disabled={birthtimeUnknown}
//           />
//           <div className="checkboxRow">
//             <input
//               type="checkbox"
//               checked={birthtimeUnknown}
//               onChange={(e) => {
//                 const checked = e.target.checked;
//                 setBirthtimeUnknown(checked);
//                 if (checked) setBirthtime("");
//               }}
//             />
//             <span>Unknown</span>
//           </div>
//         </label>
//       </div>

//       <label className="label">
//         Birthplace (city, country)
//         <input
//           className="input"
//           value={birthplace}
//           onChange={(e) => setBirthplace(e.target.value)}
//           placeholder="e.g., Accra, Ghana"
//         />
//       </label>

//       <label className="label">
//         Current location (city, country)
//         <input
//           className="input"
//           value={currentLocation}
//           onChange={(e) => setCurrentLocation(e.target.value)}
//           placeholder="e.g., Rochester, United States"
//         />
//       </label>

//       <button className="submitBtn" type="submit" disabled={loading}>
//         {loading ? "Sending..." : "Send"}
//       </button>
//     </form>
//   );
// }


import React, { useEffect, useMemo, useRef, useState } from "react";

export default function BirthMatchForm({ onResult }) {
  const [username, setUsername] = useState("");

  // Backend enum: 'man' | 'woman' | 'any'
  const [matchPreference, setMatchPreference] = useState("any");
  const [birthdate, setBirthdate] = useState("");

  // birthtime must be "unknown" OR "HH:MM"
  const [birthtime, setBirthtime] = useState("");
  const [birthtimeUnknown, setBirthtimeUnknown] = useState(true);

  // Inputs
  const [birthplace, setBirthplace] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  // Suggestions
  const [birthplaceSuggestions, setBirthplaceSuggestions] = useState([]);
  const [currentSuggestions, setCurrentSuggestions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // "birthplace" | "current" | null

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Debounce + abort controllers
  const birthTimer = useRef(null);
  const currentTimer = useRef(null);
  const birthAbort = useRef(null);
  const currentAbort = useRef(null);

  // Close dropdown when clicking outside
  const formRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (!formRef.current) return;
      if (!formRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function fetchGeocode(q, signal) {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  }

  // Birthplace autocomplete
  useEffect(() => {
    const q = birthplace.trim();
    if (birthTimer.current) clearTimeout(birthTimer.current);

    // Clear if too short
    if (q.length < 3) {
      setBirthplaceSuggestions([]);
      return;
    }

    birthTimer.current = setTimeout(async () => {
      try {
        if (birthAbort.current) birthAbort.current.abort();
        birthAbort.current = new AbortController();

        const results = await fetchGeocode(q, birthAbort.current.signal);
        setBirthplaceSuggestions(results);
      } catch (e) {
        // Ignore abort errors; clear on other errors
        if (String(e?.name) !== "AbortError") setBirthplaceSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(birthTimer.current);
  }, [birthplace]);

  // Current location autocomplete
  useEffect(() => {
    const q = currentLocation.trim();
    if (currentTimer.current) clearTimeout(currentTimer.current);

    if (q.length < 3) {
      setCurrentSuggestions([]);
      return;
    }

    currentTimer.current = setTimeout(async () => {
      try {
        if (currentAbort.current) currentAbort.current.abort();
        currentAbort.current = new AbortController();

        const results = await fetchGeocode(q, currentAbort.current.signal);
        setCurrentSuggestions(results);
      } catch (e) {
        if (String(e?.name) !== "AbortError") setCurrentSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(currentTimer.current);
  }, [currentLocation]);

  function pickBirthplace(item) {
    setBirthplace(item.displayName);
    setBirthplaceSuggestions([]);
    setActiveDropdown(null);
  }

  function pickCurrent(item) {
    setCurrentLocation(item.displayName);
    setCurrentSuggestions([]);
    setActiveDropdown(null);
  }

  const normalizedBirthtime = useMemo(() => {
    return birthtimeUnknown ? "unknown" : birthtime;
  }, [birthtimeUnknown, birthtime]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim()) return setErrorMsg("Please enter your name.");
    if (!birthdate) return setErrorMsg("Please enter your birthdate.");
    if (!birthplace.trim()) return setErrorMsg("Please enter your birthplace.");
    if (!currentLocation.trim()) return setErrorMsg("Please enter your current location.");

    if (!birthtimeUnknown && !/^\d{2}:\d{2}$/.test(normalizedBirthtime || "")) {
      return setErrorMsg("Birth time must be a valid time (HH:MM) or select Unknown.");
    }

    const payload = {
      username: username.trim(),
      birthdate, // YYYY-MM-DD
      birthtime: normalizedBirthtime, // "unknown" OR "HH:MM"
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

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {}

      if (!res.ok) {
        const msg = data?.err || data?.error || text || "Request failed.";
        throw new Error(msg);
      }

      onResult?.(data);
    } catch (err) {
      setErrorMsg(err?.message || "Request failed. Check server console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form">
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

      {/* Birthplace with dropdown */}
      <div className="fieldWrap">
        <label className="label">
          Birthplace (city, country)
          <input
            className="input"
            value={birthplace}
            onChange={(e) => {
              setBirthplace(e.target.value);
              setActiveDropdown("birthplace");
            }}
            onFocus={() => setActiveDropdown("birthplace")}
            placeholder="e.g., Accra, Ghana"
          />
        </label>

        {activeDropdown === "birthplace" && birthplaceSuggestions.length > 0 && (
          <div className="suggestions">
            {birthplaceSuggestions.map((s, idx) => (
              <button
                key={`${s.displayName}-${idx}`}
                type="button"
                className="suggestionItem"
                onClick={() => pickBirthplace(s)}
              >
                <span className="suggestMain">{s.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current location with dropdown */}
      <div className="fieldWrap">
        <label className="label">
          Current location (city, country)
          <input
            className="input"
            value={currentLocation}
            onChange={(e) => {
              setCurrentLocation(e.target.value);
              setActiveDropdown("current");
            }}
            onFocus={() => setActiveDropdown("current")}
            placeholder="e.g., Rochester, United States"
          />
        </label>

        {activeDropdown === "current" && currentSuggestions.length > 0 && (
          <div className="suggestions">
            {currentSuggestions.map((s, idx) => (
              <button
                key={`${s.displayName}-${idx}`}
                type="button"
                className="suggestionItem"
                onClick={() => pickCurrent(s)}
              >
                <span className="suggestMain">{s.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button className="submitBtn" type="submit" disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
