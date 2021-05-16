import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import store from "../../store";
import { DecksState, GameSession } from "../../models/application";
import { drawCard, initializeGameSession } from "../../store/app/actions";
import countdown from 'countdown';
import { AbstractChangeDetection } from "../../store/common/AbstractChangeDetection";

export class HeadsUpCard extends AbstractChangeDetection {
	private root: MRE.Actor;
	private gridLayout: MRE.PlanarGridLayout;
	private decksState: DecksState;
	private assets: MRE.AssetContainer;
	private readyCountdownTimer: countdown.Timespan | number;
	private gameSessionCountdownTimer: countdown.Timespan | number;

	constructor(private context: MRE.Context, private parent: MRE.Actor, private player: MRE.User) {
		super();
		this.assets = new MRE.AssetContainer(this.context);
		this.startGaming();
	}

	private startGaming = async () => {
		// Reset all game values
		this.decksState = store.getState().decks;
		this.gameSession = store.getState().app.gameSession;
		const pile = this.decksState.decks.find(v => v.id === this.gameSession?.selectedDeckId)?.cards;
		if (!pile) {
			throw Error("Missing pile for "+ this.gameSession.selectedDeckId);
		}
		store.dispatch(initializeGameSession({ pile }));
		// build card

		// Start pre-countdown
		await this.startReadyCountdown();
		console.log("Game started");
		// Play game
		store.dispatch(drawCard({}));
		this.startGameSessionCountdown().then(() => {
			// Display results
			console.log("Game over")
		});
	}

	handleGameSessionChanged(prev: GameSession): void {
		// throw new Error("Method not implemented.");
	}

	public destroy() {
		this.root?.destroy();
	}

	protected startReadyCountdown = () => {
		return new Promise(((resolve) => {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const __this = this;
			const start = new Date(Date.now() + this.gameSession.readyCountdownDuration);
			this.readyCountdownTimer =
				countdown(
					start,
					function(ts) {
						console.log("Ready: ", ts.seconds)
						if (ts.seconds <= 1) {
							resolve();
							// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
							// @ts-ignore
							clearInterval(__this.readyCountdownTimer);
						}
					},
					countdown.SECONDS);
		}))
	}

	protected startGameSessionCountdown = () => {
		return new Promise(((resolve) => {
			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const __this = this;
			const start = new Date(Date.now() + this.gameSession.duration);
			this.gameSessionCountdownTimer =
				countdown(
					start,
					function(ts) {
						console.log("Gaming: ", ts.seconds)
						if (ts.seconds < 1) {
							resolve();
							// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
							// @ts-ignore
							clearInterval(__this.gameSessionCountdownTimer);
						}
					},
					countdown.SECONDS);
		}))
	}

	// protected start
}
