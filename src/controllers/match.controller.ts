import type { Request, Response } from 'express';
import { FetchService } from '../services/fetch.service';
import { ParseService } from '../services/parse.service';
import {loadFromJson, saveToJson } from '../utils/common';
import { TeamType, type MatchData, type OpeningOddData } from '../models/match';
import type { AnalyzeService } from '../services/calculate.service';
import { deleteFiles } from '../utils/clearFiles';


export class MatchController {

    constructor(
        private readonly parseService: ParseService,
        private readonly fetchService: FetchService,
        private readonly analyzeService: AnalyzeService
    ) {}

    async predictScore(req: Request, res: Response) {
        try {
            const { home_recent_count, away_recent_count, versus_recent_count, matchLink } = req.body;
            const autoDelete = req.body.autoDelete;
            if (!matchLink) {
                return res.status(400).json({ error: 'matchLink is required' });
            }
            if (!home_recent_count || !away_recent_count || !versus_recent_count) {
                return res.status(400).json({ error: 'All recent count parameters are required' });
            }
            const matchId = this.parseService.parseMatchId(matchLink);
            if (!matchId) {
                return res.status(400).json({ error: 'Invalid match link' });
            }
            const matchDetails = await this.fetchService.matchDetails(matchId);
            const homeId = matchDetails!.homeId;
            const awayId = matchDetails!.awayId;
            const current_match_opening_bet = await this.fetchService.getFirstBet(matchId);
    
            // Fetch all matches for home and away teams
            console.log('Maçlar çekiliyor...');
            await Promise.all([
                this.fetchService.allMatches(homeId),
                this.fetchService.allMatches(awayId)
            ]);
            console.log('Maçlar başarıyla çekildi.');
    
            console.log('Maçlar işleniyor...');
            // Parse matches for home, away, and versus
            await Promise.all([
                this.parseService.parseHomeAtHomeMatches(homeId),
                this.parseService.parseAwayAtAwayMatches(awayId),
                this.parseService.parseVersusMatches(homeId, awayId)
            ]);
            console.log('Maçlar başarıyla işlendi.');
    
            // Load parsed data from JSON files
            const home_at_home_matches = loadFromJson(`${homeId}_at_home.json`);
            const away_at_away_matches = loadFromJson(`${awayId}_at_away.json`);
            const versus_matches = loadFromJson(`${homeId}_vs_${awayId}_versus_matches.json`);
    
            console.log('En son Maçlar işleniyor...');
            // Get recent matches
            const recent_home_matches: MatchData[] = await this.parseService.getRecentMatches(home_at_home_matches, home_recent_count);
            const recent_away_matches: MatchData[] = await this.parseService.getRecentMatches(away_at_away_matches, away_recent_count);
            const recent_versus_matches: MatchData[] = await this.parseService.getRecentMatches(versus_matches, versus_recent_count);
            saveToJson(`${homeId}_recent_home_match.json`, recent_home_matches);
            saveToJson(`${awayId}_recent_away_match.json`, recent_away_matches);
            saveToJson(`${homeId}_vs_${awayId}_recent_versus_matches.json`, recent_versus_matches);
    
            console.log('En son Maçlar başarıyla işlendi ve oranlar çekiliyor...');
            // Fetch opening odds for recent matches, işlemleri sırasıyla tamamlamak için await eklenmiştir
            const recent_home_match_odds: OpeningOddData[] = await this.fetchService.openingOdds(recent_home_matches, TeamType.Home);
            console.log('Home odds başarıyla çekildi.');
            const recent_away_match_odds: OpeningOddData[] = await this.fetchService.openingOdds(recent_away_matches, TeamType.Away);
            console.log('Away odds başarıyla çekildi.');
            const recent_versus_match_odds: OpeningOddData[] = await this.fetchService.openingOdds(recent_versus_matches, TeamType.Versus);
            console.log('Versus odds başarıyla çekildi.');
    
            // Save opening odds to JSON
            saveToJson(`${homeId}_recent_home_match_odds.json`, recent_home_match_odds);
            saveToJson(`${awayId}_recent_away_match_odds.json`, recent_away_match_odds);
            saveToJson(`${homeId}_vs_${awayId}_recent_versus_matches_odds.json`, recent_versus_match_odds);
    
            console.log('Oranlar başarıyla çekildi ve istatistikler hesaplanıyor...');
            // Calculate statistics for recent matches
            const recent_home_match_statistics = await this.analyzeService.calculateStatistics(recent_home_match_odds);
            const recent_away_match_statistics = await this.analyzeService.calculateStatistics(recent_away_match_odds);
            const recent_versus_match_statistics = await this.analyzeService.calculateStatistics(recent_versus_match_odds);
            console.log('İstatistikler başarıyla hesaplandı.');
    
            // Save statistics to JSON
            saveToJson(`${homeId}_recent_home_match_statics.json`, recent_home_match_statistics);
            saveToJson(`${awayId}_recent_away_match_statics.json`, recent_away_match_statistics);
            saveToJson(`${homeId}_vs_${awayId}_recent_versus_matches_statics.json`, recent_versus_match_statistics);
    
            console.log('Bahis sonuçları hesaplanıyor...');
            // Calculate bet results based on statistics
            const bet_results = this.analyzeService.calculateBet(
                recent_home_match_statistics,
                recent_away_match_statistics,
                recent_versus_match_statistics,
                current_match_opening_bet!
            );
    
            const prediction_results= {
                matchId: matchId,
                match:`${matchDetails!.homeName} vs ${matchDetails!.awayName}`,
                prediction_results: bet_results
            }  
         
            // Return the result as a JSON response
            res.json(prediction_results);
        
            if(autoDelete==true){
                deleteFiles(homeId, awayId)
                .then(() => console.log('All specified files have been processed.'))
                .catch(error => console.error('An error occurred:', error));
            }


                   
        } catch (error) {
            console.error('Error predicting score:', error);
            res.status(500).json({ error: 'An error occurred while predicting the score' });
        }
    }
    
}
