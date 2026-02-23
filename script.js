document.addEventListener('DOMContentLoaded', () => {
    // --- ELECTRON IPC (commandes multimédia Windows) ---
    const ipcRenderer = (() => {
        try {
            const { ipcRenderer } = require('electron');
            return ipcRenderer;
        } catch (e) {
            return null; // contexte navigateur, pas Electron
        }
    })();

    const sendThumbbar = (isPlaying) => {
        if (ipcRenderer) ipcRenderer.send('update-thumbar', isPlaying);
    };
    // --- SÉLECTEURS ---
    const audio = document.getElementById('main-audio');
    const fileLoader = document.getElementById('file-loader');
    const statusLine = document.getElementById('status-line');
    const infoLine = document.getElementById('info-line');
    const vfdDisplay = document.querySelector('.vfd-display');
    const volDisplay = document.getElementById('vol-display');
    const trackNumberDisplay = document.getElementById('track-number');
    const formatDisplay = document.getElementById('file-format');
    const timeDisplay = document.getElementById('time-display');
    const albumDisplay = document.getElementById('album-name');
    const artistDisplay = document.getElementById('artist-name');
    const statusIcon = document.getElementById('status-icon');
    const randomIndicator = document.getElementById('random-indicator');
    const repeatIndicator = document.getElementById('repeat-indicator');
    const abIndicator = document.getElementById('ab-indicator');
    const modal = document.getElementById('cover-modal');
    const modalImg = document.getElementById('cover-art-full');
    const closeModal = document.querySelector('.close-modal');

    // --- NOUVEAUX SÉLECTEURS TONALITÉ ---
    const bassMinus = document.getElementById('bass-minus');
    const bassPlus = document.getElementById('bass-plus');
    const trebleMinus = document.getElementById('treble-minus');
    const treblePlus = document.getElementById('treble-plus');
    const toneResetBtn = document.getElementById('tone-reset-btn');

    // --- SÉLECTEURS PLAYLIST POPUP ---
    const playlistModal = document.getElementById('playlist-modal');
    const playlistItems = document.getElementById('playlist-items');
    const closePlaylist = document.querySelector('.close-playlist');

    // Playlist state
    let playlist = [];
    let currentIndex = 0;
    let volTimeout;
    let currentCoverData = null;
    let repeatMode = 0;
    let isRandomMode = false;
    let isTimeRemaining = false;

    // A-B Loop State
    let abPointA = null;
    let abPointB = null;

    // --- UTILITAIRE : TAILLE DYNAMIQUE DU TITRE ---
    const fitText = (element, maxFontSize) => {
        if (!element) return;
        let fontSize = maxFontSize;
        element.style.fontSize = fontSize + 'px';
        while (element.scrollWidth > element.offsetWidth && fontSize > 12) {
            fontSize--;
            element.style.fontSize = fontSize + 'px';
        }
    };

    // --- ÉTAT TONALITÉ ---
    let bassLevel = 0;
    let trebleLevel = 0;
    let bassFilter, trebleFilter;

    // Boutons Rotatifs
    const inputKnob = document.getElementById('input-knob');
    const volumeKnob = document.getElementById('volume-knob');

    // Boutons de Transport
    const playPauseBtn = document.getElementById('play-pause');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Boutons Utilitaires
    const displayBtn = document.getElementById('display-btn');
    const muteBtn = document.getElementById('mute-btn');
    const standbyBtn = document.getElementById('standby-btn');
    const muteLed = document.getElementById('mute-led');

    const displayLed = displayBtn.parentElement.querySelector('.led');

    // --- POPUP OPTIONS ---
    const optionsBtn = document.getElementById('options-toggle');
    const optionsPopup = document.getElementById('options-popup');
    const randomBtn = document.getElementById('random-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const abBtn = document.getElementById('ab-btn');

    // --- VARIABLES AVANCE/RETOUR RAPIDE ---
    let seekInterval;
    let isSeeking = false;
    const SEEK_STEP = 3;

    // --- VARIABLES VOLUME (NOUVEAU) ---
    let volumeInterval;

    // --- VISUALISEUR (VU-MÈTRE) ---
    const canvas = document.getElementById('vfd-visualizer');
    const ctx = canvas.getContext('2d');
    let audioCtx, analyser, source, dataArray;

    function initVisualizer() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audio);

        // --- CONFIGURATION FILTRES TONALITÉ ---
        bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = "lowshelf";
        bassFilter.frequency.value = 200;
        bassFilter.gain.value = bassLevel;

        trebleFilter = audioCtx.createBiquadFilter();
        trebleFilter.type = "highshelf";
        trebleFilter.frequency.value = 3000;
        trebleFilter.gain.value = trebleLevel;

        // Chaînage : Source -> Basses -> Aigus -> Analyseur -> Destination
        source.connect(bassFilter);
        bassFilter.connect(trebleFilter);
        trebleFilter.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * dpr;
        canvas.height = canvas.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        draw();
    }

    function draw() {
        requestAnimationFrame(draw);
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        const logicalWidth = canvas.width / (window.devicePixelRatio || 1);
        const logicalHeight = canvas.height / (window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        const barWidth = Math.floor((logicalWidth / dataArray.length) * 0.85);
        const segmentHeight = 4;
        const segmentGap = 1;
        const totalSegments = Math.floor(logicalHeight / (segmentHeight + segmentGap));
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const intensity = dataArray[i] / 255;
            const segmentsToFill = Math.floor(intensity * totalSegments);
            for (let j = 0; j < segmentsToFill; j++) {
                const y = Math.floor(logicalHeight - (j * (segmentHeight + segmentGap)));
                let color = "#33ccff";
                const percent = j / totalSegments;
                if (percent > 0.75) color = "#ff0000";
                else if (percent > 0.55) color = "#ffaa00";
                ctx.fillStyle = color;
                ctx.fillRect(Math.floor(x), y - segmentHeight, barWidth, segmentHeight);
                ctx.fillStyle = "rgba(255,255,255,0.1)";
                ctx.fillRect(Math.floor(x), y - segmentHeight, barWidth, 1);
            }
            x += (logicalWidth / dataArray.length);
        }
    }

    // --- MEDIA SESSION (CHROME/EDGE CONTROLS) ---
    const updateMediaSession = (title, artist, album, cover) => {
        if (!('mediaSession' in navigator)) return;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: album,
            artwork: cover ? [{ src: cover, sizes: '512x512', type: 'image/png' }] : []
        });
    };

    const updatePositionState = () => {
        if (!('mediaSession' in navigator)) return;
        if (!isNaN(audio.duration) && audio.duration > 0) {
            try {
                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate,
                    position: audio.currentTime
                });
            } catch (e) {}
        }
    };

    // Enregistrement des handlers une seule fois au démarrage
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            if (!audio.src) return;
            initVisualizer();
            audio.play();
            playPauseBtn.classList.add('active');
            statusIcon.innerHTML = '<i class="fa-solid fa-play"></i>';
            navigator.mediaSession.playbackState = 'playing';
        });

        navigator.mediaSession.setActionHandler('pause', () => {
            audio.pause();
            playPauseBtn.classList.remove('active');
            statusIcon.innerHTML = '<i class="fa-solid fa-pause"></i>';
            navigator.mediaSession.playbackState = 'paused';
        });

        navigator.mediaSession.setActionHandler('stop', () => {
            audio.pause();
            audio.currentTime = 0;
            playPauseBtn.classList.remove('active');
            statusIcon.innerHTML = '<i class="fa-solid fa-stop"></i>';
            navigator.mediaSession.playbackState = 'none';
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (playlist.length === 0) return;
            currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            loadTrack(currentIndex);
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
            if (playlist.length === 0) return;
            currentIndex = getNextIndex();
            loadTrack(currentIndex);
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const step = details.seekOffset || 10;
            audio.currentTime = Math.max(0, audio.currentTime - step);
            updatePositionState();
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const step = details.seekOffset || 10;
            audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
            updatePositionState();
        });

        try {
            navigator.mediaSession.setActionHandler('seekto', (details) => {
                if (details.seekTime !== undefined) {
                    audio.currentTime = details.seekTime;
                    updatePositionState();
                }
            });
        } catch (e) {}
    }

    // --- FONCTION AFFICHAGE TONALITÉ SUR VFD ---
    const showToneOnVFD = (label, value) => {
        if (vfdDisplay.classList.contains('power-off')) return;
        const volContainer = document.querySelector('.volume-center');
        const volLabel = volContainer.querySelector('.vol-label');
        volLabel.innerText = label;

        if (label === "TONE" && value === 0) {
            volDisplay.innerText = "FLAT";
        } else {
            volDisplay.innerText = `${value > 0 ? "+" : ""}${value}dB`;
        }

        volContainer.classList.add('visible');
        clearTimeout(volTimeout);
        volTimeout = setTimeout(() => { if (!audio.muted) volContainer.classList.remove('visible'); }, 1500);
    };

    // --- ÉCOUTEURS TONALITÉ ---
    bassMinus?.addEventListener('click', () => {
        initVisualizer();
        bassLevel = Math.max(-10, bassLevel - 2);
        if (bassFilter) bassFilter.gain.value = bassLevel;
        showToneOnVFD("BASS", bassLevel);
    });
    bassMinus?.addEventListener('mouseenter', () => showToneOnVFD("BASS", bassLevel));

    bassPlus?.addEventListener('click', () => {
        initVisualizer();
        bassLevel = Math.min(10, bassLevel + 2);
        if (bassFilter) bassFilter.gain.value = bassLevel;
        showToneOnVFD("BASS", bassLevel);
    });
    bassPlus?.addEventListener('mouseenter', () => showToneOnVFD("BASS", bassLevel));

    trebleMinus?.addEventListener('click', () => {
        initVisualizer();
        trebleLevel = Math.max(-10, trebleLevel - 2);
        if (trebleFilter) trebleFilter.gain.value = trebleLevel;
        showToneOnVFD("TREBLE", trebleLevel);
    });
    trebleMinus?.addEventListener('mouseenter', () => showToneOnVFD("TREBLE", trebleLevel));

    treblePlus?.addEventListener('click', () => {
        initVisualizer();
        trebleLevel = Math.min(10, trebleLevel + 2);
        if (trebleFilter) trebleFilter.gain.value = trebleLevel;
        showToneOnVFD("TREBLE", trebleLevel);
    });
    treblePlus?.addEventListener('mouseenter', () => showToneOnVFD("TREBLE", trebleLevel));

    toneResetBtn?.addEventListener('click', () => {
        initVisualizer();
        bassLevel = 0; trebleLevel = 0;
        if (bassFilter) bassFilter.gain.value = 0;
        if (trebleFilter) trebleFilter.gain.value = 0;
        showToneOnVFD("TONE", 0);
    });
    toneResetBtn?.addEventListener('mouseenter', () => showToneOnVFD("TONE", 0));

    // --- CHARGEMENT DE PISTE ---
    const loadTrack = (index) => {
        if (playlist.length > 0 && playlist[index]) {
            resetABLoop();
            const file = playlist[index];
            const fileURL = URL.createObjectURL(file);
            audio.src = fileURL;

            const bitrateDisplay = document.getElementById('bitrate-display');
            if (bitrateDisplay) bitrateDisplay.innerText = "---";

            if (formatDisplay) {
                const extension = file.name.split('.').pop().toUpperCase();
                formatDisplay.innerText = extension;
            }

            trackNumberDisplay.innerText = `${index + 1}/${playlist.length}`;
            timeDisplay.innerText = isTimeRemaining ? "-00:00" : "00:00";
            statusLine.innerText = "READING TAGS...";
            currentCoverData = null;

            audio.onloadedmetadata = () => {
                if (bitrateDisplay && audio.duration) {
                    const kbps = Math.floor((file.size * 8) / audio.duration / 1000);
                    bitrateDisplay.innerText = `${kbps} KBPS`;
                }
            };

            jsmediatags.read(file, {
                onSuccess: function (tag) {
                    const tags = tag.tags;
                    const title = tags.title ? tags.title.toUpperCase() : file.name.replace(/\.[^/.]+$/, "").toUpperCase();
                    const artist = tags.artist ? tags.artist.toUpperCase() : "UNKNOWN ARTIST";
                    const album = tags.album ? tags.album.toUpperCase() : "SINGLE";

                    statusLine.innerText = title;
                    setTimeout(() => fitText(statusLine, 30), 10);
                    artistDisplay.innerText = artist;
                    albumDisplay.innerText = album;

                    if (tags.picture) {
                        const { data, format } = tags.picture;
                        let base64String = "";
                        for (let i = 0; i < data.length; i++) {
                            base64String += String.fromCharCode(data[i]);
                        }
                        currentCoverData = `data:${format};base64,${window.btoa(base64String)}`;
                    }

                    // Mise à jour Media Session
                    updateMediaSession(title, artist, album, currentCoverData);
                },
                onError: function () {
                    const title = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
                    statusLine.innerText = title;
                    setTimeout(() => fitText(statusLine, 30), 10);
                    artistDisplay.innerText = "DS200 PLAYER";
                    albumDisplay.innerText = "NO METADATA";

                    // Mise à jour Media Session même sans métadonnées
                    updateMediaSession(title, "DS200 PLAYER", "NO METADATA", null);
                }
            });

            if (playPauseBtn.classList.contains('active')) {
                audio.play().catch(e => console.log("Lecture auto bloquée"));
            }
        }
    };

    const getNextIndex = () => {
        if (isRandomMode && playlist.length > 1) {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * playlist.length);
            } while (nextIndex === currentIndex);
            return nextIndex;
        }
        return (currentIndex + 1) % playlist.length;
    };

    const resetABLoop = () => {
        abPointA = null;
        abPointB = null;
        if (abIndicator) abIndicator.style.display = "none";
        if (abBtn) abBtn.style.boxShadow = "none";
    };

    if (abBtn) {
        abBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!audio.src || audio.paused && audio.currentTime === 0) return;

            if (abPointA === null) {
                abPointA = audio.currentTime;
                if (abIndicator) {
                    abIndicator.innerText = "A-";
                    abIndicator.style.display = "inline";
                }
                abBtn.style.boxShadow = "0 0 15px #ffaa00";
            } else if (abPointB === null) {
                if (audio.currentTime > abPointA) {
                    abPointB = audio.currentTime;
                    if (abIndicator) abIndicator.innerText = "A-B";
                    abBtn.style.boxShadow = "0 0 25px #ffaa00";
                }
            } else {
                resetABLoop();
            }
        });
    }

    audio.addEventListener('play', () => {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });

    audio.addEventListener('pause', () => {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });

    audio.addEventListener('timeupdate', () => {
        updatePositionState();
        if (abPointA !== null && abPointB !== null) {
            if (audio.currentTime >= abPointB) {
                audio.currentTime = abPointA;
            }
        }

        if (timeDisplay && !isNaN(audio.currentTime) && !isNaN(audio.duration)) {
            let timeToShow;
            let prefix = isTimeRemaining ? "-" : "";
            if (isTimeRemaining) {
                timeToShow = audio.duration - audio.currentTime;
            } else {
                timeToShow = audio.currentTime;
            }
            const mins = Math.floor(timeToShow / 60).toString().padStart(2, '0');
            const secs = Math.floor(timeToShow % 60).toString().padStart(2, '0');
            timeDisplay.innerText = `${prefix}${mins}:${secs}`;
        }
    });

    audio.addEventListener('ended', () => {
        if (repeatMode === 1) {
            audio.currentTime = 0;
            audio.play();
        } else if (repeatMode === 2) {
            currentIndex = getNextIndex();
            loadTrack(currentIndex);
            audio.play();
        } else {
            if (currentIndex < playlist.length - 1 || isRandomMode) {
                currentIndex = getNextIndex();
                loadTrack(currentIndex);
                audio.play();
            } else {
                playPauseBtn.classList.remove('active');
                statusIcon.innerHTML = '<i class="fa-solid fa-stop"></i>';
            }
        }
    });

    timeDisplay.style.cursor = "pointer";
    timeDisplay.addEventListener('click', (e) => {
        e.stopPropagation();
        isTimeRemaining = !isTimeRemaining;
        const event = new Event('timeupdate');
        audio.dispatchEvent(event);
    });

    const startSeeking = (direction) => {
        if (!audio.src) return;
        isSeeking = true;
        seekInterval = setInterval(() => {
            if (direction === 'forward') {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + SEEK_STEP);
            } else {
                audio.currentTime = Math.max(0, audio.currentTime - SEEK_STEP);
            }
        }, 150);
    };

    const stopSeeking = () => {
        clearInterval(seekInterval);
        setTimeout(() => isSeeking = false, 50);
    };

    trackNumberDisplay.style.cursor = "pointer";
    trackNumberDisplay.addEventListener('click', () => {
        if (playlist.length === 0) return;

        // Toggle le popup
        const isOpen = playlistModal.classList.contains('open');
        if (isOpen) {
            playlistModal.classList.remove('open');
            return;
        }

        // Reconstruire la liste
        playlistItems.innerHTML = "";
        playlist.forEach((file, index) => {
            const li = document.createElement('li');
            li.style.padding = "10px 18px";
            li.style.borderBottom = "1px solid #111";
            li.style.cursor = "pointer";
            li.style.color = "#33ccff";
            li.style.fontSize = "12px";
            li.style.letterSpacing = "1px";

            if (index === currentIndex) {
                li.classList.add('active-track');
                li.innerHTML = `▶ ${index + 1}. ${file.name.toUpperCase()}`;
            } else {
                li.innerText = `${index + 1}. ${file.name.toUpperCase()}`;
            }

            li.addEventListener('click', (e) => {
                e.stopPropagation();
                currentIndex = index;
                loadTrack(currentIndex);
                // Mettre à jour le titre actif sans fermer
                playlistItems.querySelectorAll('li').forEach((el, i) => {
                    el.classList.remove('active-track');
                    el.style.color = "#33ccff";
                    if (i === currentIndex) {
                        el.classList.add('active-track');
                        el.innerHTML = `▶ ${i + 1}. ${playlist[i].name.toUpperCase()}`;
                    } else {
                        el.innerText = `${i + 1}. ${playlist[i].name.toUpperCase()}`;
                    }
                });
            });

            playlistItems.appendChild(li);
        });

        playlistModal.classList.add('open');
    });

    if (closePlaylist) closePlaylist.onclick = (e) => {
        e.stopPropagation();
        playlistModal.classList.remove('open');
    };

    nextBtn.addEventListener('mousedown', () => {
        const timer = setTimeout(() => startSeeking('forward'), 500);
        const clear = () => { clearTimeout(timer); stopSeeking(); nextBtn.removeEventListener('mouseup', clear); };
        nextBtn.addEventListener('mouseup', clear);
    });

    nextBtn.addEventListener('click', () => {
        if (playlist.length === 0 || isSeeking) return;
        currentIndex = getNextIndex();
        loadTrack(currentIndex);
    });

    prevBtn.addEventListener('mousedown', () => {
        const timer = setTimeout(() => startSeeking('backward'), 500);
        const clear = () => { clearTimeout(timer); stopSeeking(); prevBtn.removeEventListener('mouseup', clear); };
        prevBtn.addEventListener('mouseup', clear);
    });

    prevBtn.addEventListener('click', () => {
        if (playlist.length === 0 || isSeeking) return;
        currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        loadTrack(currentIndex);
    });

    if (optionsBtn) {
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = optionsPopup.style.display === 'flex';
            optionsPopup.style.display = isVisible ? 'none' : 'flex';
        });
    }

    if (repeatBtn) {
        repeatBtn.addEventListener('click', () => {
            repeatMode = (repeatMode + 1) % 3;
            if (repeatMode === 0) {
                repeatBtn.style.boxShadow = "none";
                if (repeatIndicator) repeatIndicator.style.display = "none";
            } else if (repeatMode === 1) {
                repeatBtn.style.boxShadow = "0 0 15px #33ccff";
                if (repeatIndicator) {
                    repeatIndicator.innerText = "REPEAT 1";
                    repeatIndicator.style.display = "inline";
                }
            } else if (repeatMode === 2) {
                repeatBtn.style.boxShadow = "0 0 25px #33ccff";
                if (repeatIndicator) {
                    repeatIndicator.innerText = "REPEAT ALL";
                    repeatIndicator.style.display = "inline";
                }
            }
        });
    }

    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            isRandomMode = !isRandomMode;
            randomBtn.style.boxShadow = isRandomMode ? "0 0 15px #33ccff" : "none";
            if (randomIndicator) {
                randomIndicator.style.display = isRandomMode ? "inline" : "none";
            }
        });
    }

    statusLine.addEventListener('click', () => {
        if (currentCoverData) {
            modalImg.src = currentCoverData;
            modal.style.display = "block";
        }
    });

    if (closeModal) closeModal.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
        if (event.target == optionsPopup) optionsPopup.style.display = "none";
    };

    document.addEventListener('click', () => {
        if (optionsPopup) optionsPopup.style.display = 'none';
    });
    if (optionsPopup) optionsPopup.addEventListener('click', (e) => e.stopPropagation());

    const showVolumeOnVFD = () => {
        if (vfdDisplay.classList.contains('power-off')) return;
        const volContainer = document.querySelector('.volume-center');
        const volLabel = volContainer.querySelector('.vol-label');
        const currentVol = Math.round(audio.volume * 100);

        if (audio.muted) {
            volLabel.innerText = "STATUS";
            volDisplay.innerText = "MUTE";
        } else {
            volLabel.innerText = "LEVEL";
            volDisplay.innerText = `${currentVol}%`;
        }
        volContainer.classList.add('visible');
        clearTimeout(volTimeout);
        volTimeout = setTimeout(() => { if (!audio.muted) volContainer.classList.remove('visible'); }, 1500);
    };

    // --- FONCTION ACTION VOLUME ---
    const updateVolumeAction = (direction) => {
        if (audio.muted) { 
            audio.muted = false; 
            muteLed.classList.remove('active'); 
        }

        if (direction === 'up') {
            audio.volume = Math.min(1, audio.volume + 0.01);
        } else {
            audio.volume = Math.max(0, audio.volume - 0.01);
        }

        const rotationAngle = (audio.volume * 300) - 150;
        const knobOuter = volumeKnob.parentElement;
        knobOuter.style.transform = `rotate(${rotationAngle}deg)`;

        showVolumeOnVFD();
    };

    // --- NOUVEAUX ÉCOUTEURS VOLUME (Appui long) ---
    volumeKnob.addEventListener('mousedown', (e) => {
        const rect = volumeKnob.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const direction = (x < rect.width / 2) ? 'down' : 'up';

        updateVolumeAction(direction);

        volumeInterval = setInterval(() => {
            updateVolumeAction(direction);
        }, 50);
    });

    const stopVolumeChange = () => {
        clearInterval(volumeInterval);
    };

    volumeKnob.addEventListener('mouseup', stopVolumeChange);
    volumeKnob.addEventListener('mouseleave', stopVolumeChange);

    volumeKnob.addEventListener('mouseenter', showVolumeOnVFD);

    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        muteLed.classList.toggle('active');
        showVolumeOnVFD();
    });

    playPauseBtn.addEventListener('click', () => {
        if (!audio.src) return;
        initVisualizer();
        if (audio.paused) {
            audio.play();
            playPauseBtn.classList.add('active');
            statusIcon.innerHTML = '<i class="fa-solid fa-play"></i>';
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
            sendThumbbar(true);
        } else {
            audio.pause();
            playPauseBtn.classList.remove('active');
            statusIcon.innerHTML = '<i class="fa-solid fa-pause"></i>';
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
            sendThumbbar(false);
        }
    });

    stopBtn.addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        resetABLoop();
        timeDisplay.innerText = isTimeRemaining ? "-00:00" : "00:00";
        playPauseBtn.classList.remove('active');
        statusIcon.innerHTML = '<i class="fa-solid fa-stop"></i>';
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        sendThumbbar(false);
    });

    inputKnob.addEventListener('click', () => fileLoader.click());
    fileLoader.addEventListener('change', (e) => {
        playlist = Array.from(e.target.files);
        if (playlist.length > 0) { currentIndex = 0; loadTrack(currentIndex); }
    });

    displayBtn.addEventListener('click', () => {
        vfdDisplay.classList.toggle('power-off');
        if (displayLed) displayLed.classList.toggle('active');
    });

    standbyBtn.addEventListener('click', () => {
        statusLine.innerText = "SHUTDOWN...";
        setTimeout(() => window.location.reload(), 500);
    });

    audio.volume = 0.05;
    const knobOuter = volumeKnob.parentElement;
    knobOuter.style.transform = `rotate(${(audio.volume * 300) - 150}deg)`;

    // --- DRAG & DROP ---
    const dropOverlay = document.getElementById('drop-overlay');
    const ACCEPTED_TYPES = ['audio/mpeg', 'audio/flac', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'video/mp4'];
    const ACCEPTED_EXT = /\.(mp3|flac|wav|mp4)$/i;
    let dragCounter = 0;

    const isAudioFile = (file) =>
        ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXT.test(file.name);

    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        const hasAudio = Array.from(e.dataTransfer.items).some(
            item => item.kind === 'file'
        );
        if (hasAudio) dropOverlay.classList.add('active');
    });

    document.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            dropOverlay.classList.remove('active');
        }
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropOverlay.classList.remove('active');

        const files = Array.from(e.dataTransfer.files).filter(isAudioFile);
        if (files.length === 0) return;

        playlist = files;
        currentIndex = 0;
        loadTrack(currentIndex);
        playPauseBtn.classList.add('active');
        statusIcon.innerHTML = '<i class="fa-solid fa-play"></i>';
        initVisualizer();
        audio.play().catch(err => console.log('Lecture auto bloquée:', err));
    });

    // --- RÉCEPTION DES COMMANDES MULTIMÉDIA ELECTRON ---
    if (ipcRenderer) {

        // Touches multimédia clavier + boutons barre des tâches Windows
        ipcRenderer.on('media-control', (event, action) => {
            if (action === 'play-pause') {
                if (!audio.src) return;
                initVisualizer();
                if (audio.paused) {
                    audio.play();
                    playPauseBtn.classList.add('active');
                    statusIcon.innerHTML = '<i class="fa-solid fa-play"></i>';
                    sendThumbbar(true);
                } else {
                    audio.pause();
                    playPauseBtn.classList.remove('active');
                    statusIcon.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    sendThumbbar(false);
                }
            } else if (action === 'next') {
                if (playlist.length === 0) return;
                currentIndex = getNextIndex();
                loadTrack(currentIndex);
            } else if (action === 'prev') {
                if (playlist.length === 0) return;
                currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
                loadTrack(currentIndex);
            }
        });

        // Ouverture de fichiers via "Ouvrir avec" ou glisser sur l'icône
        ipcRenderer.on('open-files', (event, filePaths) => {
            const ACCEPTED_EXT = /\.(mp3|flac|wav|mp4|m4a|aac|ogg)$/i;
            const validPaths = filePaths.filter(p => ACCEPTED_EXT.test(p));
            if (validPaths.length === 0) return;

            // Convertir les chemins en objets File via fetch + Blob
            Promise.all(validPaths.map(p =>
                fetch(p.startsWith('file://') ? p : `file:///${p.replace(/\\/g, '/')}`)
                    .then(r => r.blob())
                    .then(blob => new File([blob], p.split(/[\\/]/).pop(), { type: blob.type }))
            )).then(files => {
                playlist = files;
                currentIndex = 0;
                loadTrack(currentIndex);
                playPauseBtn.classList.add('active');
                statusIcon.innerHTML = '<i class="fa-solid fa-play"></i>';
                initVisualizer();
                audio.play().catch(e => console.log('Lecture auto bloquée:', e));
                sendThumbbar(true);
            }).catch(err => console.error('Erreur chargement fichiers IPC:', err));
        });
    }

});