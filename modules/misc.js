import * as MAESTRO from "./config.js";
import * as Playback from "./playback.js";


export function _onRenderPlaylistDirectory(app, html, data) {
    _addPlaylistLoopToggle(html);
}

/* -------------------------------------------- */
/*                Shared helpers                */
/* -------------------------------------------- */

/**
 * Normalizes the html argument of a render hook to an HTMLElement
 * Application V1 hooks pass jQuery, Application V2 hooks pass HTMLElement
 * @param {HTMLElement|jQuery} html
 * @returns {HTMLElement}
 */
export function getHTMLElement(html) {
    return html instanceof HTMLElement ? html : html[0];
}

/**
 * Builds a list of {value, label, selected} options for a select element
 * @param {Array|Collection} entries - documents (or objects with id/name) to build options from
 * @param {String} selected - the currently selected value
 * @param {Object[]} specialOptions - additional {value, label} options to prepend
 * @returns {Object[]} the options
 */
export function buildSelectOptions(entries, selected, specialOptions=[]) {
    const list = entries?.contents ?? entries ?? [];
    const entryOptions = Array.from(list).map(e => ({value: e.id, label: e.name}));
    return [...specialOptions, ...entryOptions].map(o => ({
        value: o.value,
        label: o.label,
        selected: o.value === (selected ?? "")
    }));
}

/**
 * Counts the members of an Array or Collection
 * @param {Array|Collection} collection
 * @returns {Number}
 */
export function countEntries(collection) {
    return collection?.size ?? collection?.length ?? 0;
}

/**
 * Adds a button to an Application's window header, before the close button
 * Supports both Application V1 (jQuery/anchor) and V2 (HTMLElement/button) apps
 * @param {Application|ApplicationV2} app
 * @param {HTMLElement|jQuery} html
 * @param {Object} options
 * @param {String} options.buttonClass - css class identifying this button
 * @param {String} options.icon - icon classes
 * @param {String} options.label - button text (V1 apps only)
 * @param {String} options.tooltip - tooltip/title text
 * @param {Function} options.onClick - click handler
 * @returns {HTMLElement|void} the created button
 */
export function addSheetHeaderButton(app, html, {buttonClass, icon, label="", tooltip="", onClick}={}) {
    const element = getHTMLElement(html);
    const header = element.querySelector(".window-header");

    if (!header || header.querySelector(`.${buttonClass}`)) return;

    const isV2 = !!foundry.applications?.api?.ApplicationV2 && app instanceof foundry.applications.api.ApplicationV2;
    let button;

    if (isV2) {
        button = document.createElement("button");
        button.type = "button";
        button.className = `header-control icon ${icon} ${buttonClass}`;
        button.dataset.tooltip = tooltip;
        button.setAttribute("aria-label", tooltip);
    } else {
        button = document.createElement("a");
        button.className = buttonClass;
        button.title = tooltip;
        button.innerHTML = `<i class="${icon}"></i><span> ${label}</span>`;
    }

    button.addEventListener("click", onClick);

    const closeButton = header.querySelector(`[data-action="close"], a.close, .close`);
    if (closeButton) header.insertBefore(button, closeButton);
    else header.appendChild(button);

    return button;
}

