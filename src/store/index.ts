import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import { default as app } from './app/reducer';
import { default as decks } from './decks/reducer';

const logger = createLogger({
	collapsed: true,
	diff: true,
});

const store = configureStore({
	reducer: { app, decks, },
	// middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger),
});

export default store;

// store.subscribe(() => console.log("Horace", store.getState()));
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
