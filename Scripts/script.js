const globalSettings = {
    activeMusicBox: null,
    noteOnColour: "#54F2F2",
    noteOffColour: "#042A2B",
    playHeadOnColor: "#54F2F2",
    playHeadOffColor: "#042A2B",
    draggingMusicWindow: false,
    defaultWidth: 5,
    defaultScale: scales.C5MajorScale,
    loadedSong: null,
    savedSongs: []
}

class MusicBox {
    constructor(scale) {
        this.container = document.getElementById("flex-container-music-box");
        this.height = scale.length;
        this.isPlaying = false;
        this.playTimeout;

        this.scale = scale;

        this.noteColumns = [];
        this.noteGrid = [[]];
        this.activeNoteFlags = [[]];
        this.playHeads = [];
    }

    create(width) {
        this.width = 0;
        for (let i = 0; i < width; i++) {
            this.addNoteColumn();
        }

        this.activeNoteFlags.pop();
        this.noteGrid.pop();
    }

    logState() {
        console.log(this.noteGrid);
        console.log(this.playHeads);
        console.log(this.activeNoteFlags);
        console.log(this.noteColumns);
    }

    changeScale(scale) {
        const newHeight = scale.length;
        if (newHeight === this.height) {
            return;
        }

        this.scale = scale;

        const diff = Math.abs(this.height - newHeight);

        if (newHeight > this.height) {
            for (let i = 0; i < diff; i++) {
                this.addRow();
            }
            return;
        }

        for (let i = 0; i < diff; i++) {
            this.removeRow();
        }
    }

    addRow() {
        const newHeight = this.height + 1;
        for (let i = 0; i < this.width; i++) {
            const currentColumn = this.noteColumns[i];
            const newNote = this.getHtmlNote();
            currentColumn.appendChild(newNote);

            const newNoteDiv = this.noteColumns[i].children[newHeight];
            this.noteGrid[i].push(newNoteDiv);

            this.activeNoteFlags[i].push(false);

            this.assignButton(i, this.height);
        }

        this.height++;
    }

    removeRow() {
        for (let i = 0; i < this.width; i++) {
            this.noteColumns[i].lastChild.remove();

            this.activeNoteFlags[i].pop();

            this.noteGrid[i].pop();
        }
        this.height--;
    }

    resize(width) {
        if (this.width == width) {
            return;
        }

        const diff = Math.abs(this.width - width);

        if (width > this.width) {
            for (let i = 0; i < diff; i++) {
                this.addNoteColumn();
            }
            return;
        }

        for (let i = 0; i < diff; i++) {
            this.removeNoteColumn();
        }
    }

    addNoteColumn() {
        const newMusicColumn = this.getHtmlColumn(this.scale, true);

        this.container.appendChild(newMusicColumn);

        this.noteColumns.push(newMusicColumn);
        this.container.appendChild(newMusicColumn);

        const newIndex = this.container.childElementCount - 1;

        this.noteGrid.push([]);
        this.playHeads.push([]);
        this.activeNoteFlags.push([]);

        this.playHeads[newIndex] = newMusicColumn.firstChild;

        for (let i = 0; i < this.height; i++) {
            this.noteGrid[newIndex].push(newMusicColumn.children[i + 1]);
            this.activeNoteFlags[newIndex].push(false);
            this.assignButton(newIndex, i);
        }

        this.width++;
    }

    removeNoteColumn() {
        const removedColumn = this.noteColumns.pop();
        this.container.removeChild(removedColumn);

        this.activeNoteFlags.pop();
        this.noteGrid.pop();
        this.playHeads.pop();

        this.width--;
    }

    assignButton(column, row) {

        const currentNote = this.noteGrid[column][row];

        currentNote.onclick = () => {
            console.log('Note pressed!');

            if (globalSettings.draggingMusicWindow) return;

            const nextState = !this.activeNoteFlags[column][row];

            if (nextState) {
                console.log('Playing note ' + this.scale[row]);
                PlayNote(this.scale[row]);
            }

            const colour = (nextState) ? globalSettings.noteOnColour : globalSettings.noteOffColour;
            currentNote.style.background = colour;

            this.activeNoteFlags[column][row] = nextState;
        };
    }

