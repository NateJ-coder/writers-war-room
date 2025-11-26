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
      <section className="content-section">
        <h2>🎭 Characters</h2>
        <ul>
          {characters.map((char, idx) => (
            <li key={idx}>
              <strong>{char.name}</strong> - {char.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="content-section">
        <h2>🏰 Places</h2>
        <ul>
          {places.map((place, idx) => (
            <li key={idx}>
              <strong>{place.name}</strong> - {place.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="content-section">
        <h2>⚡ Events</h2>
        <ul>
          {events.map((event, idx) => (
            <li key={idx}>
              <strong>{event.name}</strong> - {event.description}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Contents;
