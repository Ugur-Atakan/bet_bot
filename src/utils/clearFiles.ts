import { promises as fs } from 'fs';
import path from 'path';

const baseDir = path.join(__dirname, '../../files');

const generateFileNames = (homeId: string, awayId: string): string[] => {
  return [
    `${homeId}_vs_${awayId}_recent_versus_matches_odds.json`,
    `${homeId}_vs_${awayId}_recent_versus_matches_statics.json`,
    `${homeId}_vs_${awayId}_recent_versus_matches.json`,
    `${homeId}_vs_${awayId}_versus_matches.json`,
    `${awayId}_all_matches.json`,
    `${homeId}_all_matches.json`,
    `${homeId}_at_home.json`,
    `${homeId}_recent_home_match_odds.json`,
    `${homeId}_recent_home_match_statics.json`,
    `${homeId}_recent_home_match.json`,
    `${awayId}_at_away.json`,
    `${awayId}_recent_away_match_odds.json`,
    `${awayId}_recent_away_match_statics.json`,
    `${awayId}_recent_away_match.json`
  ];
};

export async function deleteFiles(homeId: string, awayId: string) {
  const filesToDelete = generateFileNames(homeId, awayId);

  for (const file of filesToDelete) {
    const filePath = path.join(baseDir, file);
    try {
      await fs.unlink(filePath);
      console.log(`Deleted: ${file}`);
    } catch (error:any) {
      if (error.code === 'ENOENT') {
        console.log(`File not found: ${file}`);
      } else {
        console.error(`Error deleting file ${file}:`, error);
      }
    }
  }
}