export class MaestroConfigForm extends foundry.appv1.api.FormApplication {
    constructor(data, options) {
        super(data, options);
        this.data = data;
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "maestro-config",
            title: MAESTRO.DEFAULT_CONFIG.Misc.maestroConfigTitle,
            template: MAESTRO.DEFAULT_CONFIG.Misc.maestroConfigTemplatePath,
            classes: ["sheet"],
            width: 500
        });
    }

    /**
     * Provide data to the template
     */
    getData() {
        const criticalSuccessFailureTracks = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks);

        if (!this.data && criticalSuccessFailureTracks) {
            this.data = criticalSuccessFailureTracks;
        }

        this.data = this.data ?? {};

        const noneOption = {value: "", label: game.i18n.localize("MAESTRO.FORM.SelectNone")};
        const playbackModeOptions = [
            {value: MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.random, label: game.i18n.localize("MAESTRO.FORM.PlayRandom")},
            {value: MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.all, label: game.i18n.localize("MAESTRO.FORM.PlayAll")}
        ];

        const successSounds = Playback.getPlaylistSounds(this.data.criticalSuccessPlaylist) ?? [];
        const failureSounds = Playback.getPlaylistSounds(this.data.criticalFailurePlaylist) ?? [];

        return {
            criticalSuccessPlaylistOptions: buildSelectOptions(game.playlists.contents, this.data.criticalSuccessPlaylist, [noneOption]),
            criticalSuccessSoundOptions: buildSelectOptions(successSounds, this.data.criticalSuccessSound,
                countEntries(successSounds) ? [noneOption, ...playbackModeOptions] : [noneOption]),
            criticalFailurePlaylistOptions: buildSelectOptions(game.playlists.contents, this.data.criticalFailurePlaylist, [noneOption]),
            criticalFailureSoundOptions: buildSelectOptions(failureSounds, this.data.criticalFailureSound,
                countEntries(failureSounds) ? [noneOption, ...playbackModeOptions] : [noneOption])
        }
    }

    /**
     * Update on form submit
     * @param {*} event
     * @param {*} formData
     */
    async _updateObject(event, formData) {
        await game.settings.set(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks, {
            criticalSuccessPlaylist: formData["critical-success-playlist"],
            criticalSuccessSound: formData["critical-success-sound"],
            criticalFailurePlaylist: formData["critical-failure-playlist"],
            criticalFailureSound: formData["critical-failure-sound"]
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        const criticalPlaylistSelect = html.find("select[name='critical-success-playlist']");
        const failurePlaylistSelect = html.find("select[name='critical-failure-playlist']");

        if (criticalPlaylistSelect.length > 0) {
            criticalPlaylistSelect.on("change", event => {
                this.data.criticalSuccessPlaylist = event.target.value;
                this.render();
            });
        }

        if (failurePlaylistSelect.length > 0) {
            failurePlaylistSelect.on("change", event => {
                this.data.criticalFailurePlaylist = event.target.value;
                this.render();
            });
        }
    }
}

/**
 * Adds a new toggle for loop to the playlist controls
 * @param {HTMLElement|jQuery} html
 */
function _addPlaylistLoopToggle(html) {
    if (!game.user.isGM) return;

    const element = getHTMLElement(html);
    // v13+ uses camelCase actions and data-entry-id, older versions used kebab-case and data-document-id
    const modeButtons = element.querySelectorAll(`[data-action="playlistMode"], [data-action="playlist-mode"]`);

    for (const modeButton of modeButtons) {
        const playlistEl = modeButton.closest("[data-entry-id], [data-document-id]");
        const playlistId = playlistEl?.dataset.entryId ?? playlistEl?.dataset.documentId;
        const playlist = game.playlists.get(playlistId);

        if (!playlist || playlistEl.querySelector(".maestro-playlist-loop")) continue;

        const loop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);
        const modeDisabled = [CONST.PLAYLIST_MODES.DISABLED, CONST.PLAYLIST_MODES.SIMULTANEOUS].includes(playlist.mode);

        let loopButton;
        if (modeButton.tagName === "BUTTON") {
            loopButton = document.createElement("button");
            loopButton.type = "button";
            loopButton.className = "inline-control icon fas fa-sync maestro-playlist-loop";
        } else {
            loopButton = document.createElement("a");
            loopButton.className = "sound-control maestro-playlist-loop";
            loopButton.innerHTML = `<i class="fas fa-sync"></i>`;
        }

        let tooltip;
        if (modeDisabled) {
            tooltip = game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonToolTipDisabled");
            loopButton.classList.add("disabled");
        } else if (loop === false) {
            tooltip = game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonTooltipNoLoop");
            loopButton.classList.add("inactive");
        } else {
            tooltip = game.i18n.localize("MAESTRO.PLAYLIST-LOOP.ButtonTooltipLoop");
        }

        loopButton.dataset.tooltip = tooltip;
        loopButton.setAttribute("aria-label", tooltip);

        if (!modeDisabled) {
            loopButton.addEventListener("click", async event => {
                event.preventDefault();
                const currentLoop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);

                // The flag update triggers a re-render of the directory, which rebuilds the button state
                if (currentLoop === false) {
                    await playlist.unsetFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);
                } else {
                    await playlist.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop, false);
                }
            });
        }

        modeButton.after(loopButton);
    }
}

/**
 * PreUpdate Playlist Sound handler
 * @param {*} playlist
 * @param {*} update
 * @todo maybe return early if no flag set?
 */
export function _onPreUpdatePlaylistSound(sound, update, options, userId) {
    // skip this method if the playlist sound has already been processed
    if (sound?._maestroSkip) return true;

    sound._maestroSkip = true;
    const playlist = sound.parent;
    const updateId = update?._id ?? update?.id;

    // Return if there's no id or the playlist is not in sequential or shuffle mode
    if (!playlist?.playing || !updateId || ![CONST.PLAYLIST_MODES.SEQUENTIAL, CONST.PLAYLIST_MODES.SHUFFLE].includes(playlist?.mode)) {
        return true;
    }

    // If the update is a sound playback ending, save it as the previous track and return
    if (update?.playing === false) {
        playlist.setFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound, updateId);
        return true;
    }

    // Otherwise it must be a sound playback starting:
    const previousSound = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.previousSound);

    if (!previousSound) return true;

    let order;

    // If shuffle order exists, use that, else map the sounds to an order
    if (playlist?.mode === CONST.PLAYLIST_MODES.SHUFFLE) {
        order = playlist.playbackOrder;
    } else {
        order = playlist?.sounds.map(s => s.id);
    }

    const previousIdx = order.indexOf(previousSound);
    const playlistloop = playlist.getFlag(MAESTRO.MODULE_NAME, MAESTRO.DEFAULT_CONFIG.PlaylistLoop.flagNames.loop);

    // If the previous sound was the last in the order, and playlist loop is set to false, don't play the incoming sound
    if (previousIdx === (playlist?.sounds?.size - 1) && playlistloop === false) {
        update.playing = false;
        playlist.playing = false;
    }
}

