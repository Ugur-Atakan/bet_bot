export interface ComparisonEntry {
    odd_score: number | null;
    real_score: number | null;
    score_difference: number | null;
}

export interface StatisticsResult {
    mean: number;
    stdev: number;
}

export interface CalculatedStatistics {
    odd_score: StatisticsResult;
    real_score: StatisticsResult;
    score_difference: StatisticsResult;
}