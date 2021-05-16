import { ApplicationState, GameSession } from "../../models/application";
import store from "../index";

export abstract class AbstractChangeDetection {
	protected gameSession: GameSession;
	protected applicationState: ApplicationState;

	constructor() {
		this.detectChanges();
	}

	protected detectChanges = () => {
		store.subscribe(() => {
			const gameSession = store.getState().app.gameSession;
			const applicatiionState = store.getState().app;
			if (this.gameSession !== gameSession) {
				const prev = this.gameSession;
				this.gameSession = gameSession;
				if (prev && this.gameSession) {
					this.handleGameSessionChanged(prev);
				}
			}
			if (this.applicationState !== applicatiionState) {
				if (this.applicationState !== applicatiionState) {
					const prev = this.applicationState;
					this.applicationState = applicatiionState;
					if (prev && this.applicationState) {
						this.handleApplicationStateChanged(prev);
					}
				}
			}
		})
	}

	abstract handleGameSessionChanged(prev: GameSession): void;

	abstract handleApplicationStateChanged(prev: ApplicationState): void;

}
