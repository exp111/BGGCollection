import {Injectable} from '@angular/core';
import {BGGCatalogBackup, CustomFieldEntry, PlayerPlayEntry} from "../../../model/bgg-catalog";
import {
  Aspect,
  Difficulty,
  Hero,
  MarvelChampionsPlay,
  MarvelChampionsPlayer,
  MarvelChampionsStats,
  MC_GAME_NAME,
  Modular,
  PackContent,
  Scenario
} from "../../../model/marvel-champions";
import {BaseBackupReaderService} from "../base-backup-reader.service";

@Injectable({
  providedIn: 'root'
})
export class MCBackupReaderService extends BaseBackupReaderService {
  protected override BaseGameName = MC_GAME_NAME;
  public override GameContent = PackContent;

  protected override enumNormalizers = {
    [Aspect.END]: this.normalizeAspectName,
    [Modular.END]: this.normalizeModularName
  }

  private normalizeAspectName(str: string) {
    return {
      "Gerechtigkeit": "Justice",
      "F\xfchrung": "Leadership",
      "Pool": "Deadpool",
      "Schutz": "Protection"
    }[str] ?? str;
  }

  private normalizeModularName(str: string) {
    return {
      "Bombenbedrohung": "BombThreat",
      "UnterBeschuss": "UnderAttack",
      "HydrasLegionen": "LegionsOfHydra",
      "HydraAngriff": "HydraAssault",
      "Waffenmeister": "WeaponMaster",
      "HydraPatrouille": "HydraPatrol",
      "ExperimentelleWaffen": "ExperimentalWeapons",
      "StadtImChaos": "CityInChaos",
      "Bodenst\xe4ndig": "DownToEarth",
      "GoblinAusr\xfcstung": "GoblinGear",
      "Guerillataktik": "GuerrillaTactics",
      "Pers\xf6nlicherAlbtraum": "PersonalNightmare",
      "SinistrerAngriff": "SinisterAssault",
      "SymbiotischeSt\xe4rke": "SymbioticStrength",
      "Fl\xfcsterndeParanoia": "WhispersOfParanoia",
    }[str] ?? str;
  }

  private parsePlayer(entry: PlayerPlayEntry, backup: BGGCatalogBackup, heroField: CustomFieldEntry, aspectField: CustomFieldEntry, aspectsField: CustomFieldEntry) {
    let ret = {} as MarvelChampionsPlayer;
    // get player
    let player = backup.players.find(p => p.id == entry.playerId);
    if (!player) {
      console.error(`Player with id ${entry.playerId} not found`);
      return ret;
    }
    // name
    ret.Name = player.name;
    ret.IsMe = player.me == 1;
    // find hero
    ret.Hero = this.parseCustomFieldValuePlayer(backup, entry, Hero, heroField);
    // find aspect
    ret.Aspects = this.parseCustomFieldValuePlayer(backup, entry, Aspect, aspectField, aspectsField);
    return ret;
  }

  public override parse(backup: BGGCatalogBackup) {
    let ret = {
      Plays: [],
      OwnedContent: []
    } as MarvelChampionsStats;
    let plays = [];
    // get game id
    let game = this.findBaseGame(backup);
    if (!game) {
      return ret;
    }
    ret.OwnedContent = this.getOwnedContent(backup);
    let gameId = game.id;
    // get custom data fields
    let aspectField = this.findCustomField(backup, gameId, "Aspect");
    let aspectsField = this.findCustomField(backup, gameId, "Aspects");
    let heroField = this.findCustomField(backup, gameId, "Hero");
    let scenarioField = this.findCustomField(backup, gameId, "Scenario");
    let modularField = this.findCustomField(backup, gameId, "Modular");
    let modularsField = this.findCustomField(backup, gameId, "Modulars");
    let difficultyField = this.findCustomField(backup, gameId, "Difficulty");
    if ([aspectField, aspectsField, heroField, scenarioField, modularField, modularsField, difficultyField].some(f => !f)) {
      console.error("Can't find custom fields");
      return ret;
    }
    // plays
    for (let play of backup.plays) {
      // only check game plays
      if (play.gameId != gameId) {
        continue;
      }
      let obj = {
        Id: play.id,
        Players: [] as MarvelChampionsPlayer[],
      } as MarvelChampionsPlay;
      // players
      let players = backup.playersPlays.filter(p => p.playId == play.id);
      for (let player of players) {
        obj.Players.push(this.parsePlayer(player, backup, heroField!, aspectField!, aspectsField!));
      }
      // scenario
      obj.Scenario = this.parseCustomFieldValuePlay(backup, play, Scenario, scenarioField!);
      // modular
      obj.Modulars = this.parseCustomFieldValuePlay(backup, play, Modular, modularField!, modularsField);
      // difficulty
      obj.Difficulty = this.parseCustomFieldValuePlay(backup, play, Difficulty, difficultyField!);
      obj.Won = players.some(p => p.winner == 1)
      plays.push(obj);
    }
    ret.Plays = plays;
    return ret;
  }
}
