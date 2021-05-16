import { GameSession } from "../../models/application";
import store from "../index";

export abstract class AbstractChangeDetection {
	protected gameSession: GameSession;
	constructor() {
		this.detectChanges();
	}

	protected detectChanges = () => {
		store.subscribe(() => {
			const gameSession = store.getState().app.gameSession;
			if (this.gameSession !== gameSession) {
				const prev = this.gameSession;
				this.gameSession = gameSession;
				if (prev && this.gameSession) {
					this.handleGameSessionChanged(prev);
				}
			}
		})
	}

	abstract handleGameSessionChanged(prev: GameSession): void;
}
