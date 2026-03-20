import { _decorator, Color, Component, Graphics, JsonAsset, Label, Node, tween, UIOpacity, UITransform, Vec3, director, resources, view } from 'cc';
import { BOARD_THEME, BOARD_TOP_OFFSET } from '../data/GameConfig';
import { DEFAULT_LEVEL_CONFIG, LevelConfig } from '../data/LevelConfig';
import { ComboManager } from './ComboManager';
import { FallManager } from './FallManager';
import { GemView, SwipeDirection } from './GemView';
import { GridManager } from './GridManager';
import { CellCoord, MatchLogic } from './MatchLogic';
import { ProceduralAudio } from './ProceduralAudio';
import { SwapController } from './SwapController';
import { GameHUD } from '../ui/GameHUD';
import { PausePanel } from '../ui/PausePanel';
import { ResultPanel } from '../ui/ResultPanel';
import { syncNodeLayer } from '../ui/UIHelpers';
import { applyScreenFit } from '../ui/ScreenAdapter';

const { ccclass } = _decorator;

@ccclass('GameController')
export class GameController extends Component {
    private level: LevelConfig = DEFAULT_LEVEL_CONFIG;
    private hud!: GameHUD;
    private gridManager!: GridManager;
    private fallManager!: FallManager;
    private comboManager = new ComboManager();
    private swapController!: SwapController;
    private audio = new ProceduralAudio();
    private resultPanel!: ResultPanel;
    private pausePanel!: PausePanel;
    private boardRoot!: Node;

    private score = 0;
    private remainingMoves = this.level.maxMoves;
    private busy = false;
    private finished = false;
    private paused = false;
    private loadingLabel!: Label;

    protected onLoad(): void {
        console.log('[GameController] onLoad');
        applyScreenFit();
        this.ensureCanvasTransform();
        this.buildBackdrop();
        this.resultPanel = new ResultPanel(this.node);
        this.pausePanel = new PausePanel(this.node);
        this.resultPanel.hide();
        this.pausePanel.hide();
        this.buildLoadingLabel();
        this.loadLevel();
    }

    private ensureCanvasTransform(): void {
        const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
        const visibleSize = view.getVisibleSize();
        transform.setContentSize(visibleSize.width, visibleSize.height);
    }

    private buildBackdrop(): void {
        const visibleSize = view.getVisibleSize();
        const background = new Node('Backdrop');
        background.setParent(this.node);
        syncNodeLayer(background, this.node.layer);
        background.setPosition(0, 0, -10);
        const transform = background.addComponent(UITransform);
        transform.setContentSize(visibleSize.width, visibleSize.height);

        const graphics = background.addComponent(Graphics);
        graphics.fillColor = new Color(7, 12, 27, 255);
        graphics.rect(-visibleSize.width / 2, -visibleSize.height / 2, visibleSize.width, visibleSize.height);
        graphics.fill();

        graphics.fillColor = new Color(34, 56, 110, 70);
        graphics.circle(-visibleSize.width * 0.24, visibleSize.height * 0.22, 170);
        graphics.fill();

        graphics.fillColor = new Color(24, 154, 129, 60);
        graphics.circle(visibleSize.width * 0.28, -visibleSize.height * 0.18, 220);
        graphics.fill();

        graphics.fillColor = BOARD_THEME.panel;
        graphics.roundRect(-visibleSize.width * 0.39, -visibleSize.height * 0.16, visibleSize.width * 0.78, visibleSize.height * 0.55, 48);
        graphics.fill();
    }

    private buildLoadingLabel(): void {
        const node = new Node('LoadingLabel');
        node.setParent(this.node);
        syncNodeLayer(node, this.node.layer);
        node.setPosition(0, 0, 0);
        node.addComponent(UITransform).setContentSize(420, 60);
        this.loadingLabel = node.addComponent(Label);
        this.loadingLabel.string = '正在加载关卡...';
        this.loadingLabel.fontSize = 26;
        this.loadingLabel.lineHeight = 34;
        this.loadingLabel.isBold = true;
        this.loadingLabel.color = BOARD_THEME.textPrimary;
        this.loadingLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.loadingLabel.verticalAlign = Label.VerticalAlign.CENTER;
    }

    private loadLevel(): void {
        console.log('[GameController] load level');
        resources.load('levels/level-1', JsonAsset, (error, asset) => {
            if (!error && asset?.json) {
                this.level = {
                    ...DEFAULT_LEVEL_CONFIG,
                    ...(asset.json as Partial<LevelConfig>),
                };
            }

            if (error) {
                console.error('[GameController] level load failed', error);
            } else {
                console.log('[GameController] level loaded', this.level);
            }

            this.remainingMoves = this.level.maxMoves;
            this.loadingLabel.node.destroy();
            this.initializeGame();
        });
    }

