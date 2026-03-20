import { ResolutionPolicy, view } from 'cc';

export function applyScreenFit(): void {
    const frameSize = view.getFrameSize();
    if (frameSize.width <= 0 || frameSize.height <= 0) {
        return;
    }

    view.resizeWithBrowserSize(true);
    view.setDesignResolutionSize(
        Math.floor(frameSize.width),
        Math.floor(frameSize.height),
        ResolutionPolicy.EXACT_FIT,
    );
}
