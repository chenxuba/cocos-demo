import { Node } from 'cc';

export function syncNodeLayer(node: Node, layer: number): void {
    node.layer = layer;
}
