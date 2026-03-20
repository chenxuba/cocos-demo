import { Color, Graphics, Node, tween, UITransform, Vec3 } from 'cc';
import { ANIMATION, BOARD_PADDING, BOARD_THEME, EMPTY_GEM } from '../data/GameConfig';
import { LevelConfig } from '../data/LevelConfig';
import { CellCoord } from './MatchLogic';
import { GemView, SwipeDirection } from './GemView';
import { GemData, cloneGemData, createGemData, isEmptyGem } from './BoardTypes';
import { SpecialSpawn } from './MatchLogic';
import { syncNodeLayer } from '../ui/UIHelpers';

type GemTapHandler = (view: GemView) => void;
type GemSwipeHandler = (view: GemView, direction: SwipeDirection) => void;

export class GridManager {
    public readonly board: GemData[][];
    public readonly views: Array<Array<GemView | null>>;

    private readonly root: Node;
    private readonly level: LevelConfig;
    private readonly rows: number;
    private readonly cols: number;
    private readonly cellSize: number;
    private readonly tapHandler: GemTapHandler;
    private readonly swipeHandler: GemSwipeHandler;

    private readonly gemLayer: Node;
    private readonly boardFrame: Node;
    private readonly host: Node;

    public constructor(root: Node, level: LevelConfig, tapHandler: GemTapHandler, swipeHandler: GemSwipeHandler) {
        this.root = root;
        this.level = level;
        this.rows = level.row;
        this.cols = level.col;
        this.cellSize = level.cellSize;
        this.tapHandler = tapHandler;
        this.swipeHandler = swipeHandler;
        this.host = this.root.parent ?? this.root;
        this.board = Array.from(
            { length: this.rows },
            () => Array.from({ length: this.cols }, () => createGemData(EMPTY_GEM)),
        );
        this.views = Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => null));

        const transform = this.root.getComponent(UITransform) ?? this.root.addComponent(UITransform);
        transform.setContentSize(this.cols * this.cellSize + BOARD_PADDING * 2, this.rows * this.cellSize + BOARD_PADDING * 2);

        this.boardFrame = new Node('BoardFrame');
        this.boardFrame.setParent(this.host);
        syncNodeLayer(this.boardFrame, this.root.layer);
        this.boardFrame.setPosition(this.root.position);
        this.boardFrame.setScale(this.root.scale);
        const frameTransform = this.boardFrame.addComponent(UITransform);
        frameTransform.setContentSize(transform.contentSize);

        this.gemLayer = new Node('GemLayer');
        this.gemLayer.setParent(this.host);
        syncNodeLayer(this.gemLayer, this.root.layer);
        this.gemLayer.setPosition(this.root.position);
        this.gemLayer.setScale(this.root.scale);
        const gemTransform = this.gemLayer.addComponent(UITransform);
        gemTransform.setContentSize(this.cols * this.cellSize, this.rows * this.cellSize);

        this.drawBoard();
        this.populateInitialBoard();
    }

    public getBoardSize(): { width: number; height: number } {
        return {
            width: this.cols * this.cellSize,
            height: this.rows * this.cellSize,
        };
    }

    public setTransform(position: Vec3, scale: Vec3): void {
        this.boardFrame.setPosition(position);
        this.boardFrame.setScale(scale);
        this.gemLayer.setPosition(position);
        this.gemLayer.setScale(scale);
    }

    public getCellLocalPosition(row: number, col: number): Vec3 {
        return this.getCellPosition(row, col).clone();
    }

    public getGemType(row: number, col: number): GemData {
        return this.board[row][col];
    }

    public getGemView(row: number, col: number): GemView | null {
        return this.views[row][col];
    }

    public async animateSwap(a: CellCoord, b: CellCoord, duration = ANIMATION.swap): Promise<void> {
        const viewA = this.views[a.row][a.col];
        const viewB = this.views[b.row][b.col];
        if (!viewA || !viewB) {
            return;
        }

        const posA = this.getCellPosition(a.row, a.col);
        const posB = this.getCellPosition(b.row, b.col);
        this.swapData(a, b);

        await Promise.all([
            this.tweenTo(viewA.node, posB, duration),
            this.tweenTo(viewB.node, posA, duration),
        ]);
    }

    public async clearCells(cells: CellCoord[]): Promise<void> {
        await Promise.all(cells.map(async (cell) => {
            const view = this.views[cell.row][cell.col];
            this.board[cell.row][cell.col] = createGemData(EMPTY_GEM);
            this.views[cell.row][cell.col] = null;

            if (!view) {
                return;
            }

            const opacity = view.getOpacity();
            view.setSelected(false);

            await new Promise<void>((resolve) => {
                tween(view.node)
                    .parallel(
                        tween(view.node).to(ANIMATION.clear, {
                            scale: new Vec3(0.2, 0.2, 1),
                        }),
                        tween(opacity).to(ANIMATION.clear, { opacity: 0 }),
                    )
                    .call(() => {
                        view.node.destroy();
                        resolve();
                    })
                    .start();
            });
        }));
    }

    public async collapseAndFill(): Promise<void> {
        const moveTasks: Array<Promise<void>> = [];

        for (let col = 0; col < this.cols; col++) {
            let writeRow = this.rows - 1;
            for (let row = this.rows - 1; row >= 0; row--) {
                if (isEmptyGem(this.board[row][col])) {
                    continue;
                }

                if (writeRow !== row) {
                    this.board[writeRow][col] = this.board[row][col];
                    this.board[row][col] = createGemData(EMPTY_GEM);

                    const view = this.views[row][col];
                    this.views[writeRow][col] = view;
                    this.views[row][col] = null;

                    if (view) {
                        view.updateGem(writeRow, col, this.board[writeRow][col]);
                        moveTasks.push(this.tweenTo(view.node, this.getCellPosition(writeRow, col), ANIMATION.fall));
                    }
                }

                writeRow--;
            }

            for (let row = 0; row <= writeRow; row++) {
                const gemType = this.pickGemType(row, col);
                this.board[row][col] = createGemData(gemType);
                const dropDistance = writeRow - row + 2;
                const view = this.createGemView(row, col, this.board[row][col], dropDistance);
                this.views[row][col] = view;
                moveTasks.push(this.tweenTo(view.node, this.getCellPosition(row, col), ANIMATION.spawn));
            }
        }

        await Promise.all(moveTasks);
    }

    public async rebuildBoard(): Promise<void> {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.views[row][col]?.node.destroy();
                this.views[row][col] = null;
                this.board[row][col] = createGemData(EMPTY_GEM);
            }
        }

        this.populateInitialBoard();
    }

    public promoteToSpecial(spawn: SpecialSpawn): void {
        const target = this.board[spawn.cell.row][spawn.cell.col];
        target.gemType = spawn.gemType;
        target.specialType = spawn.specialType;
        this.views[spawn.cell.row][spawn.cell.col]?.updateGem(spawn.cell.row, spawn.cell.col, target);
    }

    private drawBoard(): void {
        const graphics = this.boardFrame.getComponent(Graphics) ?? this.boardFrame.addComponent(Graphics);
        const transform = this.boardFrame.getComponent(UITransform)!;
        const width = transform.contentSize.width;
        const height = transform.contentSize.height;
        const left = -width / 2;
        const bottom = -height / 2;

        graphics.clear();
        graphics.fillColor = BOARD_THEME.background;
        graphics.roundRect(left, bottom, width, height, 28);
        graphics.fill();

        graphics.strokeColor = BOARD_THEME.boardGlow;
        graphics.lineWidth = 4;
        graphics.roundRect(left + 2, bottom + 2, width - 4, height - 4, 28);
        graphics.stroke();

        graphics.fillColor = new Color(255, 255, 255, 12);
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = -this.cols * this.cellSize / 2 + col * this.cellSize;
                const y = this.rows * this.cellSize / 2 - (row + 1) * this.cellSize;
                graphics.roundRect(
                    x - 2,
                    y + 2,
                    this.cellSize - 8,
                    this.cellSize - 8,
                    18,
                );
                graphics.fill();
            }
        }
    }

    private populateInitialBoard(): void {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const gemType = this.pickGemType(row, col);
                this.board[row][col] = createGemData(gemType);
                this.views[row][col] = this.createGemView(row, col, this.board[row][col], 0);
            }
        }
    }

    private pickGemType(row: number, col: number): number {
        const candidates = [...this.level.gemTypes];
        for (let index = candidates.length - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
        }

        for (const candidate of candidates) {
            if (this.willCreateImmediateMatch(row, col, candidate)) {
                continue;
            }
            return candidate;
        }

        return candidates[0];
    }

    private willCreateImmediateMatch(row: number, col: number, gemType: number): boolean {
        return (
            (col >= 2 &&
                this.board[row][col - 1].gemType === gemType &&
                this.board[row][col - 2].gemType === gemType) ||
            (row >= 2 &&
                this.board[row - 1][col].gemType === gemType &&
                this.board[row - 2][col].gemType === gemType)
        );
    }

    private createGemView(row: number, col: number, gemData: GemData, dropDistance: number): GemView {
        const node = new Node(`Gem-${row}-${col}`);
        node.setParent(this.gemLayer);
        syncNodeLayer(node, this.root.layer);
        node.setPosition(this.getCellPosition(row, col));
        if (dropDistance > 0) {
            node.setPosition(this.getCellPosition(row - dropDistance, col));
        }

        const view = node.addComponent(GemView);
        view.initialize(row, col, cloneGemData(gemData), this.cellSize - 12, this.tapHandler, this.swipeHandler);
        node.setScale(dropDistance > 0 ? new Vec3(0.92, 0.92, 1) : new Vec3(1, 1, 1));
        return view;
    }

    private getCellPosition(row: number, col: number): Vec3 {
        const x = (col - (this.cols - 1) / 2) * this.cellSize;
        const y = ((this.rows - 1) / 2 - row) * this.cellSize;
        return new Vec3(x, y, 0);
    }

    private swapData(a: CellCoord, b: CellCoord): void {
        const boardValue = this.board[a.row][a.col];
        this.board[a.row][a.col] = this.board[b.row][b.col];
        this.board[b.row][b.col] = boardValue;

        const view = this.views[a.row][a.col];
        this.views[a.row][a.col] = this.views[b.row][b.col];
        this.views[b.row][b.col] = view;

        this.views[a.row][a.col]?.updateGem(a.row, a.col, this.board[a.row][a.col]);
        this.views[b.row][b.col]?.updateGem(b.row, b.col, this.board[b.row][b.col]);
    }

    private tweenTo(target: Node, position: Vec3, duration: number): Promise<void> {
        return new Promise((resolve) => {
            tween(target)
                .to(duration, { position })
                .call(() => resolve())
                .start();
        });
    }
}
