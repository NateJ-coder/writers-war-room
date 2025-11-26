import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

// Initialize default content if not exists
if (!localStorage.getItem('characters-data')) {
  localStorage.setItem('characters-data', JSON.stringify([
    { name: "Lieutenant Colonel Ezekial Alaric", description: "The stoic, battle-hardened commander..." },
    { name: "Pippin", description: "A sentient, talking mouse..." },
    { name: "Private Keller", description: "A young, eager soldier..." },
    { name: "The Vampire", description: "A mysterious, ancient being..." }
  ]));
}

if (!localStorage.getItem('places-data')) {
  localStorage.setItem('places-data', JSON.stringify([
    { name: "The War-Room", description: "The strategic heart of the military base..." },
    { name: "The Trenches", description: "Muddy, dangerous front lines..." },
    { name: "The Vampire's Lair", description: "An ancient, forgotten crypt..." }
  ]));
}

if (!localStorage.getItem('events-data')) {
  localStorage.setItem('events-data', JSON.stringify([
    { name: "The First Encounter", description: "When Pippin first meets Alaric..." },
    { name: "The Battle of Crimson Ridge", description: "A decisive confrontation..." },
    { name: "The Revelation", description: "The truth about the war is revealed..." }
  ]));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
