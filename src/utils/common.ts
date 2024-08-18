// utils/common.ts

import fs from "fs";

import path from "path";

const baseDir = path.join(__dirname, '../../files');

export const saveToJson = (filename: string, data: any) => {
  const filePath = path.join(baseDir, filename);
console.log(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export const loadFromJson = (filename: string) => {
  const filePath = path.join(baseDir, filename);
  console.log(filePath);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};


export const firstBet = (bets: any) => {
  const first = bets.reduce((minBet: any, bet: any) => {
    return minBet && parseInt(minBet.add_time) < parseInt(bet.add_time)
      ? minBet
      : bet;
  }, null);
  return first;
};

export const calculateMean = (numbers: number[]): number => {
  const sum = numbers.reduce((a, b) => a + b, 0);
  return sum / numbers.length;
};
export const calculateStdev = (numbers: number[]): number => {
  const mean = calculateMean(numbers);
  const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
  const avgSquaredDiff = calculateMean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
};



