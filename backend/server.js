import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = process.env.PORT || 4000;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY) {
  console.warn('Warning: GEMINI_API_KEY not set. The /api/chat endpoint will fail until you set it in environment.');
}

import multer from "multer";
import XLSX from "xlsx";

const app = express();
app.use(cors());
app.use(express.json());

// Simple chat proxy: client posts { message: string }
app.post('/api/chat', async (req, res) => {
  try {
    const { message, system } = req.body || {};
    if (!message) return res.status(400).json({ error: 'missing message' });

    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

    // Create a chat session and send the user message.
    // NOTE: This uses the server-side GenAI client. Adjust the model/config as needed.
    const chat = ai.chats.create({
      model: 'gemini-2.5',
      config: {
        systemInstruction: system || 'You are a helpful assistant.'
      }
    });

    // Send the message and get the full response (non-streaming)
    const response = await chat.sendMessage({ message });
    // response may contain text or a more complex structure; normalize below
    const text = response?.text || (response?.content || '') ;

    return res.json({ response: text });
  } catch (err) {
    console.error('Chat proxy error', err);
    return res.status(500).json({ error: 'chat proxy error' });
  }
});

// store uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

const ALIASES = {
  "(general)": "character",
  "general": "character",
  "char": "character",
  "pov": "pov_character",
  "p.o.v": "pov_character",
  "beat title": "title",
  "beat": "title",
  "desc": "description",
  "details": "description"
};

const FIELD_MAP = {
  chapter: "chapter",
  act: "act",
  beat: "beat",
  title: "title",
  description: "description",
  character: "character",
  pov_character: "pov_character",
  location: "location",
  evidence: "evidence",
  theme: "theme",
  notes: "notes"
};

function normalizeHeader(h) {
  if (!h) return "";
  const key = String(h).trim().toLowerCase();
  if (ALIASES[key]) return ALIASES[key];
  return key;
}

function normalizeRow(rawObj) {
  const out = {};
  for (const [k, v] of Object.entries(rawObj)) {
    const nk = normalizeHeader(k);
    const canonical = FIELD_MAP[nk];
    if (canonical) out[canonical] = v == null ? "" : String(v).trim();
  }
  return out;
}

function buildBoards(rows) {
  const plot = [];
  const characterSet = new Map();
  const pov = [];
  const locations = new Set();
  const evidence = new Set();
  const themes = new Set();
  const lore = [];

  for (const r of rows) {
    const anyPlotField = r.chapter || r.act || r.title || r.description || r.beat;
    if (anyPlotField) {
      const titleParts = [];
      if (r.act) titleParts.push(`ACT ${r.act}`);
      if (r.chapter) titleParts.push(`Chapter ${r.chapter}`);
      if (r.beat) titleParts.push(`Beat ${r.beat}`);
      if (r.title) titleParts.push(`— ${r.title}`);

      plot.push({
        title: titleParts.join(" "),
        content: r.description || r.notes || "",
        type: "plot"
      });
    }

    if (r.character) {
      const name = r.character;
      const prev = characterSet.get(name) || "";
      const more = [];
      if (r.pov_character) more.push(`POV: ${r.pov_character}`);
      if (r.location) more.push(`Frequent location: ${r.location}`);
      if (r.theme) more.push(`Theme tie-in: ${r.theme}`);
      if (r.notes) more.push(`Note: ${r.notes}`);
      const merged = [prev, more.join(" | ")].filter(Boolean).join(" | ");
      characterSet.set(name, merged);
    }

    if (r.pov_character && (r.title || r.description)) {
      pov.push({
        title: `${r.pov_character} → ${r.title || (r.description || "").slice(0, 32) || "POV Beat"}`,
        content: r.description || r.notes || "",
        type: "pov"
      });
    }

    if (r.location) locations.add(r.location);
    if (r.evidence) evidence.add(r.evidence);
    if (r.theme) themes.add(r.theme);
  }

  const characters = [...characterSet.entries()].map(([name, traits]) => ({
    title: name,
    content: traits || "",
    type: "character"
  }));

  const locationsArr = [...locations].map(name => ({ title: name, content: "", type: "location" }));
  const evidenceArr = [...evidence].map(name => ({ title: name, content: "", type: "evidence" }));
  const themesArr = [...themes].map(name => ({ title: name, content: "", type: "theme" }));

  return {
    plot,
    characters,
    lore,
    locations: locationsArr,
    evidence: evidenceArr,
    themes: themesArr,
    pov
  };
}

function parseWorkbook(buffer, sheetName = null) {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const chosenSheet = sheetName && wb.Sheets[sheetName]
    ? wb.Sheets[sheetName]
    : wb.Sheets[wb.SheetNames[0]];

  const rawRows = XLSX.utils.sheet_to_json(chosenSheet, { defval: "" });
  const normalized = rawRows.map(normalizeRow);

  return buildBoards(normalized);
}

app.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Use field name 'file'." });
    }
    const sheetName = req.query.sheet || null;

    const result = parseWorkbook(req.file.buffer, sheetName);

    const ensureArray = k => (Array.isArray(result[k]) ? result[k] : []);
    const payload = {
      plot: ensureArray("plot"),
      characters: ensureArray("characters"),
      lore: ensureArray("lore"),
      locations: ensureArray("locations"),
      evidence: ensureArray("evidence"),
      themes: ensureArray("themes"),
      pov: ensureArray("pov")
    };

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse spreadsheet", details: String(err?.message || err) });
  }
});

// Start server using the already declared PORT
app.listen(PORT, () => console.log(`War-Room backend running on http://localhost:${PORT}`));
