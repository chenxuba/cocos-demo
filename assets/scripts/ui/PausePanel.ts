import { Color, Graphics, Label, Node, Tween, tween, UIOpacity, UITransform, Vec3 } from 'cc';
import { BOARD_THEME } from '../data/GameConfig';
import { syncNodeLayer } from './UIHelpers';

export class PausePanel {
    private readonly root: Node;
    private readonly titleLabel: Label;
    private readonly continueButton: Node;
    private readonly restartButton: Node;
    private readonly homeButton: Node;

    public constructor(parent: Node) {
        this.root = new Node('PausePanel');
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
        overlayGraphics.fillColor = new Color(5, 10, 23, 178);
        overlayGraphics.rect(-640, -360, 1280, 720);
        overlayGraphics.fill();

        const panel = new Node('Panel');
        panel.setParent(this.root);
        syncNodeLayer(panel, this.root.layer);
        panel.setPosition(0, 0, 0);
        panel.addComponent(UITransform).setContentSize(460, 320);
        const graphics = panel.addComponent(Graphics);
        graphics.fillColor = BOARD_THEME.panel;
        graphics.roundRect(-230, -160, 460, 320, 34);
        graphics.fill();
        graphics.strokeColor = BOARD_THEME.panelStroke;
        graphics.lineWidth = 3;
        graphics.roundRect(-228, -158, 456, 316, 34);
        graphics.stroke();

        this.titleLabel = this.createLabel(panel, '游戏暂停', 40, BOARD_THEME.textPrimary, new Vec3(0, 92, 0));
        this.titleLabel.isBold = true;

        const hint = this.createLabel(panel, '继续、重开或回到首页', 20, BOARD_THEME.textSecondary, new Vec3(0, 48, 0));
        hint.isBold = false;

        this.continueButton = this.createButton(panel, new Vec3(0, -12, 0), BOARD_THEME.accent, '继续游戏');
        this.restartButton = this.createButton(panel, new Vec3(0, -74, 0), BOARD_THEME.warning, '重新开始');
        this.homeButton = this.createButton(panel, new Vec3(0, -136, 0), BOARD_THEME.danger, '返回首页');
    }

    public show(onContinue: () => void, onRestart: () => void, onHome: () => void): void {
        this.root.active = true;
        this.bindAction(this.continueButton, onContinue);
        this.bindAction(this.restartButton, onRestart);
        this.bindAction(this.homeButton, onHome);
        this.root.setScale(new Vec3(0.94, 0.94, 1));
        const opacity = this.root.getComponent(UIOpacity)!;
        opacity.opacity = 0;
        tween(opacity).to(0.18, { opacity: 255 }).start();
        tween(this.root).to(0.18, { scale: Vec3.ONE }).start();
    }

    public hide(): void {
        this.root.active = false;
        this.root.getComponent(UIOpacity)!.opacity = 0;
        Tween.stopAllByTarget(this.root);
    }

    public bringToFront(): void {
        this.root.setSiblingIndex(this.root.parent!.children.length - 1);
    }

    private bindAction(button: Node, action: () => void): void {
        button.off(Node.EventType.TOUCH_END);
        button.on(Node.EventType.TOUCH_END, action);
    }

    private createButton(parent: Node, position: Vec3, fillColor: Color, text: string): Node {
        const button = new Node(`${text}Button`);
        button.setParent(parent);
        syncNodeLayer(button, parent.layer);
        button.setPosition(position);
        button.addComponent(UITransform).setContentSize(260, 52);
        const graphics = button.addComponent(Graphics);
        graphics.fillColor = fillColor;
        graphics.roundRect(-130, -26, 260, 52, 18);
        graphics.fill();
        graphics.strokeColor = new Color(255, 255, 255, 90);
        graphics.lineWidth = 2;
        graphics.roundRect(-129, -25, 258, 50, 18);
        graphics.stroke();
        const label = this.createLabel(button, text, 22, new Color(14, 22, 35, 255), Vec3.ZERO);
        label.isBold = true;
        return button;
    }

    private createLabel(parent: Node, text: string, fontSize: number, color: Color, position: Vec3): Label {
        const node = new Node('Label');
        node.setParent(parent);
        syncNodeLayer(node, parent.layer);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(320, 60);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 6;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }
}
