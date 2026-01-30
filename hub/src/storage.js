const fs = require("fs/promises");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const statePath = path.join(dataDir, "state.json");

async function ensureStateFile(defaultState) {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(statePath);
  } catch {
    await fs.writeFile(statePath, JSON.stringify(defaultState, null, 2), "utf-8");
  }
}

async function readState() {
  const raw = await fs.readFile(statePath, "utf-8");
  return JSON.parse(raw);
}

async function writeState(state) {
  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf-8");
}

async function getActiveGameId() {
  const state = await readState();
  return state.activeGameId || null;
}

async function setActiveGameId(gameId) {
  const state = await readState();
  state.activeGameId = gameId;
  await writeState(state);
  return state.activeGameId;
}

module.exports = {
  ensureStateFile,
  getActiveGameId,
  setActiveGameId,
  statePath,
};
