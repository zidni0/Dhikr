const dhikrSequence = [
  {
    arabic: "سبحان الله",
    transliteration: "SubhanAllah",
    meaning: "Glory be to Allah",
    count: 100,
    audio: "assets/audio/subhanallah.mp3"
  },
  {
    arabic: "الحمد لله",
    transliteration: "Alhamdulillah",
    meaning: "All praise is for Allah",
    count: 100,
    audio: "assets/audio/alhamdulillah.mp3"
  },
  {
    arabic: "الله أكبر",
    transliteration: "Allahu Akbar",
    meaning: "Allah is the Greatest",
    count: 100,
    audio: "assets/audio/allahuakbar.mp3"
  },
  {
    arabic: "أستغفر الله",
    transliteration: "Astaghfirullah",
    meaning: "I seek forgiveness from Allah",
    count: 50,
    audio: "assets/audio/astaghfirullah.mp3"
  },
  {
    arabic: "أستغفر الله ربي من كل ذنب وأتوب إليه",
    transliteration: "Astaghfirullaha Rabbi min kulli dhanbin wa atubu ilayh",
    meaning: "I seek forgiveness from Allah, my Lord, for every sin, and I repent to Him",
    count: 50,
    audio: "assets/audio/astaghfirullah-rabbi.mp3"
  },
  {
    arabic: "لا إله إلا الله",
    transliteration: "La ilaha illa Allah",
    meaning: "There is no god except Allah",
    count: 50,
    audio: "assets/audio/lailahaillallah.mp3"
  },
  {
    arabic: "اللهم صل على محمد",
    transliteration: "Allahumma salli 'ala Muhammad",
    meaning: "O Allah, send blessings upon Muhammad",
    count: 50,
    audio: "assets/audio/allahumma-salli-ala-muhammad.mp3"
  },
  {
    arabic: "اللهم إنك عفو تحب العفو فاعف عني",
    transliteration: "Allahumma innaka 'afuwwun tuhibbul-'afwa fa'fu 'anni",
    meaning: "O Allah, You are Most Forgiving and love forgiveness, so forgive me",
    count: 100,
    audio: "assets/audio/allahumma-innaka-afuwwun.mp3"
  }
];

const TOTAL_REPETITIONS = dhikrSequence.reduce((sum, item) => sum + item.count, 0);
const STORAGE_KEY = "dhikr-counter-state-v1";
const TRANSITION_DELAY = 1100;

const elements = {
  appCard: document.querySelector(".app-card"),
  dhikrSurface: document.getElementById("dhikrSurface"),
  arabicText: document.getElementById("arabicText"),
  transliterationText: document.getElementById("transliterationText"),
  meaningText: document.getElementById("meaningText"),
  sequenceStepPill: document.getElementById("sequenceStepPill"),
  progressLabel: document.getElementById("progressLabel"),
  currentBadge: document.getElementById("currentBadge"),
  currentCountText: document.getElementById("currentCountText"),
  totalCountText: document.getElementById("totalCountText"),
  counterNumber: document.getElementById("counterNumber"),
  counterTarget: document.getElementById("counterTarget"),
  currentProgressText: document.getElementById("currentProgressText"),
  overallProgressText: document.getElementById("overallProgressText"),
  currentProgressFill: document.getElementById("currentProgressFill"),
  overallProgressFill: document.getElementById("overallProgressFill"),
  statusMessage: document.getElementById("statusMessage"),
  replayAudioBtn: document.getElementById("replayAudioBtn"),
  resetButton: document.getElementById("resetButton"),
  counterButton: document.getElementById("counterButton"),
  counterRipple: document.getElementById("counterRipple"),
  completionMark: document.getElementById("completionMark"),
  audioNotice: document.getElementById("audioNotice")
};

let appState = loadState();
let audioPlayer = null;
let completionPlayer = null;
let isTransitioning = false;
let audioMissingNoticeTimer = null;

initialize();

function initialize() {
  setupAudio();
  bindEvents();
  sanitizeLoadedState();
  render();
  attemptAutoPlayCurrent();
}

function sanitizeLoadedState() {
  const maxIndex = dhikrSequence.length - 1;

  if (
    typeof appState.currentDhikrIndex !== "number" ||
    appState.currentDhikrIndex < 0 ||
    appState.currentDhikrIndex > maxIndex
  ) {
    appState.currentDhikrIndex = 0;
  }

  if (!Array.isArray(appState.counts) || appState.counts.length !== dhikrSequence.length) {
    appState.counts = dhikrSequence.map(() => 0);
  }

  appState.counts = appState.counts.map((count, index) => {
    const safeCount = Number.isFinite(count) ? count : 0;
    return clamp(safeCount, 0, dhikrSequence[index].count);
  });

  for (let i = 0; i < appState.currentDhikrIndex; i += 1) {
    appState.counts[i] = dhikrSequence[i].count;
  }

  const currentTarget = dhikrSequence[appState.currentDhikrIndex].count;
  appState.counts[appState.currentDhikrIndex] = clamp(appState.counts[appState.currentDhikrIndex], 0, currentTarget);

  saveState();
}

