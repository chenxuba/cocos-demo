import { GemView } from './GemView';
import { CellCoord, MatchLogic } from './MatchLogic';
import { SwipeDirection } from './GemView';

export class SwapController {
    private selectedView: GemView | null = null;
    private locked = false;

    public constructor(
        private readonly rows: number,
        private readonly cols: number,
        private readonly onSwap: (a: CellCoord, b: CellCoord) => Promise<void>,
    ) {}

    public setLocked(locked: boolean): void {
        this.locked = locked;
        if (locked) {
            this.clearSelection();
        }
    }

    public async handleTap(view: GemView): Promise<void> {
        if (this.locked) {
            return;
        }

        if (!this.selectedView) {
            this.selectedView = view;
            view.setSelected(true);
            return;
        }

        if (this.selectedView === view) {
            this.clearSelection();
            return;
        }

        const from = { row: this.selectedView.row, col: this.selectedView.col };
        const to = { row: view.row, col: view.col };

        if (!MatchLogic.isAdjacent(from, to)) {
            this.selectedView.setSelected(false);
            this.selectedView = view;
            this.selectedView.setSelected(true);
            return;
        }

        const first = this.selectedView;
        this.clearSelection();
        await this.onSwap({ row: first.row, col: first.col }, to);
    }

    public async handleSwipe(view: GemView, direction: SwipeDirection): Promise<void> {
        if (this.locked) {
            return;
        }

        this.clearSelection();
        const delta = this.getDirectionOffset(direction);
        const target = {
            row: view.row + delta.row,
            col: view.col + delta.col,
        };

        if (target.row < 0 || target.row >= this.rows || target.col < 0 || target.col >= this.cols) {
            return;
        }

        await this.onSwap({ row: view.row, col: view.col }, target);
    }

    public clearSelection(): void {
        this.selectedView?.setSelected(false);
        this.selectedView = null;
    }

    private getDirectionOffset(direction: SwipeDirection): CellCoord {
        if (direction === 'left') {
            return { row: 0, col: -1 };
        }
        if (direction === 'right') {
            return { row: 0, col: 1 };
        }
        if (direction === 'up') {
            return { row: -1, col: 0 };
        }
        return { row: 1, col: 0 };
    }
}
