import { EMPTY_GEM } from '../data/GameConfig';
import { GemData, SpecialType, isEmptyGem } from './BoardTypes';

export interface CellCoord {
    row: number;
    col: number;
}

export interface MatchGroup {
    cells: CellCoord[];
    orientation: 'row' | 'col';
}

export interface SpecialSpawn {
    cell: CellCoord;
    gemType: number;
    specialType: SpecialType;
}

export interface MatchAnalysis {
    matches: MatchGroup[];
    clearCells: CellCoord[];
    specialSpawn: SpecialSpawn | null;
}

export class MatchLogic {
    public static findAllMatches(board: GemData[][]): MatchGroup[] {
        const matches: MatchGroup[] = [];
        const rows = board.length;
        const cols = board[0]?.length ?? 0;

        for (let row = 0; row < rows; row++) {
            let startCol = 0;
            while (startCol < cols) {
                const gemType = board[row][startCol].gemType;
                let endCol = startCol + 1;
                while (endCol < cols && board[row][endCol].gemType === gemType) {
                    endCol++;
                }

                if (gemType !== EMPTY_GEM && endCol - startCol >= 3) {
                    const cells: CellCoord[] = [];
                    for (let col = startCol; col < endCol; col++) {
                        cells.push({ row, col });
                    }
                    matches.push({ cells, orientation: 'row' });
                }

                startCol = endCol;
            }
        }

        for (let col = 0; col < cols; col++) {
            let startRow = 0;
            while (startRow < rows) {
                const gemType = board[startRow][col].gemType;
                let endRow = startRow + 1;
                while (endRow < rows && board[endRow][col].gemType === gemType) {
                    endRow++;
                }

                if (gemType !== EMPTY_GEM && endRow - startRow >= 3) {
                    const cells: CellCoord[] = [];
                    for (let row = startRow; row < endRow; row++) {
                        cells.push({ row, col });
                    }
                    matches.push({ cells, orientation: 'col' });
                }

                startRow = endRow;
            }
        }

        return matches;
    }

    public static flattenUniqueCells(matches: MatchGroup[]): CellCoord[] {
        const unique = new Map<string, CellCoord>();
        for (const match of matches) {
            for (const cell of match.cells) {
                unique.set(`${cell.row}:${cell.col}`, cell);
            }
        }
        return Array.from(unique.values());
    }

    public static isAdjacent(a: CellCoord, b: CellCoord): boolean {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
    }

    public static wouldSwapCreateMatch(board: GemData[][], a: CellCoord, b: CellCoord): boolean {
        if (!this.isAdjacent(a, b)) {
            return false;
        }

        this.swap(board, a, b);
        const hasMatch = this.findAllMatches(board).length > 0;
        this.swap(board, a, b);
        return hasMatch;
    }

