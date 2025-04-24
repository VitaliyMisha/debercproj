export interface Player {
    id: number;
    name: string;
    winCount: number
}

export interface Round {
    id: number;
    number: number;
    scores: Record<string, number | string>;
}

export interface Game {
    id: number;
    createdAt: string;
    players: Player[];
    rounds: Round[];
    dealerId: number;
}
