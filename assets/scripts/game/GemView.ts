import { _decorator, Color, Component, EventTouch, Graphics, Node, tween, Tween, UIOpacity, UITransform, Vec2, Vec3 } from 'cc';
import { GEM_PALETTE } from '../data/GameConfig';
import { GemData } from './BoardTypes';

const { ccclass } = _decorator;
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

@ccclass('GemView')
export class GemView extends Component {
    public row = 0;
    public col = 0;
    public gemData!: GemData;

    private graphics!: Graphics;
    private opacity!: UIOpacity;
    private size = 72;
    private selected = false;
    private onTap: ((view: GemView) => void) | null = null;
    private onSwipe: ((view: GemView, direction: SwipeDirection) => void) | null = null;
    private touchStart = new Vec2();
    private swipeTriggered = false;

    public initialize(
        row: number,
        col: number,
        gemData: GemData,
        size: number,
        onTap: (view: GemView) => void,
        onSwipe: (view: GemView, direction: SwipeDirection) => void,
    ): void {
        this.row = row;
        this.col = col;
        this.gemData = { ...gemData };
        this.size = size;
        this.onTap = onTap;
        this.onSwipe = onSwipe;

        const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
        transform.setContentSize(this.size, this.size);

        this.opacity = this.node.getComponent(UIOpacity) ?? this.node.addComponent(UIOpacity);
        this.opacity.opacity = 255;
        this.graphics = this.node.getComponent(Graphics) ?? this.node.addComponent(Graphics);

        this.node.off(Node.EventType.TOUCH_START, this.handleTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.handleTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.handleTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.handleTouchCancel, this);
        this.node.on(Node.EventType.TOUCH_START, this.handleTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.handleTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.handleTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.handleTouchCancel, this);
        this.redraw();
    }

    public setSelected(selected: boolean): void {
        if (this.selected === selected) {
            return;
        }

        this.selected = selected;
        Tween.stopAllByTarget(this.node);
        tween(this.node)
            .to(0.08, { scale: new Vec3(selected ? 1.08 : 1, selected ? 1.08 : 1, 1) })
            .start();
        this.redraw();
    }

    public updateGem(row: number, col: number, gemData: GemData): void {
        this.row = row;
        this.col = col;
        this.gemData = { ...gemData };
        this.redraw();
    }

    public getOpacity(): UIOpacity {
        return this.opacity;
    }

    private handleTouchStart(event: EventTouch): void {
        this.touchStart.set(event.getUILocation().x, event.getUILocation().y);
        this.swipeTriggered = false;
    }

    private handleTouchMove(event: EventTouch): void {
        if (this.swipeTriggered) {
            return;
        }

        const current = event.getUILocation();
        const deltaX = current.x - this.touchStart.x;
        const deltaY = current.y - this.touchStart.y;
        const threshold = 24;

        if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
            return;
        }

        this.swipeTriggered = true;
        const direction: SwipeDirection =
            Math.abs(deltaX) > Math.abs(deltaY)
                ? (deltaX > 0 ? 'right' : 'left')
                : (deltaY > 0 ? 'up' : 'down');

        this.onSwipe?.(this, direction);
    }

    private handleTouchEnd(): void {
        if (!this.swipeTriggered) {
            this.onTap?.(this);
        }
        this.swipeTriggered = false;
    }

    private handleTouchCancel(): void {
        this.swipeTriggered = false;
    }

    private redraw(): void {
        if (!this.graphics) {
            return;
        }

        const paletteColor = GEM_PALETTE[this.gemData.gemType % GEM_PALETTE.length];
        const bodyColor = new Color(paletteColor.r, paletteColor.g, paletteColor.b, 255);
        const shadowColor = new Color(
            Math.max(0, paletteColor.r - 70),
            Math.max(0, paletteColor.g - 70),
            Math.max(0, paletteColor.b - 70),
            255,
        );

        const radius = this.size * 0.22;
        const inset = this.size * 0.08;
        const half = this.size * 0.5;

        this.graphics.clear();
        this.graphics.fillColor = shadowColor;
        this.graphics.roundRect(-half + 2, -half - 3, this.size - 4, this.size - 4, radius);
        this.graphics.fill();

        this.graphics.fillColor = bodyColor;
        this.graphics.roundRect(-half, -half + 2, this.size - 4, this.size - 4, radius);
        this.graphics.fill();

        this.graphics.fillColor = new Color(255, 255, 255, 70);
        this.graphics.circle(-half + inset * 2.2, half - inset * 2.2, this.size * 0.11);
        this.graphics.fill();

        this.graphics.strokeColor = this.selected ? new Color(255, 255, 255, 220) : new Color(255, 255, 255, 25);
        this.graphics.lineWidth = this.selected ? 5 : 2;
        this.graphics.roundRect(-half, -half + 2, this.size - 4, this.size - 4, radius);
        this.graphics.stroke();

        if (this.gemData.specialType === 'row') {
            this.graphics.strokeColor = new Color(255, 255, 255, 220);
            this.graphics.lineWidth = 6;
            this.graphics.moveTo(-half + inset, 0);
            this.graphics.lineTo(half - inset, 0);
            this.graphics.stroke();
        } else if (this.gemData.specialType === 'col') {
            this.graphics.strokeColor = new Color(255, 255, 255, 220);
            this.graphics.lineWidth = 6;
            this.graphics.moveTo(0, -half + inset);
            this.graphics.lineTo(0, half - inset);
            this.graphics.stroke();
        } else if (this.gemData.specialType === 'bomb') {
            this.graphics.fillColor = new Color(255, 255, 255, 220);
            this.graphics.circle(0, 0, this.size * 0.12);
            this.graphics.fill();

            this.graphics.strokeColor = new Color(255, 245, 173, 230);
            this.graphics.lineWidth = 3;
            this.graphics.circle(0, 0, this.size * 0.18);
            this.graphics.stroke();
        }
    }
}
