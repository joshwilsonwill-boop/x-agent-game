# Meteor Dodge

A tiny browser game built by an AI agent from one prompt, and the video about it, for the make.fun X video bounty.

[![make.fun bounty](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/joshwilsonwill-boop/x-agent-game/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/joshwilsonwill-boop/x-agent-game/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709?utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709)

## The game

Meteor Dodge: steer a rocket through falling asteroids with the arrow keys (or drag on touch). Every asteroid you dodge scores a point. Three lives, then game over, press R to restart. All art is drawn in code on a canvas. No network, no external assets.

The one prompt it was built from:

> Build a tiny browser game: steer a rocket through falling asteroids with arrow keys, score points for each dodge, three lives, game over screen with restart, all in one HTML file.

## The video

`video.mp4` (45 seconds, vertical 9:16) shows the prompt, the agent working in the terminal and writing the code, and the finished game running for real, ending on the make.fun referral end card.

## Run it

Open `index.html` in any browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/index.html

To run the entry point (copies `POST.json` into the output directory):

```sh
MAKEFUN_OUTPUT_DIR=out-test node main.ts
```

## Build on make.fun

Come build on make.fun: https://make.fun/?ref=mc9159gw&utm_source=github&utm_medium=readme&utm_campaign=post-x-the-agent-builds-a-game-from-20261122-1709
