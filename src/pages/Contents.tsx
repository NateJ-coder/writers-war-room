import { Character, Place, Event } from '../types';

const Contents = () => {
  const characters: Character[] = [
    { name: "Lieutenant Colonel Ezekial Alaric", description: "The stoic, battle-hardened commander..." },
    { name: "Pippin", description: "A sentient, talking mouse..." },
    { name: "Private Keller", description: "A young, eager soldier..." },
    { name: "The Vampire", description: "A mysterious, ancient being..." }
  ];

  const places: Place[] = [
    { name: "The War-Room", description: "The strategic heart of the military base..." },
    { name: "The Trenches", description: "Muddy, dangerous front lines..." },
    { name: "The Vampire's Lair", description: "An ancient, forgotten crypt..." }
  ];

  const events: Event[] = [
    { name: "The First Encounter", description: "When Pippin first meets Alaric..." },
    { name: "The Battle of Crimson Ridge", description: "A decisive confrontation..." },
    { name: "The Revelation", description: "The truth about the war is revealed..." }
  ];

  return (
    <div className="contents-container">
      <section className="contents-section">
        <h2>🎭 Characters</h2>
        <div className="contents-grid">
          {characters.map((char, idx) => (
            <div key={idx} className="contents-card">
              <h3>{char.name}</h3>
              <p>{char.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="contents-section">
        <h2>🏰 Places</h2>
        <div className="contents-grid">
          {places.map((place, idx) => (
            <div key={idx} className="contents-card">
              <h3>{place.name}</h3>
              <p>{place.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="contents-section">
        <h2>⚡ Events</h2>
        <div className="contents-grid">
          {events.map((event, idx) => (
            <div key={idx} className="contents-card">
              <h3>{event.name}</h3>
              <p>{event.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Contents;
