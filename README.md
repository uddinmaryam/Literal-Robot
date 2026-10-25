# Literal Robot

A puzzle game where a small isometric robot follows your instructions **literally**. You write plain-language commands, the robot does exactly what you wrote, and its funny failures teach you to be precise.

## Run it

No build step and no dependencies.

1. Unzip the project.
2. Open `index.html` in a browser, or right-click it in VS Code and choose **Open with Live Server**.

Optional: `npm test` runs the rule and translation tests (needs Node).

## How to play

Type commands, one per line. Robot only knows a few verbs:

| Command                                       | Example                         |
| --------------------------------------------- | ------------------------------- |
| `go to the ___`                               | `go to counter`                 |
| `pick up the ___`                             | `pick up bread`                 |
| `put the ___ in/on the ___`                   | `put bread in toaster`          |
| `press the ___`                               | `press toaster`                 |
| `fill the ___` / `pour the ___ on the ___`    | `fill can`, `pour can on plant` |
| `light the ___`                               | `light candle`                  |
| `wait`                                        | `wait`                          |
| `repeat N times` (indent the lines to repeat) | `repeat 4 times`                |

Robot holds one thing at a time, forgets everything between lines (so never say "it"), and does one action per line. Fewer lines earns more stars.

## Features

- 5 levels on a map, with loops introduced in the last one
- Type mode and drag-and-drop Blocks mode (they stay in sync)
- Run, Pause, Step and Back (rewind one step)
- Sandbox with every object and no goals
- Bug of the Day: a daily broken program, with streaks and a shareable result grid
- Collection of 44 failures and quirks, plus 15 badges
- Level creator with share links and codes, and friend challenges
- Sound, phone vibration, robot expressions, confetti
- English and Spanish interface, voice input, optional "Ask a real AI" panel

## Project structure

```
index.html     page structure for all screens
styles.css     styling (light and dark mode)
js/logic.js    game rules, levels, daily puzzles (no DOM, testable)
js/render.js   isometric canvas renderer and confetti
js/audio.js    synthesized sound effects and haptics
js/i18n.js     English and Spanish text
js/blocks.js   block editor
js/editor.js   level creator
js/util.js     DOM helpers
js/app.js      screens, saving, achievements
tests/         rule and translation tests
```

## Notes

- Progress is saved in the browser only (`localStorage`). There are no accounts or leaderboards.
- Share links hold the whole level in the URL. If a link does not open, paste the code into **Create**.
- Spanish covers the interface and level text. Commands and Robot's replies stay in English.
- "Ask a real AI" sends your API key and instructions directly from the browser to `api.anthropic.com`. The key is kept only if you tick "Remember".
- Voice input needs a browser with the Web Speech API (Chrome, Safari).

## Adding a level

Add an object to `LEVELS` in `js/logic.js` (copy an existing one), then add its map position to `MAP_POS` in `js/app.js`.
