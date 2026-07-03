export const MODULE_NAME = "maestro2";

export const MODULE_LABEL = "Maestro 2.0";

export const DEFAULT_CONFIG = {
    get SceneMusic() {
        return {
            name: "scene-music",
            flagNames: {
                playlist: "playlistId"
            },
            templatePath: "modules/maestro2/templates/playlist-select.html"
        }
       
    },

    get HypeTrack() {
        return {
            name: "hype-track",
            playlistName: "Hype Tracks",
            buttonIcon: "fas fa-music",
            buttonText: " Hype",
            aTitle: "Change Actor Hype Track",
            flagNames: {
                playlist: "playlist",
                track: "track"
            },
            templatePath: "modules/maestro2/templates/hype-track-form.html"
        }
        
    },
    
    get ItemTrack() {
        return {
            name: "item-track",
            playlistName: "Item Tracks",
            buttonIcon: "fas fa-music",
            buttonText: " Item Track",
            aTitle: "Change Item Track",
            flagNames: {
                track: "track",
                played: "item-track-played",
                playlist: "playlist"
            },
            playbackModes: {
                single: "single",
                random: "random-track",
                all: "play-all"
            },
            templatePath: "modules/maestro2/templates/item-track-form.html"
        }
    },

    get CombatTrack() {
        return {
            name: "combat-track",
            playlistName: "Combat Tracks",
            buttonIcon: "fas fa-music",
            buttonText: "",
            aTitle: game.i18n.localize("MAESTRO.COMBAT-TRACK.FormButtonTitle"),
            flagNames: {
                track: "track",
                playlist: "playlist"
            },
            playbackModes: {
                single: "single",
                random: "random-track",
                all: "play-all"
            },
            templatePath: "modules/maestro2/templates/combat-track-form.html"
        }
    },

    get PlaylistLoop() {
        return {
            flagNames: {
                loop: "playlist-loop",
                previousSound: "previous-sound"
            }
        }
    },

    get Misc() {
        return {
            criticalSuccessPlaylistName: "Critical Success Tracks",
            criticalFailurePlaylistName: "Critical Failure Tracks",
            maestroConfigTitle: "Additional Configuration",
            maestroConfigTemplatePath: "modules/maestro2/templates/maestro-config.html"
        }
    }
}

export const FLAGS = {
    get CombatTrack() {
        return {
            combatStarted: "combatStarted"
        }
    }
}
        

export const SETTINGS_KEYS = {
    get ItemTrack() {
        return {
            enable: "enableItemTrack",
            createPlaylist: "createItemTrackPlaylist",
            itemIdAttribute: "itemIdChatCardAttribute",
            deletedItems: "deletedItems"
        }
    },

    get HypeTrack() {
        return {
            enable: "enableHypeTrack",
            pauseOthers: "hypeTrackPauseOthers"
        }
    },

    get CombatTrack() {
        return {
            enable: "enableCombatTrack",
            createPlaylist: "createCombatTrackPlaylist",
            defaultPlaylist: "defaultCombatTrackPlaylist",
            defaultTrack: "defaultCombatTrackTrack",
            pauseOthers: "combatTrackPauseOthers"
        }
    },

    get Misc() {
        return {
            disableDiceSound: "disableDiceSound",
            enableCriticalSuccessFailureTracks: "enableCriticalSuccessFailureTracks",
            createCriticalSuccessPlaylist: "createCriticalSuccessPlaylist",
            criticalSuccessFailureTracks: "criticalSuccessFailureTracks",
            createCriticalFailurePlaylist: "createFailurePlaylist",
            criticalDieFaces: "dieFaces",
            criticalSuccessThreshold: "successThreshold",
            criticalFailureThreshold: "failureThreshold",
            maestroConfigMenu: "maestroConfigMenu"
        }
    }

    
}