// --- Initial data for the Dark Romance novel (aligned to manuscript) ---
const initialCharacters = [
  {
    name: "Lt. Col. Ezekial Alaric (\"The Jaguar\")",
    traits:
      "Continental Army officer; patient, brave, front-line leader; carries a black rose in a leather pouch; haunted focus on the vampire killings; moves before dawn; admired/feared by the men."
  },
  {
    name: "Pippin (the mouse)",
    traits:
      "Close observer/POV; rides in Alaric's coat lining or saddlebag; wry, loyal, notices the man behind the iron mask."
  },
  {
    name: "The Vampire (unnamed woman)",
    traits:
      "Preternatural beauty; sings lullabies; leaves black-petaled rose on victims; intellect + hints of humanity; lethal and fast."
  }
];

const initialPlotBeats = [
  {
    title: "ACT I - Inciting Incident",
    content:
      "Grisly crime scene; lullaby in the dark; first on-page reveal of the vampire; Keller's death underscores threat; Alaric recommits to the hunt."
  },
  {
    title: "ACT I - Rising Action",
    content:
      "Reports of a family on the outskirts; black-rose signature; barracks/stables sequence; Alaric mounts the Friesian; Pippin frames Alaric's dual nature."
  },
  {
    title: "ACT I - First Clash / Near-Capture",
    content:
      "Alaric nearly corners her; her speed/intellect unsettle him; first crack of her humanity appears, complicating the hunt."
  }
];

// Mirror the expected import/column name for spreadsheet alignment
const IMPORT_FIELD_NAME = "character";

