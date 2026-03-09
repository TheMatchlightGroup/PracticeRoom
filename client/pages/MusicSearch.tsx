import { useState } from "react";

export default function MusicSearch() {
  const [query, setQuery] = useState("");

  const results = [
    "Bach - Prelude in C",
    "Beethoven - Moonlight Sonata",
    "Mozart - Sonata in C",
  ].filter((piece) =>
    piece.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ padding: 40 }}>
      <h1>Music Search</h1>

      <input
        placeholder="Search music..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginTop: 20 }}
      />

      <ul style={{ marginTop: 20 }}>
        {results.map((piece) => (
          <li key={piece}>{piece}</li>
        ))}
      </ul>
    </div>
  );
}
