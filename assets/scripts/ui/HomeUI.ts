import { _decorator, Color, Component, Graphics, Label, Node, UITransform, Vec3, director, tween, view } from 'cc';
import { syncNodeLayer } from './UIHelpers';
import { applyScreenFit } from './ScreenAdapter';

const { ccclass } = _decorator;

@ccclass('HomeUI')
export class HomeUI extends Component {
    private loading = false;
    private startButton!: Node;

    protected onLoad(): void {
        applyScreenFit();
        console.log('[HomeUI] onLoad');
        this.buildHome();
    }

    private buildHome(): void {
        const size = view.getVisibleSize();
        this.node.getComponent(UITransform)?.setContentSize(size.width, size.height);

        const background = new Node('HomeBackdrop');
        background.setParent(this.node);
        syncNodeLayer(background, this.node.layer);
        background.addComponent(UITransform).setContentSize(size.width, size.height);
        const graphics = background.addComponent(Graphics);
        graphics.fillColor = new Color(10, 16, 36, 255);
        graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
        graphics.fill();

        graphics.fillColor = new Color(55, 86, 178, 80);
        graphics.circle(-260, 180, 180);
        graphics.fill();
        graphics.fillColor = new Color(19, 171, 145, 72);
        graphics.circle(320, -120, 220);
        graphics.fill();

        const title = this.createLabel('星潮三消', 56, new Color(245, 248, 255, 255), new Vec3(0, 180, 0));
        title.isBold = true;

        const subtitle = this.createLabel(
            '由代码生成的宝石、美术与基础音效',
            24,
            new Color(180, 194, 228, 255),
            new Vec3(0, 122, 0),
        );
        subtitle.isBold = false;

        this.startButton = new Node('StartButton');
        this.startButton.setParent(this.node);
        syncNodeLayer(this.startButton, this.node.layer);
        this.startButton.setPosition(0, -16, 0);
        this.startButton.addComponent(UITransform).setContentSize(300, 92);
        const buttonGraphics = this.startButton.addComponent(Graphics);
        buttonGraphics.fillColor = new Color(35, 203, 164, 255);
        buttonGraphics.roundRect(-150, -46, 300, 92, 28);
        buttonGraphics.fill();
        buttonGraphics.strokeColor = new Color(230, 255, 248, 180);
        buttonGraphics.lineWidth = 3;
        buttonGraphics.roundRect(-149, -45, 298, 90, 28);
        buttonGraphics.stroke();

        const startLabel = new Node('StartLabel');
        startLabel.setParent(this.startButton);
        syncNodeLayer(startLabel, this.node.layer);
        startLabel.addComponent(UITransform).setContentSize(260, 60);
        const label = startLabel.addComponent(Label);
        label.string = '开始游戏';
        label.fontSize = 32;
        label.lineHeight = 38;
        label.isBold = true;
        label.color = new Color(13, 33, 41, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;

        const tip = this.createLabel(
            '目标：20 步内拿到 3000 分',
            22,
            new Color(255, 216, 122, 255),
            new Vec3(0, -118, 0),
        );

        const footer = this.createLabel(
            '点击两个相邻宝石交换，凑出三连或更多',
            18,
            new Color(173, 184, 214, 255),
            new Vec3(0, -size.height / 2 + 56, 0),
        );
        footer.isBold = false;
        tip.isBold = true;

        this.startButton.on(Node.EventType.TOUCH_START, this.handleButtonDown, this);
        this.startButton.on(Node.EventType.TOUCH_END, this.handleStart, this);
        this.startButton.on(Node.EventType.TOUCH_CANCEL, this.handleButtonUp, this);
    }

    private handleButtonDown(): void {
        if (this.loading) {
            return;
        }
        tween(this.startButton).to(0.08, { scale: new Vec3(0.96, 0.96, 1) }).start();
    }

    private handleButtonUp(): void {
        tween(this.startButton).to(0.08, { scale: Vec3.ONE }).start();
    }

    private handleStart(): void {
        if (this.loading) {
            return;
        }
        console.log('[HomeUI] start game');
        this.loading = true;
        this.handleButtonUp();
        director.loadScene('Game');
    }

    private createLabel(text: string, fontSize: number, color: Color, position: Vec3): Label {
        const node = new Node(text);
        node.setParent(this.node);
        syncNodeLayer(node, this.node.layer);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(720, 72);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return label;
    }
}
