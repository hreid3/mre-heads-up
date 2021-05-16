import { createAsyncThunk } from "@reduxjs/toolkit";
import fs from 'mz/fs';
import yaml from 'yaml';
import { Deck, DecksState } from "../../models/application";
import { loadDecksSuccess } from "./actions";

export const loadDecksFromFileSystem = createAsyncThunk(
	'decks/load',
	async (arg, {dispatch}) => {
		try {
			const { INIT_CWD } = process.env; // process.env.INIT_CWD
			const directory = `${INIT_CWD}/public/decks/data`;
			const files = await fs.readdir(directory);
			const decks: Deck[] = [];
			let id = 0;
			for(const fileName of files) {
				const file = await fs.readFile(`${directory}/${fileName}`, { encoding: 'utf8'});
				const deck = yaml.parse(file) as Deck;
				deck.id = `${id++}`;
				const cardStrings = deck.cards;
				deck.cards = [];
				id = 0;
				for(const cardString of cardStrings) {
					const value = cardString as unknown as string;
					deck.cards.push({value, id: id++, type: 'text'});
				}
				decks.push(deck);
			}
			const payload: DecksState = {
				decks, loading: false
			}
			dispatch(loadDecksSuccess(payload));
			return payload
		} catch (err) {
			console.error( err )
			throw err;
		} 
	});
