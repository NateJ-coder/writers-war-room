import { OutlineSection } from '../types';

const Outline = () => {
  const outlineData: OutlineSection[] = [
    {
      title: "Act I: The Gathering Storm",
      description: "Introduction to the war-torn world and the unlikely partnership between Alaric and Pippin.",
      chapters: [
        { number: 1, title: "The War-Room", summary: "Alaric receives troubling news..." },
        { number: 2, title: "The Mouse in the Map", summary: "Pippin appears, offering cryptic warnings..." },
        { number: 3, title: "Unlikely Allies", summary: "A tentative alliance forms..." }
      ]
    },
    {
      title: "Act II: Into the Shadows",
      description: "The team ventures into enemy territory, uncovering dark secrets.",
      chapters: [
        { number: 4, title: "The Trenches", summary: "Frontline horrors and moral dilemmas..." },
        { number: 5, title: "Whispers in the Dark", summary: "Strange occurrences plague the soldiers..." },
        { number: 6, title: "The Vampire's Trail", summary: "Evidence of supernatural involvement..." }
      ]
    },
    {
      title: "Act III: The Vampire's Game",
      description: "A confrontation with the ancient vampire reveals the true nature of the war.",
      chapters: [
        { number: 7, title: "The Lair", summary: "Descending into the vampire's domain..." },
        { number: 8, title: "Revelations", summary: "The vampire's true motives are unveiled..." },
        { number: 9, title: "Bargain or Battle?", summary: "A crucial decision must be made..." }
      ]
    },
    {
      title: "Act IV: The Price of Victory",
      description: "The consequences of choices made, and the sacrifices required.",
      chapters: [
        { number: 10, title: "Betrayal", summary: "Someone close turns against the team..." },
        { number: 11, title: "The Siege", summary: "The war reaches its climax..." },
        { number: 12, title: "Pippin's Secret", summary: "The mouse's true nature is revealed..." }
      ]
    },
    {
      title: "Act V: Dawn After Darkness",
      description: "The aftermath of war and the rebuilding of a shattered world.",
      chapters: [
        { number: 13, title: "The Ruins", summary: "Surveying the destruction..." },
        { number: 14, title: "A New Order", summary: "Establishing peace in a changed world..." },
        { number: 15, title: "Farewells", summary: "Parting ways, forever changed..." }
      ]
    },
    {
      title: "Interlude: The Watcher",
      description: "A mysterious observer's perspective on the unfolding events.",
      chapters: [
        { number: 16, title: "From the Shadows", summary: "An unseen entity records history..." }
      ]
    },
    {
      title: "Part VI: Echoes of the Past",
      description: "Flashbacks revealing the origins of the conflict.",
      chapters: [
        { number: 17, title: "Before the War", summary: "Alaric's past comes to light..." },
        { number: 18, title: "The Vampire's Origin", summary: "An ancient tragedy..." }
      ]
    },
    {
      title: "Part VII: The Final Stand",
      description: "The ultimate battle for the soul of the world.",
      chapters: [
        { number: 19, title: "Gathering Forces", summary: "Allies unite for one last fight..." },
        { number: 20, title: "The Final Battle", summary: "Everything comes to a head..." },
        { number: 21, title: "The Sacrifice", summary: "A hero falls..." }
      ]
    },
    {
      title: "Epilogue: A New Beginning",
      description: "The world moves forward, scarred but hopeful.",
      chapters: [
        { number: 22, title: "Years Later", summary: "The legacy of the war lives on..." }
      ]
    }
  ];

  return (
    <div className="outline-container">
      <h2>📖 Book Outline: "The War-Room Chronicles"</h2>
      <div className="outline-grid">
        {outlineData.map((section, idx) => (
          <div key={idx} className="outline-section">
            <h3>{section.title}</h3>
            <p className="section-description">{section.description}</p>
            <div className="chapters-list">
              {section.chapters.map((chapter) => (
                <div key={chapter.number} className="chapter-item">
                  <strong>Chapter {chapter.number}: {chapter.title}</strong>
                  <p>{chapter.summary}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Outline;
