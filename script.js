// --- Initial data for the Dark Romance novel ---
const initialCharacters = [
    { name: "The Lieutenant (The General)", traits: "Fuzio Properties software developer (21), works for Fuzio, bad anxiety, loves Amanda. In-story: Dedicated leader, driven by rage, tracks the vampire." },
    { name: "The Vampire (The Woman)", traits: "Enigmatic, great intellect, first crack of humanity in Act I. Features: perfect features, ink-like hair, sings lullabies." },
    { name: "The Mouse (Companion)", traits: "The General's observer and companion. Notes his changing emotions. Sits in the saddlebag among maps and papers (Act I)." }
];

const initialPlotBeats = [
    { title: "ACT I: Inciting Incident (1-3)", content: "Introduce the General, Mouse, and Kingdom’s problem with vampires. Gory crime scene sets the path." },
    { title: "ACT I: Rising Action (4-8)", content: "The hunt is on. Gruesome aftermath shown. Alternating monologues between General's rage and Vampire's loneliness." },
    { title: "ACT I: Midpoint Reveal (9-12)", content: "General almost catches the Vampire. First conflict shows her intellect and humanity—first crack in her monstrous facade." }
];

document.addEventListener('DOMContentLoaded', () => {
    // --- Helper function to create a new card element ---
    const createNewCard = (title, content, type) => {
        const card = document.createElement('div');
        card.classList.add('card', `${type}-card`);
        card.dataset.type = type;

        // Build card content without prompts so it can be used for initial data
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;

        const contentEl = document.createElement('p');
        contentEl.contentEditable = 'true';
        contentEl.innerHTML = content;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.type = 'button';
        deleteBtn.textContent = 'Delete';
        deleteBtn.title = 'Delete card';

        deleteBtn.addEventListener('click', () => {
            card.remove();
            console.log(`Deleted ${type} card: ${title}`);
        });

        // Watch for edits
        contentEl.addEventListener('input', () => {
            console.log(`${type} "${title}" updated.`);
        });

        card.appendChild(titleEl);
        card.appendChild(contentEl);
        card.appendChild(deleteBtn);

        return card;
    };

    // --- Containers ---
    const plotContainer = document.getElementById('plot-container');
    const characterContainer = document.getElementById('character-container');

    // --- Add button handlers ---
    document.getElementById('add-plot-card').addEventListener('click', () => {
        const newCard = createNewCard('Scene Title', 'Brief description of the scene or plot beat...', 'plot');
        if (newCard) plotContainer.appendChild(newCard);
    });

    document.getElementById('add-character-card').addEventListener('click', () => {
        const newCard = createNewCard('Character Name', 'Key Traits: [Trait 1], Motivation: [Goal]...', 'character');
        if (newCard) characterContainer.appendChild(newCard);
    });

    // --- Initialization: populate initial data ---
    function initializeWarRoom() {
        // Populate characters
        initialCharacters.forEach(ch => {
            const card = createNewCard(ch.name, ch.traits, 'character');
            if (card) characterContainer.appendChild(card);
        });

        // Populate plot beats
        initialPlotBeats.forEach(pb => {
            const card = createNewCard(pb.title, pb.content, 'plot');
            if (card) plotContainer.appendChild(card);
        });
    }

    initializeWarRoom();

    // --- Basic Drag and Drop placeholder (Within the same container for simplicity) ---
    const containers = [plotContainer, characterContainer, document.getElementById('lore-container')];

    containers.forEach(container => {
        container.addEventListener('mousedown', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                // Drag/drop is a future enhancement
            }
        });
    });
});
