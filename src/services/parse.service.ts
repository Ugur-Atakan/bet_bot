// services/ParseService.ts

import type { MatchData } from '../models/match';
import { loadFromJson, saveToJson } from '../utils/common';


export class ParseService {
    constructor() {}

    parseMatchId(matchUrl: string): string {
        const match = matchUrl.match(/\/r[h]?\/(\d+)\//);
        
        if (match && match[1]) {
            return match[1];
        } else {
            throw new Error("Geçersiz maç linki, maç ID'si bulunamadı.");
        }
    }


 async  getRecentMatches(matches: MatchData[], limit: number): Promise<MatchData[]> {
    const sortedMatches = matches.sort((a, b) => {
        const dateA = new Date(a.matchTime).getTime();
        const dateB = new Date(b.matchTime).getTime();
        return dateB - dateA; 
    });

    return sortedMatches.slice(0, limit);
}

    
    async  parseHomeAtHomeMatches(teamId: string): Promise<MatchData[]> {
        const allGames:MatchData[] = loadFromJson(`${teamId}_all_matches.json`);
        const filteredGames: MatchData[] = allGames
            .filter(game => game.homeId === teamId)
            .map(game => ({
                matchId: game.matchId,
                matchTime: game.matchTime,
                homeId: game.homeId,
                homeName: game.homeName,
                awayId: game.awayId,
                awayName: game.awayName,
                total_score: game.total_score
            }));
        saveToJson(`${teamId}_at_home.json`, filteredGames);
        return filteredGames;
    }

    async  parseAwayAtAwayMatches(teamId: string): Promise<MatchData[]> {
        const allGames:MatchData[] = loadFromJson(`${teamId}_all_matches.json`);
        const filteredGames: MatchData[] = allGames
            .filter(game => game.awayId === teamId)
            .map(game => ({
                matchId: game.matchId,
                matchTime: game.matchTime,
                awayId: game.awayId,
                awayName: game.awayName,
                homeId: game.homeId,
                homeName: game.homeName,
                total_score: game.total_score
            }));
            saveToJson(`${teamId}_at_away.json`, filteredGames);
        return filteredGames;
    }
    

    async parseVersusMatches(homeId: string, awayId: string): Promise<MatchData[]> {
        const homeGames = loadFromJson(`${homeId}_all_matches.json`);
        const awayGames = loadFromJson(`${awayId}_all_matches.json`);
    
        const matchingMatches: MatchData[] = [];
    
        for (const homeGame of homeGames) {
            if (typeof homeGame !== 'object') {
                console.error(`Geçersiz home_game verisi: ${homeGame}`);
                continue;
            }
    
            for (const awayGame of awayGames) {
                if (typeof awayGame !== 'object') {
                    console.error(`Geçersiz away_game verisi: ${awayGame}`);
                    continue;
                }
    
                // İki oyun aynı maç mı?
                if (
                    homeGame.matchId === awayGame.matchId &&
                    (
                        (homeGame.homeId === homeId && homeGame.awayId === awayId) ||
                        (homeGame.homeId === awayId && homeGame.awayId === homeId)
                    )
                ) {
                    const matchingMatch: MatchData = {
                        matchId: homeGame.matchId,
                        matchTime: homeGame.matchTime,
                        homeId: homeGame.homeId,
                        homeName: homeGame.homeName,
                        awayId: homeGame.awayId,
                        awayName: homeGame.awayName,
                        total_score: homeGame.total_score
                    };
                    matchingMatches.push(matchingMatch);
                }
            }
        }
        saveToJson(`${homeId}_vs_${awayId}_versus_matches.json`, matchingMatches);
        return matchingMatches;
    }

    

    async formatMatches(matches: any[]): Promise<MatchData[]> {
        const formattedMatches: MatchData[] = [];
        
        for (const match of matches) {
            const formattedMatch = await this.formatMatch(match);
            formattedMatches.push(formattedMatch);
        }
        
        return formattedMatches;
    }


    private async formatMatch(match: any): Promise<MatchData> {
        const totalScore = match.ss ? match.ss.split('-').reduce((sum: number, score: string) => sum + parseInt(score, 10), 0) : null;
        return {
            matchId: match.id,
            matchTime: match.time,
            homeId: match.home.id,
            homeName: match.home.name,
            awayId: match.away.id,
            awayName: match.away.name,
            total_score: totalScore
        };
    }


}
