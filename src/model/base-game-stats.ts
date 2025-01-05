export interface BaseGamePlayer {
  Name: string;
  IsMe: boolean;
}

export interface BaseGamePlay {
  Id: string;
  Players: BaseGamePlayer[];
  Time: number;
  Won: boolean;
  Notes: string;
}

export interface BaseGameStats {
  Plays: BaseGamePlay[];
  OwnedContent: string[];
}
