import { EMPTY_GEM } from '../data/GameConfig';

export type SpecialType = 'none' | 'row' | 'col' | 'bomb';

export interface GemData {
    gemType: number;
    specialType: SpecialType;
}

export function createGemData(gemType: number, specialType: SpecialType = 'none'): GemData {
    return {
        gemType,
        specialType,
    };
}

export function cloneGemData(data: GemData): GemData {
    return {
        gemType: data.gemType,
        specialType: data.specialType,
    };
}

export function isEmptyGem(data: GemData): boolean {
    return data.gemType === EMPTY_GEM;
}
