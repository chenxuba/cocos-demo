import { CellCoord } from './MatchLogic';
import { GridManager } from './GridManager';

export class FallManager {
    public constructor(private readonly gridManager: GridManager) {}

    public async resolve(cells: CellCoord[]): Promise<void> {
        await this.gridManager.clearCells(cells);
        await this.gridManager.collapseAndFill();
    }
}
