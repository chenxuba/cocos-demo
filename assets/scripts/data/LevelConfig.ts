export interface LevelConfig {
    level: number;
    row: number;
    col: number;
    maxMoves: number;
    goalType: 'score' | 'collect' | 'clear';
    goalValue: number;
    gemTypes: number[];
    cellSize: number;
}

export const DEFAULT_LEVEL_CONFIG: LevelConfig = {
    level: 1,
    row: 8,
    col: 8,
    maxMoves: 20,
    goalType: 'score',
    goalValue: 3000,
    gemTypes: [0, 1, 2, 3, 4, 5],
    cellSize: 72,
};
