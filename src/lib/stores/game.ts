import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import type { GameState, MeterGroup, Meters, MeterRanges } from '../types';
import meterRanges from '$lib/content/meters.json';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initMeters(ranges: MeterRanges): Meters {
  const out = {} as Meters;
  for (const groupKey in ranges) {
    const group = groupKey as MeterGroup;
    const metersForGroup = ranges[group];
    out[group] = {} as Record<string, number>;
    for (const meterKey in metersForGroup) {
      const range = metersForGroup[meterKey];
      out[group][meterKey] = randInt(range.min, range.max);
    }
  }
  return out;
}

export const defaultState: GameState = {
  year: 2025,
  quarter: 3,
  meters: initMeters(meterRanges as MeterRanges),
  log: [],
  seed: Date.now(),
  gameOver: 'playing'
};

function createGameStore() {
  let initial: GameState = defaultState;
  if (browser) {
    const raw = localStorage.getItem('game');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<GameState>;
        initial = { ...defaultState, ...parsed };
      } catch {
        initial = defaultState;
      }
    }
  }

  // Ensure all default fields are present
  initial = { ...defaultState, ...initial };

  const { subscribe, set, update } = writable<GameState>(initial);

  return {
    subscribe,
    set: (v: GameState) => {
      set(v);
      if (browser) {
        localStorage.setItem('game', JSON.stringify(v));
      }
    },
    update: (fn: (s: GameState) => GameState) => {
      update((current) => {
        const next = fn(current);
        if (browser) {
          localStorage.setItem('game', JSON.stringify(next));
        }
        return next;
      });
    }
  };
}

export const game = createGameStore();