document.addEventListener("DOMContentLoaded", () => {
  // Apply background image from config if provided
  try {
    const bg = window?.WARROOM_CONFIG?.backgroundImage;
    if (bg) {
      // Use a fixed background with cover sizing for a full-bleed effect
      document.body.style.backgroundImage = `url('${bg}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      // Ensure content still reads by letting CSS overlay handle contrast
      document.body.classList.add('has-bg-image');
    }
  } catch (e) {
    // silent fallback
    console.warn('Failed to apply background image from config', e);
  }
  // --- Helper function to create a new card element ---
  const createNewCard = (title, content, type) => {
    const card = document.createElement("div");
    card.classList.add("card", `${type}-card`);
    card.dataset.type = type;
    if (type === "character") card.dataset.field = IMPORT_FIELD_NAME;

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;

    const contentEl = document.createElement("p");
    contentEl.contentEditable = "true";
    contentEl.innerHTML = content;

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Delete card";

    deleteBtn.addEventListener("click", () => {
      card.remove();
      console.log(`Deleted ${type} card: ${title}`);
    });

    contentEl.addEventListener("input", () => {
      console.log(`${type} "${title}" updated.`);
    });

    card.appendChild(titleEl);
    card.appendChild(contentEl);
    card.appendChild(deleteBtn);

    return card;
  };

  // --- Containers ---
  const plotContainer = document.getElementById("plot-container");
  const characterContainer = document.getElementById("character-container");
  const locationsContainer = document.getElementById("locations-container");
  const evidenceContainer = document.getElementById("evidence-container");
  const themesContainer = document.getElementById("themes-container");
  const povContainer = document.getElementById("pov-container");

  // --- Add button handlers ---
  document.getElementById("add-plot-card").addEventListener("click", () => {
    const newCard = createNewCard(
      "Scene Title",
      "Brief description of the scene or plot beat...",
      "plot"
    );
    if (newCard) plotContainer.appendChild(newCard);
  });

  document.getElementById("add-character-card").addEventListener("click", () => {
    const newCard = createNewCard(
      "Character Name",
      "Key Traits: [Trait 1], Motivation: [Goal]...",
      "character"
    );
    if (newCard) characterContainer.appendChild(newCard);
  });

  // quick handlers for the newly added boards
  document.getElementById("add-location-card")?.addEventListener("click", () => {
    if (locationsContainer)
      locationsContainer.appendChild(createNewCard("Location Name", "Key details…", "location"));
  });
  document.getElementById("add-evidence-card")?.addEventListener("click", () => {
    if (evidenceContainer)
      evidenceContainer.appendChild(createNewCard("Clue", "Where found, what it suggests…", "evidence"));
  });
  document.getElementById("add-theme-card")?.addEventListener("click", () => {
    if (themesContainer)
      themesContainer.appendChild(createNewCard("Theme", "How it appears in scenes…", "theme"));
  });
  document.getElementById("add-pov-card")?.addEventListener("click", () => {
    if (povContainer) povContainer.appendChild(createNewCard("POV Beat", "Who sees what, when…", "pov"));
  });

  // --- Initialization: populate initial data ---
  function initializeWarRoom() {
    initialCharacters.forEach((ch) => {
      const card = createNewCard(ch.name, ch.traits, "character");
      if (card) characterContainer.appendChild(card);
    });

    initialPlotBeats.forEach((pb) => {
      const card = createNewCard(pb.title, pb.content, "plot");
      if (card) plotContainer.appendChild(card);
    });
  }

  initializeWarRoom();

  // --- Simple localStorage persistence ---
  function snapshot() {
    const serialize = (container) =>
      [...container.querySelectorAll(".card")].map((card) => ({
        title: card.querySelector("h3")?.textContent || "",
        content: card.querySelector("[contenteditable]")?.innerHTML || "",
        type: card.dataset.type || ""
      }));
    return {
      plot: serialize(document.getElementById("plot-container")),
      characters: serialize(document.getElementById("character-container")),
      lore: serialize(document.getElementById("lore-container")),
      locations: serialize(document.getElementById("locations-container") || document.createElement("div")),
      evidence: serialize(document.getElementById("evidence-container") || document.createElement("div")),
      themes: serialize(document.getElementById("themes-container") || document.createElement("div")),
      pov: serialize(document.getElementById("pov-container") || document.createElement("div"))
    };
  }

  function saveState() {
    localStorage.setItem("warroom", JSON.stringify(snapshot()));
  }
  function loadState() {
    const raw = localStorage.getItem("warroom");
    if (!raw) return false;
    const data = JSON.parse(raw);

    const mount = (arr, container, type) => {
      if (!arr || !container) return;
      container.innerHTML = "";
      arr.forEach((item) => container.appendChild(createNewCard(item.title, item.content, item.type || type)));
    };

    mount(data.characters, document.getElementById("character-container"), "character");
    mount(data.plot, document.getElementById("plot-container"), "plot");
    mount(data.lore, document.getElementById("lore-container"), "lore");
    mount(data.locations, document.getElementById("locations-container"), "location");
    mount(data.evidence, document.getElementById("evidence-container"), "evidence");
    mount(data.themes, document.getElementById("themes-container"), "theme");
    mount(data.pov, document.getElementById("pov-container"), "pov");
    return true;
  }

  if (!loadState()) {
    /* already populated by initializeWarRoom() */
  }

  document.body.addEventListener("input", saveState);
  document.body.addEventListener("click", (e) => {
    if (e.target.matches(".delete-btn") || e.target.matches("button[id^=\"add-\"]")) {
      setTimeout(saveState, 0);
    }
  });

  // --- Import XLSX UI (frontend glue) ---
  const importBtn = document.getElementById("btn-import-xlsx");
  const fileInput = document.getElementById("xlsx-input");

  // Adjust if your backend runs elsewhere
  const BACKEND_URL = "http://localhost:6060";

  importBtn?.addEventListener("click", () => fileInput.click());

  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${BACKEND_URL}/import`, {
        method: "POST",
        body: form
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      applyImportedBoards(data);
      alert("Import complete!");
    } catch (err) {
      console.error(err);
      alert(`Import failed: ${err.message}`);
    } finally {
      fileInput.value = ""; // reset
    }
  });

  // Merge imported boards into UI (replace or append—default: replace)
  function applyImportedBoards(payload, { mode = "replace" } = {}) {
    const mount = (arr, containerId, typeDefault) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      if (mode === "replace") container.innerHTML = "";
      (arr || []).forEach((item) => {
        const title = item.title || "Untitled";
        const content = item.content || "";
        const type = item.type || typeDefault;
        container.appendChild(createNewCard(title, content, type));
      });
    };

    mount(payload.characters, "character-container", "character");
    mount(payload.plot, "plot-container", "plot");
    mount(payload.lore, "lore-container", "lore");
    mount(payload.locations, "locations-container", "location");
    mount(payload.evidence, "evidence-container", "evidence");
    mount(payload.themes, "themes-container", "theme");
    mount(payload.pov, "pov-container", "pov");

    if (typeof saveState === "function") saveState();
  }

  // --- Basic Drag and Drop placeholder (Within the same container for simplicity) ---
  const containers = [plotContainer, characterContainer, document.getElementById("lore-container")];

  containers.forEach((container) => {
    container.addEventListener("mousedown", (e) => {
      const card = e.target.closest(".card");
      if (card) {
        // Drag/drop is a future enhancement
      }
    });
  });
});
