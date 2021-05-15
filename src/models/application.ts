export interface ApplicationState {
  appStarted: boolean;
  gameSession: GameSession;
}

export type ID = string | number;

export interface Deck {
  id: ID;
  name: string;
  description: string;
  playInstructions: string;
  cards: Card[];
  prefabUri: string;
  enabled: boolean;
}

export interface Card {
  id: ID;
  value: string;
  type: 'text' | 'image';
}

export enum GAME_STATE {
  Playing,
  Waiting,
}
export interface GameSession {
  selectedDeckId: ID;
  pile: Card[];
  draw: Array<{correct: boolean; card: Card}>;
  passCount: number;
  correctCount: number;
  duration: number;
  timeRemaining: number;
  state: GAME_STATE;
  playerId: string;
}

export interface DecksState {
  loading: boolean;
  decks: Deck[];
}