    play(currentColumn = -999) {
        if (currentColumn < 0) {
            currentColumn = 0;
        }
        else if (currentColumn >= this.width) {
            this.playHeads[currentColumn - 1].style.background = globalSettings.playHeadOffColor;
            return;
        }

        this.isPlaying = true;

        if (currentColumn > 0) {
            this.playHeads[currentColumn - 1].style.background = globalSettings.playHeadOffColor;
        }
        this.playHeads[currentColumn].style.background = globalSettings.playHeadOnColor;


        for (let i = 0; i < this.height; i++) {
            if (!this.activeNoteFlags[currentColumn][i]) {
                continue;
            }

            PlayNote(this.scale[i]);
        }

        currentColumn++;

        const musicBox = this;

        this.playTimeout = setTimeout(function () {
            musicBox.play(currentColumn);
        }, 400);
    }

    clear() {
        this.clearActiveNoteIndicators();
        this.clearPlayheadIndicators();

        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.activeNoteFlags[i][j] = false;
            }
        }

    }

    drawActiveNoteIndicators() {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                const currentNote = this.noteGrid[i][j];
                const state = this.activeNoteFlags[i][j];

                const colour = (state) ? globalSettings.noteOnColour : globalSettings.noteOffColour;
                currentNote.style.background = colour;
            }
        }
    }

    clearPlayheadIndicators() {
        for (let i = 0; i < this.width; i++) {
            this.playHeads[i].style.background = globalSettings.playHeadOffColor;
        }
    }

    clearActiveNoteIndicators() {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.noteGrid[i][j].style.background = globalSettings.noteOffColour;
            }
        }
    }

    stop() {
        this.clearPlayheadIndicators();
        clearTimeout(this.playTimeout);
        this.isPlaying = false;
    }

    save() {
        const saveData = {
            scale: this.scale,
            width: this.width,
            activeNoteFlags: this.activeNoteFlags
        }

        if (globalSettings.loadedSong.name == "New Song...") {
            const newTitle = prompt("Enter a name for the song.");
            const newSong = new Song(newTitle, this.scale, this.width, this.activeNoteFlags);
            globalSettings.savedSongs.push(newSong);
            AddNewSongCard(newSong);
            return;
        }

        globalSettings.loadedSong.scale = saveData.scale;
        globalSettings.loadedSong.width = saveData.width;
        globalSettings.loadedSong.activeMusicBox = saveData.activeNoteFlags;
    }

    load(songData) {
        this.stop();

        this.resize(songData.width);
        this.changeScale(songData.scale);

        this.activeNoteFlags = songData.activeNoteFlags;
        this.drawActiveNoteIndicators();
    }

    getHtmlSavedIndex(songName) {
        const saveList = document.getElementById("saved-songs");
        const newSongElement = document.createElement('option');

        newSongElement.setAttribute('value', songName);
        newSongElement.innerHTML = songName;

        saveList.appendChild(newSongElement);

        return newSongElement;
    }

    getHtmlNote() {
        const note = document.createElement('div');
        note.setAttribute('class', 'note');
        return note;
    }

    getHtmlColumn(scale, renderNoteNames = false) {
        const musicColumn = document.createElement('div');
        musicColumn.setAttribute('class', 'flex-container-note-column');

        const playhead = document.createElement('div');
        playhead.setAttribute('class', 'playhead');

        musicColumn.appendChild(playhead);

        for (let i = 0; i < scale.length; i++) {
            const note = this.getHtmlNote();
            musicColumn.appendChild(note);
        }

        return musicColumn;
    }
}

