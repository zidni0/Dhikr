# Dhikr
Dhikr Counter is a calm, mobile-friendly web app that guides users through a full dhikr sequence with a large tally button, Arabic text, transliteration, meaning, audio playback, saved progress, and automatic transitions. It feels smooth, elegant, and easy to use.
# Dhikr Counter

A polished, offline-ready dhikr tally counter web app built with plain HTML, CSS, and JavaScript. No backend, no frameworks, no build tools, because apparently not every decent thing on earth needs a thousand dependencies.

## Features

- Beautiful, responsive, mobile-friendly interface
- Fixed dhikr sequence rendered from a JavaScript data array
- Large circular counter button with tap animation and ripple feedback
- Shows:
  - Arabic
  - transliteration
  - meaning
  - current dhikr number
  - current count out of target
  - overall completed repetitions out of 600
- Automatically moves to the next dhikr when target count is reached
- Automatically plays the next dhikr pronunciation audio once
- Replay pronunciation button for unlimited replays
- Completion sound when each dhikr finishes
- Full sequence auto-restarts after the last dhikr
- Reset button with confirmation
- localStorage persistence so refresh does not lose progress
- Keyboard support with `Space` and `Enter`
- Vibration feedback on supported devices
- Graceful fallback if audio files are missing

## File Structure

```text
dhikr-counter/
├── index.html
├── style.css
├── script.js
├── README.md
└── assets/
    └── audio/
        ├── subhanallah.mp3
        ├── alhamdulillah.mp3
        ├── allahuakbar.mp3
        ├── astaghfirullah.mp3
        ├── astaghfirullah-rabbi.mp3
        ├── lailahaillallah.mp3
        ├── allahumma-salli-ala-muhammad.mp3
        ├── allahumma-innaka-afuwwun.mp3
        └── completed.mp3
