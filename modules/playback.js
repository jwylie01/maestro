import * as MAESTRO from "./config.js";


/**
* Get all the sounds in a specific playlist
*/
export function getPlaylistSounds(playlistId) {
    if (!playlistId || typeof playlistId !== "string") {
        return;
    }
    const playlist = game.playlists.get(playlistId);

    if (!playlist) {
        return;
    }

    return playlist.sounds;
}

/**
 * For a given trackId get the corresponding playlist sound
 * @param {String} trackId
 */
export function getPlaylistSound(trackId) {
    if (!this.playlist) {
        return;
    }
    return this.playlist.sounds.find(s => s.id == trackId);
}

/**
 * Play a playlist sound based on the given trackId
 * @param {String} trackId - the track Id or playback mode
 * @param {String} playlistId - the playlist id
 */
export async function playTrack(trackId, playlistId) {
    if (!playlistId || !trackId) {
        return;
    }

    const playlist = game.playlists.get(playlistId);

    if (!playlist) {
        return;
    }

    if (trackId === MAESTRO.DEFAULT_CONFIG.ItemTrack.playbackModes.random) {
        const ids = playlist.sounds?.map(s => s.id) ?? [];
        trackId = ids[ids.length * Math.random() | 0];
    }

    const sound = playlist.sounds?.get(trackId);

    if (!sound) return;

    return await playlist.playSound(sound);
}

/**
 * Play a playlist using its default playback method
 * @param {String} playlistId
 */
export async function playPlaylist(playlistId) {
    if (!playlistId) {
        return;
    }

    const playlist = game.playlists.get(playlistId);

    if (!playlist) {
        return;
    }

    await playlist.playAll();
}

/**
 * Finds a Playlist sound by its name
 * @param {*} searchString
 * @param {*} findBy
 */
export function findPlaylistSound(searchString, findBy="name") {
    const playlist = game.playlists.contents.find(p => p.sounds.find(s => s[findBy] === searchString));
    return playlist ? {playlist, sound: playlist.sounds.find(s => s[findBy] === searchString)} : null;
}

/**
 * Play a sound by its name rather than id
 * @param {*} name
 * @param {*} options
 */
export function playSoundByName(name, {playlist=null}={}) {
    let sound = null;

    // If no playlist provided, try to find the first matching one
    if (!playlist) {
        const match = findPlaylistSound(name);

        if (!match?.playlist) {
            ui.notifications.warn(game.i18n.localize("MAESTRO.PLAYBACK.PlaySoundByName.NoPlaylist"));
            return;
        }

        ({playlist, sound} = match);
    } else {
        if (typeof playlist === "string") playlist = game.playlists.get(playlist) ?? game.playlists.getName(playlist);
        sound = playlist?.sounds.find(s => s.name === name);
    }

    if (!playlist || !sound) {
        ui.notifications.warn(game.i18n.localize("MAESTRO.PLAYBACK.PlaySoundByName.NoPlaylist"));
        return;
    }

    return playlist.playSound(sound);
}

/**
 * Pauses playing playlist sounds
 * @param {*} sounds
 */
export async function pauseSounds(sounds) {
    if (!sounds) {
        return;
    }

    if (!(sounds instanceof Array)) {
        sounds = [sounds];
    }

    const pausedSounds = [];

    for (let sound of sounds) {
        // If the sound param is a string, determine if it is a name or a path
        if (typeof(sound) === "string") {
            sound = findPlaylistSound(sound)?.sound ?? findPlaylistSound(sound, "path")?.sound ?? null;
        }

        if (!(sound instanceof CONFIG.PlaylistSound.documentClass)) {
            continue;
        }

        await sound.update({playing: false, pausedTime: sound.sound?.currentTime ?? null});
        pausedSounds.push(sound);
    }

    return pausedSounds;
}

/**
 * Resume playback on one or many playlist sounds
 * @param {*} sounds
 */
export function resumeSounds(sounds) {
    if (!(sounds instanceof Array)) {
        sounds = [sounds];
    }

    const resumedSounds = [];

    for (const sound of sounds) {
        sound.update({playing: true});

        resumedSounds.push(sound);
    }

    return resumedSounds;
}

/**
 * Pauses all active playlist sounds
 */
export async function pauseAll() {
    const activeSounds = game.playlists.contents.flatMap(p => {
        return p.sounds?.contents?.filter(s => s.playing) ?? [];
    });

    if (!activeSounds.length) return [];

    const pausedSounds = await pauseSounds(activeSounds);
    return pausedSounds;
}
