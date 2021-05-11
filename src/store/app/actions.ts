import { createAction } from '@reduxjs/toolkit';
import { withPayloadType } from '../utils';
export const APP_STARTED = 'APP_STARTED';

export const setAppStarted = createAction(APP_STARTED, withPayloadType<boolean>());
