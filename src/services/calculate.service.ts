import type { CalculatedStatistics, ComparisonEntry } from "../models/statistics";
import { calculateMean, calculateStdev } from "../utils/common";

import { erf } from 'mathjs';


export class AnalyzeService {

constructor() {}


 calculateStatistics(comparisons: ComparisonEntry[]): CalculatedStatistics {
    const odd_scores = comparisons
        .filter(entry => entry.odd_score !== null)
        .map(entry => entry.odd_score as number);
    
    const real_scores = comparisons
        .filter(entry => entry.real_score !== null)
        .map(entry => entry.real_score as number);
    
    const score_differences = comparisons
        .filter(entry => entry.score_difference !== null)
        .map(entry => entry.score_difference as number);

    // Listelerin boş olup olmadığını kontrol et
    if (odd_scores.length === 0 || real_scores.length === 0 || score_differences.length === 0) {
        throw new Error("Bir veya daha fazla liste boş, hesaplama yapılamıyor.");
    }

    // Ortalama ve standart sapmaları hesapla
    const odd_score_mean = calculateMean(odd_scores);
    const odd_score_stdev = odd_scores.length > 1 ? calculateStdev(odd_scores) : 0;

    const real_score_mean = calculateMean(real_scores);
    const real_score_stdev = real_scores.length > 1 ? calculateStdev(real_scores) : 0;

    const score_difference_mean = calculateMean(score_differences);
    const score_difference_stdev = score_differences.length > 1 ? calculateStdev(score_differences) : 0;

    const statisticsResult: CalculatedStatistics = {
        odd_score: {
            mean: odd_score_mean,
            stdev: odd_score_stdev
        },
        real_score: {
            mean: real_score_mean,
            stdev: real_score_stdev
        },
        score_difference: {
            mean: score_difference_mean,
            stdev: score_difference_stdev
        }
    };
    return statisticsResult;
}


 private calculateZScore(openingBet: number, mean: number, stdev: number): number {
    return (openingBet - mean) / stdev;
}

private calculateProbabilities(zScore: number): { probBelow: number, probAbove: number } {
    const probBelow = 0.5 * (1 + erf(zScore / Math.SQRT2)); // CDF hesaplama
    const probAbove = 1 - probBelow;
    return { probBelow: probBelow * 100, probAbove: probAbove * 100 };
}

private calculateAverageDeviation(scoreDifferenceData: { mean: number }): number {
    return scoreDifferenceData.mean;
}
private estimateTotalScore(homeAvgDeviation: number, awayAvgDeviation: number, openingOdd: number): number {
    return openingOdd + (homeAvgDeviation + awayAvgDeviation) / 2;
}

private evaluateScorePrediction(estimatedScore: number, threshold: number = 150): string {
    if (estimatedScore < threshold * 0.99) {
        return `${threshold} sayının %1 altında olabilir`;
    } else if (estimatedScore > threshold * 1.05) {
        return `${threshold} sayının %5 üstünde olabilir`;
    } else {
        return `${threshold} sayının yakınlarında olabilir`;
    }
}

calculateBet(
    homeStats: { score_difference: { mean: number }, real_score: { stdev: number } },
    awayStats: { score_difference: { mean: number }, real_score: { stdev: number } },
    versusStats: { odd_score: { mean: number } },
    openingBet: number
): {
    "Açılış Oranı": number,
    "Tahmini Skor": number,
    "Alt gelme ihtimali": number,
    "Üst gelme ihtimali": number,
} {
    const homeAvgDeviation = this.calculateAverageDeviation(homeStats.score_difference);
    const awayAvgDeviation = this.calculateAverageDeviation(awayStats.score_difference);
    const combinedStdev = (homeStats.real_score.stdev + awayStats.real_score.stdev) / 2;

    const predictedTotalScore = this.estimateTotalScore(homeAvgDeviation, awayAvgDeviation, versusStats.odd_score.mean);

    const zScore = this.calculateZScore(openingBet, predictedTotalScore, combinedStdev);

    const { probBelow, probAbove } = this.calculateProbabilities(zScore);

    console.log(`Açılış beti ${openingBet} için:`);
    console.log(`Alt olma ihtimali: %${probBelow.toFixed(2)}`);
    console.log(`Üst olma ihtimali: %${probAbove.toFixed(2)}`);

    const prediction = this.evaluateScorePrediction(predictedTotalScore, openingBet);

    return {
        "Açılış Oranı": openingBet,
        "Tahmini Skor": parseFloat(predictedTotalScore.toFixed(2)),
        "Alt gelme ihtimali": parseFloat(probBelow.toFixed(2)),
        "Üst gelme ihtimali": parseFloat(probAbove.toFixed(2)),
    };
}


}


