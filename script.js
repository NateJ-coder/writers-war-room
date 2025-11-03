document.addEventListener('DOMContentLoaded', () => {
    // --- Helper function to create a new card element ---
    const createNewCard = (title, content, type) => {
        const card = document.createElement('div');
        card.classList.add('card', `${type}-card`);
        
        // Use a prompt for the title for quick setup
        const cardTitle = prompt(`Enter the ${title} for the new card:`, title);
        if (!cardTitle) return; // Exit if cancelled

        card.innerHTML = `
            <h3>${cardTitle}</h3>
            <p contenteditable="true">${content}</p>
        `;

        // Make the content editable by default for quick changes
        card.querySelector('p').addEventListener('input', () => {
            // Simple logic: auto-save or print to console for development tracking
            console.log(`${type} "${cardTitle}" updated.`);
        });

        return card;
    };

    // --- 1. Plot Card Logic ---
    const plotContainer = document.getElementById('plot-container');
    document.getElementById('add-plot-card').addEventListener('click', () => {
        const newCard = createNewCard('Scene Title', 'Brief description of the scene or plot beat...', 'plot');
        if (newCard) {
            plotContainer.appendChild(newCard);
        }
    });

    // --- 2. Character Card Logic ---
    const characterContainer = document.getElementById('character-container');
    document.getElementById('add-character-card').addEventListener('click', () => {
        const newCard = createNewCard('Character Name', 'Key Traits: [Trait 1], Motivation: [Goal]...', 'character');
        if (newCard) {
            characterContainer.appendChild(newCard);
        }
    });
n    
    // --- 3. Lore/Definition Card Logic (Already has an example in HTML) ---
    // You can add a button here later if you need more dynamic lore cards.

    // --- Basic Drag and Drop (Within the same container for simplicity) ---
    const containers = [plotContainer, characterContainer, document.getElementById('lore-container')];

    containers.forEach(container => {
        // This makes the *cards* draggable
        container.addEventListener('mousedown', (e) => {
            const card = e.target.closest('.card');
            if (card) {
                // Future implementation: Drag and drop logic goes here
                // For now, the 'cursor: move;' in CSS suggests the functionality.
                // Full drag-and-drop requires more complex JS (like using the Drag Event API).
            }
        });
    });
});
