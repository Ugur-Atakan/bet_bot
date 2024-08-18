import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import { FetchService } from '../services/fetch.service';
import { ParseService } from '../services/parse.service';
import { AnalyzeService } from '../services/calculate.service';

const router = Router();

const parseService = new ParseService();
const fetchService = new FetchService(parseService);
const analyzeService = new AnalyzeService();

const matchController = new MatchController(parseService, fetchService, analyzeService);

router.post('/predict_score', matchController.predictScore.bind(matchController));

export default router;