    private initializeGame(): void {
        const visibleSize = view.getVisibleSize();
        this.boardRoot = new Node('GameBoard');
        this.boardRoot.setParent(this.node);
        syncNodeLayer(this.boardRoot, this.node.layer);
        this.boardRoot.setPosition(0, BOARD_TOP_OFFSET, 0);

        this.hud = new GameHUD(this.node, visibleSize, this.level, this.handlePause.bind(this));
        this.swapController = new SwapController(this.level.row, this.level.col, this.handleSwap.bind(this));
        this.gridManager = new GridManager(
            this.boardRoot,
            this.level,
            this.handleGemTapped.bind(this),
            this.handleGemSwiped.bind(this),
        );
        this.fallManager = new FallManager(this.gridManager);

        this.hud.updateScore(this.score);
        this.hud.updateMoves(this.remainingMoves);
        this.updateGoalProgress();
        this.hud.setStatus('选择或滑动相邻宝石开始交换');
        this.layoutBoard(visibleSize);
        this.boardRoot.setSiblingIndex(1);
        this.hud.bringToFront();
        this.pausePanel.bringToFront();
        this.resultPanel.bringToFront();
    }

    private async handleGemTapped(view: GemView): Promise<void> {
        if (this.finished || this.paused) {
            return;
        }

        this.audio.playSelect();
        await this.swapController.handleTap(view);
    }

    private async handleGemSwiped(view: GemView, direction: SwipeDirection): Promise<void> {
        if (this.finished || this.paused) {
            return;
        }

        this.audio.playSelect();
        await this.swapController.handleSwipe(view, direction);
    }

    private async handleSwap(a: CellCoord, b: CellCoord): Promise<void> {
        if (this.busy || this.finished) {
            return;
        }

        this.busy = true;
        this.swapController.setLocked(true);
        this.audio.playSwap();
        this.hud.setStatus('交换中...');

        const validSwap =
            MatchLogic.wouldSwapCreateMatch(this.gridManager.board, a, b) ||
            MatchLogic.hasTriggeredSpecialSwap(this.gridManager.board, a, b);
        await this.gridManager.animateSwap(a, b);

        if (!validSwap) {
            this.audio.playInvalid();
            this.hud.setStatus('这一步不会形成三连', BOARD_THEME.danger);
            await this.gridManager.animateSwap(a, b);
            this.busy = false;
            this.swapController.setLocked(false);
            return;
        }

        this.remainingMoves -= 1;
        this.hud.updateMoves(this.remainingMoves);
        this.comboManager.beginMove();

        let totalCleared = 0;
        let cascadeCount = 0;
        let pendingManualClear: CellCoord[] | null = MatchLogic.hasTriggeredSpecialSwap(this.gridManager.board, a, b) ? [a, b] : null;

        while (true) {
            let clearCells: CellCoord[] = [];
            let specialText = '';

            if (pendingManualClear) {
                clearCells = MatchLogic.expandSpecialClears(this.gridManager.board, pendingManualClear);
                pendingManualClear = null;
                specialText = '特殊块触发';
            } else {
                const analysis = MatchLogic.analyzeMatches(this.gridManager.board, cascadeCount === 0 ? [a, b] : []);
                if (analysis.matches.length === 0) {
                    break;
                }

                if (analysis.specialSpawn) {
                    this.gridManager.promoteToSpecial(analysis.specialSpawn);
                    specialText = this.describeSpecial(analysis.specialSpawn.specialType);
                }

                clearCells = MatchLogic.expandSpecialClears(this.gridManager.board, analysis.clearCells);
            }

            cascadeCount += 1;
            totalCleared += clearCells.length;

            const combo = this.comboManager.registerCascade(clearCells.length);
            this.score += combo.points;
            this.hud.updateScore(this.score);
            this.updateGoalProgress();
            this.hud.setStatus(
                `${specialText ? `${specialText}，` : ''}第 ${cascadeCount} 波消除，获得 ${combo.points} 分`,
                BOARD_THEME.accent,
            );
            if (cascadeCount > 1) {
                this.hud.showCombo(`连锁 x${cascadeCount}`);
            }
            this.showFloatingScore(clearCells, combo.points, cascadeCount);
            this.audio.playMatch(cascadeCount);

            await this.fallManager.resolve(clearCells);
        }

        if (totalCleared === 0) {
            this.hud.setStatus('没有匹配，状态已回滚', BOARD_THEME.danger);
        } else if (this.score >= this.level.goalValue) {
            this.finished = true;
            this.audio.playWin();
            this.hud.setStatus(`目标达成，通关得分 ${this.score}`, BOARD_THEME.accent);
            this.hud.bringToFront();
            this.pausePanel.hide();
            this.resultPanel.showWin(this.score, this.level.goalValue);
            this.resultPanel.bringToFront();
        } else if (this.remainingMoves <= 0) {
            this.finished = true;
            this.audio.playLose();
            this.hud.setStatus(`步数用尽，最终得分 ${this.score}`, BOARD_THEME.danger);
            this.hud.bringToFront();
            this.pausePanel.hide();
            this.resultPanel.showLose(this.score, this.level.goalValue);
            this.resultPanel.bringToFront();
        } else if (!MatchLogic.hasPossibleMove(this.gridManager.board)) {
            this.hud.setStatus('没有合法移动，正在洗牌...', BOARD_THEME.warning);
            await this.gridManager.rebuildBoard();
            this.hud.setStatus('已洗牌，继续挑战', BOARD_THEME.warning);
        } else {
            this.hud.setStatus(`本步消除了 ${totalCleared} 个宝石`, BOARD_THEME.warning);
        }

        this.busy = false;
        this.swapController.setLocked(this.finished);
    }

