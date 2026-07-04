export interface Player {
    id: number;
    name: string;
    winCount: number
}

export interface Round {
    id: number;
    number: number;
    scores: Record<string, number | string>;
    dealerId?: number;
}

export interface Game {
    id: number;
    createdAt: string;
    players: Player[];
    rounds: Round[];
    dealerId: number;
}

export interface GameRulesConfig {
  secondBPenalty: number;
  hvPenalty: number;
  allowVis: boolean;
  customTargetScore: boolean;
  targetScoreOptions: number[];
}

export type SavedGameState = {
  game: Game;
  targetScore: number;
  winnerPlayer: number | null;
  /** Rules active when the game was saved. Optional: older saves predate this field. */
  gameRules?: GameRulesConfig;
};
