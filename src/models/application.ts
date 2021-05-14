export interface ApplicationState {
  appStarted: boolean;
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  playInstructions: string;
  cards: Card[];
  prefabUri: string;
  enabled: boolean;
}

export interface Card {
  id: string;
  value: string;
  type: 'text' | 'image';
}

enum GAME_STATE {
  Active,
  Waiting,
}
export interface GameSession {
  selectedDeck: Deck;
  pile: Card[];
  draw: Array<{correct: boolean; card: Card}>;
  passCount: number;
  correctCount: number;
  duration: number;
  timeRemaining: number;
  state: GAME_STATE;
}

export interface DecksState {
  loading: boolean;
  decks: Deck[];
}