    private handlePause(): void {
        if (this.busy || this.finished || this.paused) {
            return;
        }

        this.paused = true;
        this.swapController.setLocked(true);
        this.pausePanel.show(
            this.handleContinue.bind(this),
            this.handleRestart.bind(this),
            this.handleBackHome.bind(this),
        );
        this.pausePanel.bringToFront();
    }

    private handleContinue(): void {
        this.paused = false;
        this.pausePanel.hide();
        this.swapController.setLocked(false);
        this.hud.bringToFront();
    }

    private handleRestart(): void {
        director.loadScene('Game');
    }

    private handleBackHome(): void {
        director.loadScene('Home');
    }

    private updateGoalProgress(): void {
        if (!this.hud) {
            return;
        }

        const progress = Math.min(this.score, this.level.goalValue);
        this.hud.updateGoal(`${progress}/${this.level.goalValue}`);
    }

    private showFloatingScore(cells: CellCoord[], points: number, cascadeIndex: number): void {
        if (!this.boardRoot || cells.length === 0) {
            return;
        }

        let sumX = 0;
        let sumY = 0;
        for (const cell of cells) {
            const position = this.gridManager.getCellLocalPosition(cell.row, cell.col);
            sumX += position.x;
            sumY += position.y;
        }

        const labelNode = new Node('ScoreBurst');
        labelNode.setParent(this.boardRoot);
        syncNodeLayer(labelNode, this.boardRoot.layer);
        labelNode.setPosition(sumX / cells.length, sumY / cells.length, 0);
        labelNode.addComponent(UITransform).setContentSize(220, 60);
        const opacity = labelNode.addComponent(UIOpacity);
        opacity.opacity = 255;
        const label = labelNode.addComponent(Label);
        label.string = `+${points}`;
        label.fontSize = cascadeIndex > 1 ? 34 : 28;
        label.lineHeight = label.fontSize + 6;
        label.isBold = true;
        label.color = cascadeIndex > 1 ? BOARD_THEME.accent : BOARD_THEME.warning;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        tween(labelNode)
            .parallel(
                tween(labelNode).by(0.42, { position: new Vec3(0, 72, 0) }),
                tween(labelNode).to(0.42, { scale: new Vec3(1.12, 1.12, 1) }),
                tween(opacity).to(0.42, { opacity: 0 }),
            )
            .call(() => labelNode.destroy())
            .start();
    }

    private layoutBoard(visibleSize: { width: number; height: number }): void {
        const boardSize = this.gridManager.getBoardSize();
        const sidePanelWidth = 230;
        const outerPadding = 56;
        const maxBoardWidth = visibleSize.width - sidePanelWidth * 2 - outerPadding * 3;
        const maxBoardHeight = visibleSize.height - 164;
        const boardScale = Math.min(1, maxBoardWidth / boardSize.width, maxBoardHeight / boardSize.height);

        this.boardRoot.setScale(new Vec3(boardScale, boardScale, 1));
        this.boardRoot.setPosition(0, 10, 0);
        this.gridManager.setTransform(this.boardRoot.position.clone(), this.boardRoot.scale.clone());
        console.log('[GameController] board layout', {
            visibleSize,
            boardSize,
            boardScale,
            boardPosition: { x: 0, y: 10 },
        });
    }

    private describeSpecial(type: 'row' | 'col' | 'bomb' | 'none'): string {
        if (type === 'row') {
            return '生成横向清除块';
        }
        if (type === 'col') {
            return '生成纵向清除块';
        }
        if (type === 'bomb') {
            return '生成炸弹块';
        }
        return '';
    }
}