function getDefaultState() {
  return {
    currentDhikrIndex: 0,
    counts: dhikrSequence.map(() => 0)
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const parsed = JSON.parse(raw);
    return {
      currentDhikrIndex: parsed.currentDhikrIndex,
      counts: parsed.counts
    };
  } catch {
    return getDefaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function setupAudio() {
  audioPlayer = new Audio();
  audioPlayer.preload = "none";

  completionPlayer = new Audio("assets/audio/completed.mp3");
  completionPlayer.preload = "none";
}

function bindEvents() {
  elements.counterButton.addEventListener("click", incrementCount);
  elements.counterButton.addEventListener("pointerdown", handleCounterPressEffect);

  elements.replayAudioBtn.addEventListener("click", () => {
    playDhikrAudio(getCurrentDhikr(), false);
  });

  elements.resetButton.addEventListener("click", handleReset);

  document.addEventListener("keydown", (event) => {
    const targetTag = document.activeElement ? document.activeElement.tagName : "";
    const isTypingContext = /INPUT|TEXTAREA|SELECT/.test(targetTag);

    if (isTypingContext) return;

    if (event.code === "Space" || event.key === " " || event.key === "Enter") {
      event.preventDefault();
      incrementCount();
    }
  });
}

function getCurrentDhikr() {
  return dhikrSequence[appState.currentDhikrIndex];
}

function getCurrentCount() {
  return appState.counts[appState.currentDhikrIndex];
}

function getTotalCompleted() {
  return appState.counts.reduce((sum, count) => sum + count, 0);
}

function render() {
  const dhikr = getCurrentDhikr();
  const currentCount = getCurrentCount();
  const totalCompleted = getTotalCompleted();
  const currentPercent = (currentCount / dhikr.count) * 100;
  const totalPercent = (totalCompleted / TOTAL_REPETITIONS) * 100;

  elements.arabicText.textContent = dhikr.arabic;
  elements.transliterationText.textContent = dhikr.transliteration;
  elements.meaningText.textContent = dhikr.meaning;

  const stepText = `Dhikr ${appState.currentDhikrIndex + 1} of ${dhikrSequence.length}`;
  elements.sequenceStepPill.textContent = stepText;
  elements.progressLabel.textContent = stepText;
  elements.currentBadge.textContent = `Target ${dhikr.count}`;

  elements.currentCountText.textContent = `${currentCount} / ${dhikr.count}`;
  elements.totalCountText.textContent = `${totalCompleted} / ${TOTAL_REPETITIONS}`;
  elements.counterNumber.textContent = currentCount;
  elements.counterTarget.textContent = `Target ${dhikr.count}`;

  elements.currentProgressText.textContent = `${currentCount} / ${dhikr.count}`;
  elements.overallProgressText.textContent = `${totalCompleted} / ${TOTAL_REPETITIONS}`;

  elements.currentProgressFill.style.width = `${currentPercent}%`;
  elements.overallProgressFill.style.width = `${totalPercent}%`;

  updateStatusMessage();
}

function updateStatusMessage(message) {
  if (message) {
    elements.statusMessage.textContent = message;
    return;
  }

  const dhikr = getCurrentDhikr();
  const currentCount = getCurrentCount();

  if (currentCount === 0) {
    elements.statusMessage.textContent = `Recite with presence. You are on ${dhikr.transliteration}.`;
  } else if (currentCount < dhikr.count) {
    elements.statusMessage.textContent = `${dhikr.transliteration}: ${currentCount} of ${dhikr.count} completed. Keep going.`;
  } else {
    elements.statusMessage.textContent = `${dhikr.transliteration} completed. Moving forward...`;
  }
}

function incrementCount() {
  if (isTransitioning) return;

  const currentIndex = appState.currentDhikrIndex;
  const dhikr = dhikrSequence[currentIndex];
  const currentCount = appState.counts[currentIndex];

  if (currentCount >= dhikr.count) return;

  appState.counts[currentIndex] += 1;
  saveState();
  animateTapFeedback();
  maybeVibrate();
  render();

  if (appState.counts[currentIndex] >= dhikr.count) {
    handleDhikrCompleted();
  }
}

function handleCounterPressEffect(event) {
  const button = elements.counterButton;
  const rect = button.getBoundingClientRect();
  const x = event.clientX ? event.clientX - rect.left : rect.width / 2;
  const y = event.clientY ? event.clientY - rect.top : rect.height / 2;

  elements.counterRipple.style.left = `${x}px`;
  elements.counterRipple.style.top = `${y}px`;
}

function animateTapFeedback() {
  elements.counterButton.classList.add("is-pressed");
  elements.counterRipple.classList.remove("is-animating");
  void elements.counterRipple.offsetWidth;
  elements.counterRipple.classList.add("is-animating");

  setTimeout(() => {
    elements.counterButton.classList.remove("is-pressed");
  }, 140);
}

function maybeVibrate() {
  if ("vibrate" in navigator) {
    navigator.vibrate(18);
  }
}

function handleDhikrCompleted() {
  isTransitioning = true;
  const completedDhikr = getCurrentDhikr();

  playCompletionSound();
  celebrateCompletion();
  updateStatusMessage(`${completedDhikr.transliteration} completed.`);

  setTimeout(() => {
    if (appState.currentDhikrIndex === dhikrSequence.length - 1) {
      completeFullSequence();
    } else {
      moveToNextDhikr();
    }
  }, TRANSITION_DELAY);
}

function celebrateCompletion() {
  elements.appCard.classList.add("is-celebrating");
  elements.completionMark.classList.add("is-active");

  setTimeout(() => {
    elements.appCard.classList.remove("is-celebrating");
    elements.completionMark.classList.remove("is-active");
  }, 950);
}

function moveToNextDhikr() {
  elements.dhikrSurface.classList.add("is-switching");

  setTimeout(() => {
    appState.currentDhikrIndex += 1;
    saveState();
    render();
    elements.dhikrSurface.classList.remove("is-switching");
    isTransitioning = false;
    playDhikrAudio(getCurrentDhikr(), true);
  }, 260);
}

function completeFullSequence() {
  updateStatusMessage("Sequence complete. Restarting...");

  setTimeout(() => {
    appState = getDefaultState();
    saveState();
    elements.dhikrSurface.classList.add("is-switching");

    setTimeout(() => {
      render();
      elements.dhikrSurface.classList.remove("is-switching");
      isTransitioning = false;
      playDhikrAudio(getCurrentDhikr(), true);
    }, 260);
  }, 900);
}

function handleReset() {
  const confirmed = window.confirm("Reset the full dhikr sequence and clear all saved progress?");
  if (!confirmed) return;

  stopAllAudio();
  appState = getDefaultState();
  clearState();
  saveState();
  isTransitioning = false;

  elements.dhikrSurface.classList.add("is-switching");
  setTimeout(() => {
    render();
    elements.dhikrSurface.classList.remove("is-switching");
    updateStatusMessage("Sequence reset. Begin again from the first dhikr.");
    playDhikrAudio(getCurrentDhikr(), false);
  }, 220);
}

function stopAllAudio() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
  }

  if (completionPlayer) {
    completionPlayer.pause();
    completionPlayer.currentTime = 0;
  }
}

