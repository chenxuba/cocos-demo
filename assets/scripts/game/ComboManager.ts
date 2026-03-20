import { BASE_MATCH_SCORE, CASCADE_SCORE_STEP } from '../data/GameConfig';

export interface ComboResult {
    cascadeIndex: number;
    clearedCount: number;
    multiplier: number;
    points: number;
}

export class ComboManager {
    private cascadeIndex = 0;

    public beginMove(): void {
        this.cascadeIndex = 0;
    }

    public registerCascade(clearedCount: number): ComboResult {
        this.cascadeIndex += 1;
        const multiplier = 1 + (this.cascadeIndex - 1) * CASCADE_SCORE_STEP;
        const points = Math.round(clearedCount * BASE_MATCH_SCORE * multiplier);

        return {
            cascadeIndex: this.cascadeIndex,
            clearedCount,
            multiplier,
            points,
        };
    }
}