class Song {
    constructor(name, scale = globalSettings.defaultScale,
        width = globalSettings.defaultWidth, activeNoteFlags = []) {
        this.name = name;
        this.scale = scale;
        this.width = width;

        const height = scale.length;
        if (activeNoteFlags = []) {
            this.activeNoteFlags = activeNoteFlags;
            for (let i = 0; i < this.width; i++) {
                activeNoteFlags.push([]);
                for (let j = 0; j < height; j++) {
                    activeNoteFlags[i].push(false);
                }
            }
        }
        else {
            this.activeNoteFlags = activeNoteFlags;
        }
    }
}

class SliderControls {
    constructor() {
        this.slider = null;
        this.mousedown = false;
        this.draggingMusicWindow = false;
        this.startX = 0;
        this.scrollLeftOnDown = null;
    }

    bind(musicBox) {
        this.slider = musicBox.container;

        window.addEventListener('mousedown', (e) => {
            this.startX = e.pageX;
            this.mousedown = true
            this.scrollLeftOnDown = this.slider.scrollLeft;

            globalSettings.draggingMusicWindow = false;
        });

        window.addEventListener('mouseup', () => {
            this.mousedown = false
        });

        musicBox.container.addEventListener('mousemove', (e) => {
            if (!this.mousedown) return;

            const diff = (e.pageX - this.startX);

            globalSettings.draggingMusicWindow = true;

            this.slider.scrollLeft = this.scrollLeftOnDown - diff;
        });
    }
}

class MusicBoxControls {
    constructor() {
        this.playButton = document.getElementById("play-button");
        this.stopButton = document.getElementById("stop-button");
        this.clearButton = document.getElementById("clear-button");
    }

    bind(musicBox) {
        this.playButton.onclick = () => {
            if (musicBox.isPlaying) {
                musicBox.stop();
            }
            musicBox.play();
        };

        this.stopButton.onclick = () => musicBox.stop();

        this.clearButton.onclick = () => musicBox.clear();

        document.getElementById("add-button").onclick = () => musicBox.addNoteColumn();
        document.getElementById("remove-button").onclick = () => musicBox.removeNoteColumn();

        document.getElementById("load-button").onclick = () => {
            ToggleLoadWrapper();
        }

        document.getElementById("save-button").onclick = () => {
            musicBox.save();
        }

    }
}

function TESTING_FEATURES() {
    NewSong("Song One");
    NewSong("Song Two");
    NewSong("Song Three");
    LoadSongs();
}

function ToggleLoadWrapper() {
    const loadWrapper = document.getElementById('load-song-wrapper');

    if (loadWrapper.style.zIndex > 0) {
        loadWrapper.style.zIndex = -1;
    }
    else {
        loadWrapper.style.zIndex = 1;
    }
}

function NewSong(name) {
    const newSong = new Song(name);
    globalSettings.savedSongs.push(newSong);
}

function LoadSongs() {
    const numberOfSongs = globalSettings.savedSongs.length;
    for (let i = 0; i < numberOfSongs; i++) {
        const song = globalSettings.savedSongs[i];
        AddNewSongCard(song);
    }
}

function AddNewSongCard(song) {
    const songCardFlex = document.getElementById('flex-load-song');
    const newCard = document.createElement('div');

    newCard.setAttribute('class', 'song-card');
    newCard.innerHTML = song.name;

    songCardFlex.appendChild(newCard);

    newCard.onclick = () => {
        globalSettings.savedSongs.forEach(element => {
            if (element.name === newCard.innerHTML) {
                globalSettings.loadedSong = element;
                globalSettings.activeMusicBox.load(element);
                ToggleLoadWrapper();
            }
        });
    }
}

window.addEventListener('load', () => {
    const standardBox = new MusicBox(scales.medium);
    standardBox.create(5);

    globalSettings.activeMusicBox = standardBox;

    const sliderControls = new SliderControls();
    sliderControls.bind(globalSettings.activeMusicBox);

    const musicBoxControls = new MusicBoxControls();
    musicBoxControls.bind(globalSettings.activeMusicBox);

    const newSong = new Song("New Song...");
    globalSettings.loadedSong = newSong;

    TESTING_FEATURES();
});
