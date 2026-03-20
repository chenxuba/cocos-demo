import { _decorator, Color, Component, Graphics, Label, Node, UITransform, director, view } from 'cc';
import { syncNodeLayer } from '../ui/UIHelpers';
import { applyScreenFit } from '../ui/ScreenAdapter';

const { ccclass } = _decorator;

@ccclass('BootController')
export class BootController extends Component {
    protected start(): void {
        applyScreenFit();
        console.log('[BootController] start');
        this.buildLoadingView();
        director.preloadScene('Game');
        console.log('[BootController] loading Home scene');
        director.loadScene('Home');
    }

    private buildLoadingView(): void {
        const size = view.getVisibleSize();
        const background = new Node('BootBackdrop');
        background.setParent(this.node);
        syncNodeLayer(background, this.node.layer);
        background.addComponent(UITransform).setContentSize(size.width, size.height);
        const graphics = background.addComponent(Graphics);
        graphics.fillColor = new Color(9, 12, 26, 255);
        graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
        graphics.fill();

        const labelNode = new Node('BootLabel');
        labelNode.setParent(this.node);
        syncNodeLayer(labelNode, this.node.layer);
        labelNode.setPosition(0, 0, 0);
        labelNode.addComponent(UITransform).setContentSize(520, 120);
        const label = labelNode.addComponent(Label);
        label.string = '正在准备三消世界...';
        label.fontSize = 34;
        label.lineHeight = 42;
        label.isBold = true;
        label.color = new Color(240, 245, 255, 255);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
    }
}
