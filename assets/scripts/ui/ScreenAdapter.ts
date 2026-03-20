import { ResolutionPolicy, game, view } from 'cc';

let resizeBound = false;

export function applyScreenFit(): void {
    const frameSize = view.getFrameSize();
    if (frameSize.width <= 0 || frameSize.height <= 0) {
        return;
    }

    applyDomFullscreenStyle();
    view.resizeWithBrowserSize(true);
    view.setDesignResolutionSize(
        Math.floor(frameSize.width),
        Math.floor(frameSize.height),
        ResolutionPolicy.EXACT_FIT,
    );

    if (!resizeBound && typeof window !== 'undefined') {
        resizeBound = true;
        window.addEventListener('resize', () => {
            const nextSize = view.getFrameSize();
            if (nextSize.width > 0 && nextSize.height > 0) {
                view.setDesignResolutionSize(
                    Math.floor(nextSize.width),
                    Math.floor(nextSize.height),
                    ResolutionPolicy.EXACT_FIT,
                );
            }
        });
    }
}

function applyDomFullscreenStyle(): void {
    if (typeof document === 'undefined') {
        return;
    }

    const html = document.documentElement;
    const body = document.body;
    html.style.width = '100%';
    html.style.height = '100%';
    body.style.width = '100%';
    body.style.height = '100%';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.background = '#050914';

    const canvas = game.canvas as HTMLCanvasElement | null;
    if (canvas) {
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }
}
