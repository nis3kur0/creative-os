import { writable } from 'svelte/store';
import type { TaskSizeConfig, TaskTypeConfig, EnergyLevelConfig } from '../types';
import { DEFAULT_TASK_SIZES, DEFAULT_TASK_TYPES, DEFAULT_ENERGY_LEVELS } from '../constants/defaults';

const STORAGE_SIZES_KEY = 'creative_os_task_sizes';
const STORAGE_TYPES_KEY = 'creative_os_task_types';
const STORAGE_ENERGY_KEY = 'creative_os_energy_levels';

function getStoredSizes(): TaskSizeConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_SIZES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_TASK_SIZES;
}

function getStoredTypes(): TaskTypeConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_TYPES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_TASK_TYPES;
}

function getStoredEnergy(): EnergyLevelConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_ENERGY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_ENERGY_LEVELS;
}

export const taskSizesStore = writable<TaskSizeConfig[]>(getStoredSizes());
export const taskTypesStore = writable<TaskTypeConfig[]>(getStoredTypes());
export const energyLevelsStore = writable<EnergyLevelConfig[]>(getStoredEnergy());

taskSizesStore.subscribe(val => localStorage.setItem(STORAGE_SIZES_KEY, JSON.stringify(val)));
taskTypesStore.subscribe(val => localStorage.setItem(STORAGE_TYPES_KEY, JSON.stringify(val)));
energyLevelsStore.subscribe(val => localStorage.setItem(STORAGE_ENERGY_KEY, JSON.stringify(val)));
