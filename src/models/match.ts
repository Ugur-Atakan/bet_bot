// Verilen maçın verilerinin formatı
export interface CurrentDetail {
    homeName: string;
    homeId: string;
    awayName: string;
    awayId: string;
  }

//Maçlar çekildikten sonra formatlanacağı veri yapısı
  export interface MatchData {
    matchId: string;
    homeId: string;
    homeName: string;
    awayId: string;
    awayName: string;
    matchTime: string;
    total_score: number;
  }


// Maç verilerine bahis verileri eklendikten sonra oluşacak veri yapısı
export interface OpeningOddData {
    match_id: string;
    odd_score: number;
    real_score: number;
    score_difference: number;
}

export enum TeamType {
  Home = "Ev sahibi",
  Away = "Misafir",
  Versus = "Karşılıklı"
}