    public static hasPossibleMove(board: GemData[][]): boolean {
        const rows = board.length;
        const cols = board[0]?.length ?? 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (board[row][col].specialType !== 'none') {
                    return true;
                }

                const current = { row, col };
                const right = { row, col: col + 1 };
                const down = { row: row + 1, col };

                if (col + 1 < cols && this.wouldSwapCreateMatch(board, current, right)) {
                    return true;
                }

                if (row + 1 < rows && this.wouldSwapCreateMatch(board, current, down)) {
                    return true;
                }
            }
        }

        return false;
    }

    public static analyzeMatches(board: GemData[][], preferredCells: CellCoord[] = []): MatchAnalysis {
        const matches = this.findAllMatches(board);
        const uniqueCells = this.flattenUniqueCells(matches);
        const specialSpawn = this.determineSpecialSpawn(board, matches, uniqueCells, preferredCells);
        const clearCells = specialSpawn
            ? uniqueCells.filter((cell) => !(cell.row === specialSpawn.cell.row && cell.col === specialSpawn.cell.col))
            : uniqueCells;

        return {
            matches,
            clearCells,
            specialSpawn,
        };
    }

    public static expandSpecialClears(board: GemData[][], initialCells: CellCoord[]): CellCoord[] {
        const rows = board.length;
        const cols = board[0]?.length ?? 0;
        const queue = [...initialCells];
        const visited = new Map<string, CellCoord>();

        for (const cell of initialCells) {
            visited.set(`${cell.row}:${cell.col}`, cell);
        }

        while (queue.length > 0) {
            const cell = queue.shift()!;
            const gem = board[cell.row]?.[cell.col];
            if (!gem || isEmptyGem(gem) || gem.specialType === 'none') {
                continue;
            }

            for (const target of this.getAffectedCells(rows, cols, cell, gem.specialType)) {
                const key = `${target.row}:${target.col}`;
                if (visited.has(key)) {
                    continue;
                }
                visited.set(key, target);
                queue.push(target);
            }
        }

        return Array.from(visited.values());
    }

    public static hasTriggeredSpecialSwap(board: GemData[][], a: CellCoord, b: CellCoord): boolean {
        return board[a.row][a.col].specialType !== 'none' || board[b.row][b.col].specialType !== 'none';
    }

    public static swap(board: GemData[][], a: CellCoord, b: CellCoord): void {
        const temp = board[a.row][a.col];
        board[a.row][a.col] = board[b.row][b.col];
        board[b.row][b.col] = temp;
    }

    private static determineSpecialSpawn(
        board: GemData[][],
        matches: MatchGroup[],
        uniqueCells: CellCoord[],
        preferredCells: CellCoord[],
    ): SpecialSpawn | null {
        if (matches.length === 0) {
            return null;
        }

        const rowLengths = new Map<string, number>();
        const colLengths = new Map<string, number>();

        for (const match of matches) {
            for (const cell of match.cells) {
                const key = `${cell.row}:${cell.col}`;
                if (match.orientation === 'row') {
                    rowLengths.set(key, Math.max(rowLengths.get(key) ?? 0, match.cells.length));
                } else {
                    colLengths.set(key, Math.max(colLengths.get(key) ?? 0, match.cells.length));
                }
            }
        }

        const orderedCandidates = [
            ...preferredCells.filter((candidate) => uniqueCells.some((cell) => cell.row === candidate.row && cell.col === candidate.col)),
            ...uniqueCells,
        ];

        for (const cell of orderedCandidates) {
            const key = `${cell.row}:${cell.col}`;
            const rowLength = rowLengths.get(key) ?? 0;
            const colLength = colLengths.get(key) ?? 0;
            const specialType = this.getSpecialType(rowLength, colLength);
            if (specialType === 'none') {
                continue;
            }

            return {
                cell,
                gemType: board[cell.row][cell.col].gemType,
                specialType,
            };
        }

        return null;
    }

    private static getSpecialType(rowLength: number, colLength: number): SpecialType {
        if (rowLength >= 5 || colLength >= 5 || (rowLength >= 3 && colLength >= 3)) {
            return 'bomb';
        }
        if (rowLength === 4) {
            return 'row';
        }
        if (colLength === 4) {
            return 'col';
        }
        return 'none';
    }

    private static getAffectedCells(
        rows: number,
        cols: number,
        cell: CellCoord,
        specialType: SpecialType,
    ): CellCoord[] {
        const targets: CellCoord[] = [];

        if (specialType === 'row') {
            for (let col = 0; col < cols; col++) {
                targets.push({ row: cell.row, col });
            }
            return targets;
        }

        if (specialType === 'col') {
            for (let row = 0; row < rows; row++) {
                targets.push({ row, col: cell.col });
            }
            return targets;
        }

        if (specialType === 'bomb') {
            for (let row = cell.row - 1; row <= cell.row + 1; row++) {
                for (let col = cell.col - 1; col <= cell.col + 1; col++) {
                    if (row < 0 || row >= rows || col < 0 || col >= cols) {
                        continue;
                    }
                    targets.push({ row, col });
                }
            }
        }

        return targets;
    }
}
