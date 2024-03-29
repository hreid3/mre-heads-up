import { configureStore, Store } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import { AppState } from "../models/application";
import { default as app } from "./app/reducer";
import { default as decks } from "./decks/reducer";

const logger = createLogger({
	collapsed: true,
	diff: true
});

export const createStore = (): Store<AppState> => {
	const store = configureStore({
		reducer: {app, decks},
		middleware: (getDefaultMiddleware) => {
			if (process.env.LOG_STORE) {
				return getDefaultMiddleware().concat(logger);
			}
			return getDefaultMiddleware();
		}
	});
	return store;
};

// export default store;

// store.subscribe(() => console.log("Horace", store.getState()));
// Infer the `RootState` and `AppDispatch` types from the store itself
// export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
// export type AppDispatch = typeof store.dispatch
