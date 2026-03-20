import { Color, Graphics, Label, Node, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { ANIMATION, BOARD_THEME } from '../data/GameConfig';
import { LevelConfig } from '../data/LevelConfig';
import { syncNodeLayer } from './UIHelpers';

export class GameHUD {
    private readonly root: Node;
    private readonly scoreLabel: Label;
    private readonly movesLabel: Label;
    private readonly goalLabel: Label;
    private readonly statusLabel: Label;
    private readonly comboLabel: Label;
    private readonly comboNode: Node;
    private readonly statusPanel: Node;

    public constructor(
        parent: Node,
        size: { width: number; height: number },
        level: LevelConfig,
        onPause: () => void,
    ) {
        this.root = new Node('HUD');
        this.root.setParent(parent);
        syncNodeLayer(this.root, parent.layer);

        const title = this.createLabel(
            this.root,
            '星潮三消',
            38,
            BOARD_THEME.textPrimary,
            new Vec3(0, size.height / 2 - 30, 0),
            360,
            52,
        );
        title.isBold = true;

        this.createSidePanel('左侧面板', new Vec3(-420, 18, 0), 230, 270);
        this.createSidePanel('右侧面板', new Vec3(420, 18, 0), 230, 270);

        this.scoreLabel = this.createStatBlock('分数', new Vec3(-420, 118, 0), '0');
        this.movesLabel = this.createStatBlock('步数', new Vec3(420, 118, 0), `${level.maxMoves}`);
        this.goalLabel = this.createStatBlock('目标', new Vec3(420, 8, 0), `0/${level.goalValue}`);

        const hintTitle = this.createLabel(
            this.root,
            '玩法提示',
            18,
            BOARD_THEME.textSecondary,
            new Vec3(-420, 8, 0),
            180,
            28,
        );
        hintTitle.isBold = true;

        const hintText = this.createLabel(
            this.root,
            '点击或滑动相邻宝石\n凑出三连并制造连锁',
            20,
            BOARD_THEME.textPrimary,
            new Vec3(-420, -52, 0),
            190,
            88,
        );
        hintText.isBold = false;

        this.createPauseButton(new Vec3(420, -108, 0), onPause);

        this.statusPanel = this.createStatusPanel(new Vec3(0, -size.height / 2 + 24, 0));
        this.statusLabel = this.createLabel(
            this.root,
            '准备开始',
            22,
            BOARD_THEME.warning,
            new Vec3(0, -size.height / 2 + 24, 0),
            520,
            42,
        );
        this.statusPanel.setSiblingIndex(this.statusLabel.node.getSiblingIndex());
        this.statusLabel.node.setSiblingIndex(this.statusPanel.getSiblingIndex() + 1);

        this.comboNode = new Node('ComboLabel');
        this.comboNode.setParent(this.root);
        syncNodeLayer(this.comboNode, this.root.layer);
        this.comboNode.setPosition(0, size.height / 2 - 104, 0);
        this.comboNode.addComponent(UITransform).setContentSize(320, 48);
        this.comboNode.addComponent(UIOpacity).opacity = 0;
        this.comboNode.active = false;
        const comboBg = this.comboNode.addComponent(Graphics);
        comboBg.fillColor = new Color(13, 28, 55, 220);
        comboBg.roundRect(-160, -24, 320, 48, 20);
        comboBg.fill();
        comboBg.strokeColor = new Color(104, 255, 205, 120);
        comboBg.lineWidth = 2;
        comboBg.roundRect(-159, -23, 318, 46, 20);
        comboBg.stroke();
        const comboTextNode = new Node('ComboText');
        comboTextNode.setParent(this.comboNode);
        syncNodeLayer(comboTextNode, this.root.layer);
        comboTextNode.addComponent(UITransform).setContentSize(280, 40);
        this.comboLabel = comboTextNode.addComponent(Label);
        this.comboLabel.fontSize = 22;
        this.comboLabel.lineHeight = 26;
        this.comboLabel.color = BOARD_THEME.accent;
        this.comboLabel.isBold = true;
        this.comboLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        this.comboLabel.verticalAlign = Label.VerticalAlign.CENTER;
        this.comboLabel.string = '';
    }

    public updateScore(score: number): void {
        this.scoreLabel.string = `${score}`;
    }

    public updateMoves(moves: number): void {
        this.movesLabel.string = `${moves}`;
    }

    public updateGoal(goalText: string): void {
        this.goalLabel.string = goalText;
    }

    public setStatus(message: string, color = BOARD_THEME.warning): void {
        this.statusLabel.string = message;
        this.statusLabel.color = color;
    }

    public bringToFront(): void {
        this.root.setSiblingIndex(this.root.parent!.children.length - 1);
    }

    public showCombo(message: string): void {
        const opacity = this.comboNode.getComponent(UIOpacity)!;
        this.comboLabel.string = message;
        this.comboNode.active = !!message;
        this.comboNode.setScale(Vec3.ONE);
        tween(opacity)
            .set({ opacity: 255 })
            .to(ANIMATION.comboPop, { opacity: 0 })
            .call(() => {
                this.comboNode.active = false;
            })
            .start();
        tween(this.comboNode)
            .set({ scale: new Vec3(0.84, 0.84, 1) })
            .to(ANIMATION.comboPop, { scale: new Vec3(1.08, 1.08, 1) })
            .start();
    }

    private createSidePanel(name: string, position: Vec3, width: number, height: number): void {
        const panel = new Node(name);
        panel.setParent(this.root);
        syncNodeLayer(panel, this.root.layer);
        panel.setPosition(position);
        panel.addComponent(UITransform).setContentSize(width, height);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(12, 18, 34, 218);
        graphics.roundRect(-width / 2, -height / 2, width, height, 32);
        graphics.fill();
        graphics.strokeColor = new Color(80, 103, 184, 180);
        graphics.lineWidth = 3;
        graphics.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4, 32);
        graphics.stroke();
    }

    private createStatBlock(title: string, position: Vec3, initialValue: string): Label {
        const block = new Node(`${title}Block`);
        block.setParent(this.root);
        syncNodeLayer(block, this.root.layer);
        block.setPosition(position);
        block.addComponent(UITransform).setContentSize(180, 86);
        const graphics = block.addComponent(Graphics);
        graphics.fillColor = new Color(24, 33, 57, 240);
        graphics.roundRect(-90, -43, 180, 86, 24);
        graphics.fill();
        graphics.fillColor = new Color(255, 255, 255, 8);
        graphics.roundRect(-82, 8, 164, 24, 12);
        graphics.fill();
        graphics.strokeColor = BOARD_THEME.panelStroke;
        graphics.lineWidth = 2;
        graphics.roundRect(-89, -42, 178, 84, 24);
        graphics.stroke();

        const titleLabel = this.createLabel(
            block,
            title,
            16,
            BOARD_THEME.textSecondary,
            new Vec3(0, 18, 0),
            150,
            24,
        );
        titleLabel.isBold = true;

        const valueLabel = this.createLabel(
            block,
            initialValue,
            28,
            BOARD_THEME.textPrimary,
            new Vec3(0, -12, 0),
            150,
            34,
        );
        valueLabel.isBold = true;
        return valueLabel;
    }

    private createPauseButton(position: Vec3, onPause: () => void): void {
        const button = new Node('PauseButton');
        button.setParent(this.root);
        syncNodeLayer(button, this.root.layer);
        button.setPosition(position);
        button.addComponent(UITransform).setContentSize(86, 86);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = new Color(17, 27, 48, 245);
        graphics.roundRect(-43, -43, 86, 86, 24);
        graphics.fill();
        graphics.strokeColor = new Color(96, 122, 214, 200);
        graphics.lineWidth = 2;
        graphics.roundRect(-42, -42, 84, 84, 24);
        graphics.stroke();
        graphics.fillColor = BOARD_THEME.textPrimary;
        graphics.roundRect(-15, -20, 9, 40, 4);
        graphics.fill();
        graphics.roundRect(6, -20, 9, 40, 4);
        graphics.fill();
        button.on(Node.EventType.TOUCH_END, onPause);
    }

    private createStatusPanel(position: Vec3): Node {
        const panel = new Node('StatusPanel');
        panel.setParent(this.root);
        syncNodeLayer(panel, this.root.layer);
        panel.setPosition(position);
        panel.addComponent(UITransform).setContentSize(520, 52);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = new Color(12, 18, 34, 220);
        graphics.roundRect(-260, -26, 520, 52, 24);
        graphics.fill();
        graphics.strokeColor = new Color(88, 109, 182, 190);
        graphics.lineWidth = 2;
        graphics.roundRect(-259, -25, 518, 50, 24);
        graphics.stroke();
        return panel;
    }

    private createLabel(
        parent: Node,
        text: string,
        fontSize: number,
        color: Color,
        position: Vec3,
        width = 500,
        height = 40,
    ): Label {
        const node = new Node(`${text}-Label`);
        node.setParent(parent);
        syncNodeLayer(node, parent.layer);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        return label;
    }
}