function playCompletionSound() {
  if (!completionPlayer) return;

  completionPlayer.currentTime = 0;
  completionPlayer.play().catch(() => {
    // Silent fail. Browsers and missing files love making everything annoying.
  });
}

function playDhikrAudio(dhikr, autoPlay = false) {
  if (!audioPlayer || !dhikr) return;

  clearAudioNotice();

  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  audioPlayer.src = dhikr.audio;

  const handleError = () => {
    showAudioNotice("Audio not available");
    cleanupAudioListeners();
  };

  const handleCanPlay = () => {
    cleanupAudioListeners();

    if (!autoPlay) return;

    audioPlayer.play().catch(() => {
      showAudioNotice("Tap replay to play audio");
    });
  };

  const cleanupAudioListeners = () => {
    audioPlayer.removeEventListener("error", handleError);
    audioPlayer.removeEventListener("canplaythrough", handleCanPlay);
  };

  audioPlayer.addEventListener("error", handleError, { once: true });
  audioPlayer.addEventListener("canplaythrough", handleCanPlay, { once: true });

  if (!autoPlay) {
    audioPlayer.play().catch(() => {
      showAudioNotice("Audio not available");
    });
  } else {
    audioPlayer.load();
  }
}

function attemptAutoPlayCurrent() {
  playDhikrAudio(getCurrentDhikr(), true);
}

function showAudioNotice(message) {
  clearAudioNotice();
  elements.audioNotice.textContent = message;

  audioMissingNoticeTimer = setTimeout(() => {
    elements.audioNotice.textContent = "";
  }, 2600);
}

function clearAudioNotice() {
  if (audioMissingNoticeTimer) {
    clearTimeout(audioMissingNoticeTimer);
    audioMissingNoticeTimer = null;
  }
  elements.audioNotice.textContent = "";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}