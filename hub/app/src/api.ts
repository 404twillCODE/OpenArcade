// API types and helpers — contract matches hub backend.

export interface GameManifest {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string;
  wip?: boolean;
}

export interface StateResponse {
  activeGameId: string | null;
}

export async function fetchGames(): Promise<GameManifest[]> {
  const res = await fetch("/api/games");
  if (!res.ok) throw new Error("Failed to fetch games");
  return res.json();
}

export async function fetchState(): Promise<StateResponse> {
  const res = await fetch("/api/state");
  if (!res.ok) throw new Error("Failed to fetch state");
  return res.json();
}

export async function setActiveGame(gameId: string): Promise<StateResponse> {
  const res = await fetch("/api/active-game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Failed to set active game");
  }
  return res.json();
}
