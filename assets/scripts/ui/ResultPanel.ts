import { Color, Graphics, Label, Node, Tween, tween, UIOpacity, UITransform, Vec3, director } from 'cc';
import { BOARD_THEME } from '../data/GameConfig';
import { syncNodeLayer } from './UIHelpers';

export class ResultPanel {
    private readonly root: Node;
    private readonly titleLabel: Label;
    private readonly scoreTitleLabel: Label;
    private readonly scoreLabel: Label;
    private readonly messageLabel: Label;
    private readonly starsLabel: Label;
    private readonly actionLabel: Label;
    private readonly secondaryLabel: Label;
    private readonly actionButton: Node;
    private readonly secondaryButton: Node;

    public constructor(parent: Node) {
        this.root = new Node('ResultPanel');
        this.root.setParent(parent);
        syncNodeLayer(this.root, parent.layer);
        this.root.addComponent(UITransform).setContentSize(1280, 720);
        this.root.addComponent(UIOpacity).opacity = 0;
        this.root.active = false;

        const overlay = new Node('Overlay');
        overlay.setParent(this.root);
        syncNodeLayer(overlay, this.root.layer);
        overlay.addComponent(UITransform).setContentSize(1280, 720);
        const overlayGraphics = overlay.addComponent(Graphics);
        overlayGraphics.fillColor = new Color(3, 8, 20, 190);
        overlayGraphics.rect(-640, -360, 1280, 720);
        overlayGraphics.fill();

        const panel = new Node('Panel');
        panel.setParent(this.root);
        syncNodeLayer(panel, this.root.layer);
        panel.setPosition(0, 0, 0);
        panel.addComponent(UITransform).setContentSize(560, 450);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = BOARD_THEME.panel;
        graphics.roundRect(-280, -225, 560, 450, 42);
        graphics.fill();
        graphics.fillColor = new Color(255, 255, 255, 9);
        graphics.roundRect(-248, 110, 496, 74, 28);
        graphics.fill();
        graphics.strokeColor = BOARD_THEME.panelStroke;
        graphics.lineWidth = 3;
        graphics.roundRect(-278, -223, 556, 446, 42);
        graphics.stroke();

        this.titleLabel = this.createLabel(panel, '', 42, BOARD_THEME.textPrimary, new Vec3(0, 182, 0));
        this.titleLabel.isBold = true;
        this.starsLabel = this.createLabel(panel, '', 34, BOARD_THEME.warning, new Vec3(0, 130, 0));
        this.starsLabel.isBold = true;
        this.scoreTitleLabel = this.createLabel(panel, '本局得分', 20, BOARD_THEME.textSecondary, new Vec3(0, 72, 0));
        this.scoreLabel = this.createLabel(panel, '', 52, BOARD_THEME.warning, new Vec3(0, 24, 0));
        this.scoreLabel.isBold = true;
        this.messageLabel = this.createLabel(panel, '', 22, BOARD_THEME.textSecondary, new Vec3(0, -30, 0));

        this.actionButton = this.createButton(panel, new Vec3(0, -102, 0), BOARD_THEME.accent);
        this.actionLabel = this.createButtonLabel(this.actionButton, '');

        this.secondaryButton = this.createButton(panel, new Vec3(0, -180, 0), BOARD_THEME.warning);
        this.secondaryLabel = this.createButtonLabel(this.secondaryButton, '');
    }

    public showWin(score: number, goalValue: number): void {
        const stars = this.getStars(score, goalValue);
        this.configure(
            '通关成功',
            stars,
            `${score}`,
            '继续打磨下一版吧',
            '再来一局',
            () => director.loadScene('Game'),
            '回到首页',
            () => director.loadScene('Home'),
            BOARD_THEME.accent,
        );
    }

    public showLose(score: number, goalValue: number): void {
        const stars = this.getStars(score, goalValue);
        this.configure(
            '挑战失败',
            stars,
            `${score}`,
            '再试一次会更好',
            '重新开始',
            () => director.loadScene('Game'),
            '回到首页',
            () => director.loadScene('Home'),
            BOARD_THEME.danger,
        );
    }

    public hide(): void {
        this.root.active = false;
        this.root.getComponent(UIOpacity)!.opacity = 0;
        Tween.stopAllByTarget(this.root);
    }

    private configure(
        title: string,
        starsText: string,
        scoreText: string,
        message: string,
        actionText: string,
        action: () => void,
        secondaryText: string,
        secondary: () => void,
        titleColor: Color,
    ): void {
        this.root.active = true;
        this.titleLabel.string = title;
        this.titleLabel.color = titleColor;
        this.starsLabel.string = starsText;
        this.scoreLabel.string = scoreText;
        this.messageLabel.string = message;
        this.actionLabel.string = actionText;
        this.secondaryLabel.string = secondaryText;

        this.actionButton.off(Node.EventType.TOUCH_END);
        this.secondaryButton.off(Node.EventType.TOUCH_END);
        this.actionButton.on(Node.EventType.TOUCH_END, action);
        this.secondaryButton.on(Node.EventType.TOUCH_END, secondary);

        this.root.setScale(new Vec3(0.92, 0.92, 1));
        const opacity = this.root.getComponent(UIOpacity)!;
        opacity.opacity = 0;
        tween(opacity).to(0.18, { opacity: 255 }).start();
        tween(this.root).to(0.18, { scale: Vec3.ONE }).start();
        tween(this.starsLabel.node)
            .set({ scale: new Vec3(0.88, 0.88, 1) })
            .to(0.22, { scale: new Vec3(1.08, 1.08, 1) })
            .start();
    }

    public bringToFront(): void {
        this.root.setSiblingIndex(this.root.parent!.children.length - 1);
    }

    private createButton(parent: Node, position: Vec3, fillColor: Color): Node {
        const button = new Node('Button');
        button.setParent(parent);
        syncNodeLayer(button, parent.layer);
        button.setPosition(position);
        button.addComponent(UITransform).setContentSize(296, 58);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = fillColor;
        graphics.roundRect(-148, -29, 296, 58, 18);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 80);
        graphics.lineWidth = 2;
        graphics.roundRect(-147, -28, 294, 56, 18);
        graphics.stroke();
        return button;
    }

    private createButtonLabel(parent: Node, text: string): Label {
        return this.createLabel(parent, text, 24, new Color(15, 24, 35, 255), Vec3.ZERO);
    }

    private createLabel(parent: Node, text: string, fontSize: number, color: Color, position: Vec3): Label {
        const node = new Node('Label');
        node.setParent(parent);
        syncNodeLayer(node, parent.layer);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(420, 80);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }

    private getStars(score: number, goalValue: number): string {
        if (score >= goalValue * 1.8) {
            return '★ ★ ★';
        }
        if (score >= goalValue * 1.25) {
            return '★ ★ ☆';
        }
        if (score >= goalValue) {
            return '★ ☆ ☆';
        }
        return '☆ ☆ ☆';
    }
}
