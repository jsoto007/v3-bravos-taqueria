import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [user , setUser] = useState([])

  useEffect(() => {
    fetch("/api/birds").then((r) => {
      if (r.ok) {
        r.json().then((user) => setUser(user));
      }
    });
  }, []);

  console.log("Logging User", user)

  return (
    <div>
      <h1>Hello from Vite</h1>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      {user.length > 0 && (
        <ul>
          {user.map((bird, index) => (
            <li key={index}>{bird.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