/**
 * PreCreate Chat Message handler
 */
export function _onPreCreateChatMessage(message, data, options, userId) {
    const removeDiceSound = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.disableDiceSound);
    const diceSound = CONFIG.sounds?.dice ?? "sounds/dice.wav";

    if (removeDiceSound && data.sound === diceSound) {
        message.updateSource({sound: null});
    }
}

/**
 * Render Chat Message handler
 * @param {*} message
 * @param {HTMLElement} html
 * @param {*} data
 */
export function _onRenderChatMessage(message, html, data) {
    const enableCriticalSuccessFailureTracks = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks);

    if (enableCriticalSuccessFailureTracks) {
        playCriticalSuccessFailure(message);
    }
}

/**
 * Process Critical Success/Failure for a given message
 * @param {*} message
 */
function playCriticalSuccessFailure(message) {
    if ( !isFirstGM() || !message.isRoll || !message.isContentVisible ) return;

    for (const roll of message.rolls) {
        checkRollSuccessFailure(roll);
    }

}

/**
 * Play a sound for critical success or failure on d20 rolls
 * Adapted from highlightCriticalSuccessFailure in the dnd5e system
 * @param {*} roll
 */
function checkRollSuccessFailure(roll) {
    // Highlight rolls where the first part is a d20 roll
    if ( !roll.dice.length ) return;
    const d = roll.dice[0];

    // Ensure it is the configured die type and unmodified
    const faceSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalDieFaces);
    const facesMatch = (d.faces === faceSetting) && ( d.results.length === 1 );
    if ( !facesMatch ) return;
    const isModifiedRoll = ("success" in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
    if ( isModifiedRoll ) return;

    // Get the sounds
    const criticalSuccessFailureTracks = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessFailureTracks);
    const criticalSuccessPlaylist = criticalSuccessFailureTracks.criticalSuccessPlaylist;
    const criticalSuccessSound = criticalSuccessFailureTracks.criticalSuccessSound;
    const criticalFailurePlaylist = criticalSuccessFailureTracks.criticalFailurePlaylist;
    const criticalFailureSound = criticalSuccessFailureTracks.criticalFailureSound;

    // Get the success/failure criteria
    const successSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalSuccessThreshold);
    const failureSetting = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.criticalFailureThreshold);

    const successThreshold = successSetting ?? d.options.critical;
    const failureThreshold = failureSetting ?? d.options.fumble;

    // Play relevant sound for successes and failures
    if ((successThreshold && (d.total >= successThreshold)) && (criticalSuccessPlaylist && criticalSuccessSound)) {
        Playback.playTrack(criticalSuccessSound, criticalSuccessPlaylist);
    } else if ((failureThreshold && (d.total <= failureThreshold)) && (criticalFailurePlaylist && criticalFailureSound)) {
        Playback.playTrack(criticalFailureSound, criticalFailurePlaylist)
    }
}

/**
 * Checks for the presence of the Critical playlist, creates one if none exist
 */
export async function _checkForCriticalPlaylist() {
    const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks);
    const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.createCriticalSuccessPlaylist);

    if(!isFirstGM() || !enabled || !createPlaylist) {
        return;
    }

    let playlist = game.playlists.contents.find(p => p.name == MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName);

    if(!playlist) {
        playlist = await _createCriticalPlaylist(true);
    }
}

/**
 * Create the Critical playlist if the create param is true
 * @param {Boolean} create - whether or not to create the playlist
 */
async function _createCriticalPlaylist(create) {
    if (!create) {
        return;
    }
    return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.Misc.criticalSuccessPlaylistName});
}

/**
 * Checks for the presence of the Failure playlist, creates one if none exist
 */
export async function _checkForFailurePlaylist() {
    const enabled = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.enableCriticalSuccessFailureTracks);
    const createPlaylist = game.settings.get(MAESTRO.MODULE_NAME, MAESTRO.SETTINGS_KEYS.Misc.createCriticalFailurePlaylist);

    if(!isFirstGM() || !enabled || !createPlaylist) {
        return;
    }

    let playlist = game.playlists.contents.find(p => p.name == MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName);

    if(!playlist) {
        playlist = await _createFailurePlaylist(true);
    }
}

/**
 * Create the Failure playlist if the create param is true
 * @param {Boolean} create - whether or not to create the playlist
 */
async function _createFailurePlaylist(create) {
    if (!create) {
        return;
    }
    return await Playlist.create({"name": MAESTRO.DEFAULT_CONFIG.Misc.criticalFailurePlaylistName});
}

/**
 * Gets the first (sorted by userId) active GM user
 * @returns {User | undefined} the GM user document or undefined if none found
 */
export function getFirstActiveGM() {
    return game.users.filter(u => u.isGM && u.active).sort((a, b) => a.id?.localeCompare(b.id)).shift();
}

/**
 * Checks if the current user is the first active GM user
 * @returns {Boolean} Boolean indicating whether the user is the first active GM or not
 */
export function isFirstGM() {
    return game.userId === getFirstActiveGM()?.id;
}
