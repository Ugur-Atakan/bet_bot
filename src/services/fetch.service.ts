// services/MatchService.ts

import axios from 'axios';
import { TeamType, type CurrentDetail, type MatchData, type OpeningOddData } from '../models/match';
import { firstBet, saveToJson } from '../utils/common';
import type { ParseService } from './parse.service';

const BASE_URL = "https://api.b365api.com/";
const BETS_API_TOKEN = process.env.BETS_API_TOKEN;


export class FetchService {
    constructor(
        private readonly parseService:ParseService
    ) {}

    async matchDetails(eventId: string): Promise<CurrentDetail | null> {
        const url = `${BASE_URL}/v1/event/view?token=${BETS_API_TOKEN}&event_id=${eventId}`;
        
        try {
            const response = await axios.get(url);
            const matchData = response.data;

            if (matchData.results && matchData.results.length > 0) {
                const result = matchData.results[0];
                const homeId = result.home.id;
                const homeName = result.home.name;
                const awayId = result.away.id;
                const awayName = result.away.name;
                return {
                    homeId,
                    homeName,
                    awayId,
                    awayName,
                };
            } else {
                console.error("Beklenen veri yapısında bir hata var.");
                return null;
            }
        } catch (error) {
            console.error(`HTTP isteği başarısız oldu: ${error}`);
            return null;
        }
    }

    async getFirstBet(matchId: string): Promise<number | null> {
        const bets = await this.fetchOdds(matchId);
        
        if (!bets) {
            return null;
        }
        
        const allTotalPointBets = bets?.results?.odds?.['18_3'] || [];
        
        if (allTotalPointBets.length === 0) {
            console.log(`No bets found for match ID ${matchId}`);
            return null;
        }
    
        const first = firstBet(allTotalPointBets);
        
        if (!first || first.handicap === undefined || first.handicap === null) {
            console.log(`Atlandı: Match ID ${matchId} - Handicap is None`);
            return null;
        }
    
        const oddScore = parseFloat(first.handicap);
        return oddScore;
    }


    async allMatches(teamId: string): Promise<MatchData[]> {
        const firstResponse = await this.fetchPage(teamId, 1,100);
        if (!firstResponse) return [];

        const total = firstResponse.pager.total;
        const totalPages = Math.ceil(total / 100);
        let allResults = firstResponse.results;
        
        const tasks = [];
        for (let page = 2; page <= totalPages; page++) {
            tasks.push(this.fetchPage(teamId, page));
        }

        const results = await Promise.all(tasks);
        
        for (const result of results) {
            if (result && result.results) {
                allResults = allResults.concat(result.results);
            }
        }
        const formattedAllResults = await this.parseService.formatMatches(allResults); // Bu kısım düzeltilecek
        saveToJson(`${teamId}_all_matches.json`, formattedAllResults);

        return formattedAllResults;
    }


    async openingOdds(allMatches: MatchData[], teamType: TeamType): Promise<OpeningOddData[]> {
        const totalMatches = allMatches.length;
    
        switch (teamType) {
            case TeamType.Home:
                console.log("Ev sahibi takım maçları için açılış oranları çekiliyor... Tüm maçlar: ", totalMatches);
                break;
            case TeamType.Away:
                console.log("Misafir takım maçları için açılış oranları çekiliyor... Tüm maçlar: ", totalMatches);
                break;
            case TeamType.Versus:
                console.log("Karşılıklı maçlar için açılış oranları çekiliyor... Tüm maçlar: ", totalMatches);
                break;
            default:
                console.log("Bilinmeyen takım tipi");
                break;
        }
    
        const allOpeningBets: OpeningOddData[] = [];
    
        for (let i = 0; i < totalMatches; i++) {
            const match = allMatches[i];
    
            if (match.total_score === null) {
                console.log(`Atlandı: Match ID ${match.matchId} - Total score is None`);
                continue;
            }
    
            console.log(`İşleniyor: ${i + 1}/${totalMatches} - Match ID: ${match.matchId}`);
            const bets = await this.fetchOdds(match.matchId);
    
            if (!bets) {
                console.log(`Atlandı: Match ID ${match.matchId} - Bets verisi yok`);
                continue;
            }
    
            const allTotalPointBets = bets?.results?.odds?.['18_3'] || [];
    
            if (allTotalPointBets.length === 0) {
                console.log(`Atlandı: Match ID ${match.matchId} - Toplam puan bahisleri yok`);
                continue;
            }
    
            // Geçerli bir handicap değeri bulana kadar devam et
            let validBet = null;
            for (const bet of allTotalPointBets) {
                const oddScore = parseFloat(bet.handicap);
                if (!isNaN(oddScore)) {
                    validBet = bet;
                    break;
                }
            }
    
            if (!validBet) {
                console.log(`Atlandı: Match ID ${match.matchId} - Geçerli handicap değeri bulunamadı`);
                continue;
            }
    
            const oddScore = parseFloat(validBet.handicap);
            const difference = Math.abs(oddScore - match.total_score);
    
            const data: OpeningOddData = {
                match_id: match.matchId,
                odd_score: oddScore,
                real_score: match.total_score,
                score_difference: difference
            };
    
            allOpeningBets.push(data);
        }
    
        console.info(`Tüm açılış oranları işlendi. Toplam işlenen maç sayısı: ${allOpeningBets.length}`);
        return allOpeningBets;
    }
    
    
    
    private async fetchPage(teamId: string, page: number, perPage: number = 100): Promise<any> {
        const url = `${BASE_URL}/v3/events/ended`;
        const params = {
            sport_id: 18,
            team_id: teamId,
            per_page: perPage,
            page: page,
            token: BETS_API_TOKEN
        };

        try {
            const response = await axios.get(url, { params });
            return response.data;
        } catch (error) {
            console.error(`Sayfa verisi çekme başarısız oldu: ${error}`);
            return null;
        }
    }

   private async fetchOdds(matchId: string): Promise<any | null> {
        const baseUrl = "https://api.b365api.com/v2/event/odds";
        try {
            const response = await axios.get(baseUrl, {
                params: {
                    token: BETS_API_TOKEN,
                    event_id: matchId,
                    source: 'bet365'
                }
            });
            
            if (response.status === 200) {
                return response.data;
            } else {
                console.error(`Error fetching data for event ID ${matchId}`);
                return null;
            }
        } catch (error) {
            console.error(`Request failed for event ID ${matchId}:`, error);
            return null;
        }
    }
}




