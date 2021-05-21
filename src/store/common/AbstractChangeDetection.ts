import { ApplicationManager, ApplicationState, GameSession } from "../../models/application";

export abstract class AbstractChangeDetection {
	protected gameSession: GameSession;
	protected applicationState: ApplicationState;

	constructor(protected appManager: ApplicationManager) {
		this.detectChanges();
	}

	protected detectChanges = () => {
		this.appManager.getStore().subscribe(() => {
			const gameSession = this.appManager.getStore().getState().app.gameSession;
			const applicatiionState = this.appManager.getStore().getState().app;
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
		});
	};

	abstract handleGameSessionChanged(prev: GameSession): void;

	abstract handleApplicationStateChanged(prev: ApplicationState): void;

}
