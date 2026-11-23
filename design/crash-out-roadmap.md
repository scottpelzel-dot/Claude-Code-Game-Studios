# Build brief for Crash Out: Houston Edition

<!-- The owner's roadmap, saved word for word as given on 2026-11-22. Not rewritten. -->

You’re taking over my existing browser game, Crash Out: Houston Edition. Use this brief as the roadmap and start building in this session. Work toward one playable milestone at a time. Your first delivery is an improved version of Patient Tag with four distinct vehicles, a recognizable Houston bayou crossing, and controls I can test on my phone.

## Start with the existing game

The repo is `Claude-Code-Game-Studios`. The prototype is in `prototypes/siren-tag/`. The design record is `design/game-brief.md`. The last known branch was `claude/confident-turing-mblqip`. The handoff says the game and brief were untracked in a temporary cloud container.

First, check the branch, working tree, and actual files. Read the brief, find the entry point, and run the current game. Preserve the untracked source and the original requests recorded in the brief. Keep the existing folder name for now. If the current session lacks the prototype, tell me exactly what you need to recover it before starting a replacement.

Work locally. Commit, push, and public deployment each need my explicit go-ahead. This prompt authorizes implementation and local testing. If the files are still only in temporary storage, flag that clearly in your handoff.

## What I’m making

I want someone to open one link on their phone or computer, pick an emergency or military vehicle, and play an arcade driving game. Most people will play solo against bots first. Eventually I want friends to be able to join the same match from separate devices.

The game has four planned modes: Patient Tag, Battle Royale, Combat Racing, and Campaign. They share a Houston district and a vehicle roster. The existing 90s arcade sunset look, sirens, exaggerated crashes, and humor around Mr. Crouch are part of its personality. Use original assets, names, courses, sounds, and interface designs. My reference points are the free-roaming vehicle combat of Twisted Metal, the weapon-assisted racing of Mario Kart, and the fast pickup-and-delivery rhythm of Crazy Taxi.

The city should feel like Houston while you’re driving. The first image I want is crossing a bayou bridge with the downtown skyline visible ahead. Make the bridge, banks, approaches, and skyline useful for navigation. Players should eventually be able to tell each other, “I cut down by the bayou and beat you to the bridge.”

## Four vehicles, four reasons to pick one

All four rigs should be selectable from the start. Give each one a strength the player can feel, a weakness a rival can exploit, and a recognizable silhouette at phone size. Use the military Humvee as the working choice for the fourth rig. These are starting designs to test.

| Rig | Driving strength | Driving weakness | Proposed combat and race ability |
|---|---|---|---|
| Ambulance | Quickest acceleration and recovery after tight turns | Lightest rig and easiest to shove off its line | **Priority Run** gives a short acceleration burst |
| Fire engine | Most stable through contact, with predictable steering | Widest turning circle and slowest acceleration from a stop | **Water Cannon** gives a short forward spray that pushes rivals sideways |
| Police cruiser | Highest sustained speed on pavement and responsive steering | Loses the most speed on dirt, and slides wide if it enters a bend too fast | **Siren Pulse** briefly slows a nearby rival |
| Military Humvee | Best traction on grass and dirt, especially on the bayou route | Modest paved-road speed leaves it vulnerable on long straights | **Armor Up** briefly absorbs a hit, with a visible shield rivals can read |

Keep the driving behavior of each rig consistent across modes. Let every rig use the common arcade weapon pickups in combat and racing. Give the signature abilities readable effects, cooldowns, and opportunities for rivals to react. Start Patient Tag with driving and contact alone.

## How the four modes work

### 1. Patient Tag — existing mode and first milestone

Whoever carries Mr. Crouch is IT. Ram another rig to hand him over. Preserve the existing three-round shift, 70-second rounds, 3.5-second no-tag-back window, and one-second spin-out for the newly tagged rig. Being IT at the buzzer replays that round. The shift rating reflects time spent free of the patient. Verify those rules against the running code and flag any mismatch.

Make it obvious who has Mr. Crouch, when a handoff happens, and when another tag is possible. The joke should land while the player is still driving. Keep the current two-bot setup as the initial comparison point. The four-rig roster should work independently of the number of participants. Make a three-bot match easy to test so we can find out whether a fourth driver improves the chase.

### 2. Battle Royale — free-roam arcade vehicle combat

Drive anywhere in the district, collect arcade weapons, use a rig ability, and wreck opponents. Include guns, exaggerated explosions, health, kills, wrecks, and respawns. Bots should fight one another as well as the player.

For the first prototype, use a three-minute timed match, most kills at the buzzer, and a draw if leaders tie. Use unlimited respawns as a provisional rule. I originally mentioned lives as well as kills, and the final lives rule is still open. Keep that choice configurable. Give a respawning vehicle a fair chance to move, and credit each wreck once.

Start with one common weapon pickup and the minimum needed to finish and replay a complete match. Then add the four signature abilities and test how they interact.

### 3. Combat Racing — finish position decides the winner

Build one checkpoint circuit through the same district. Give it a clear start and finish, readable turns, a paved bridge route, and a dirt alternative along the bayou. Use a configurable lap count. Shared weapons and rig abilities can slow, shove, protect, or wreck racers. A wreck returns the racer to a sensible place on the course with their earned progress intact.

Race bots need to follow the route, recover after collisions, use pickups, and finish valid laps. Both routes must count fairly at checkpoints. A shortcut should save time through skill or suit a particular rig. Driving backward across the finish line must never award a lap.

### 4. Campaign — timed dispatch shifts

Each rig gets a job that fits it. Players should spend most of the shift driving, choosing routes, and trying to squeeze in one more call.

- **Ambulance:** Reach the pickup zone, let the patient board automatically, then deliver them to the hospital. Start with Mr. Crouch. Make the first pickup, ride, drop-off, and next dispatch one complete playable loop.
- **Fire engine:** Respond to fires around town and put them out. Prototype a short arrival interaction and playtest whether aiming the water cannon adds enough fun to keep.
- **Police cruiser:** Respond to incidents and complete arcade vehicle pursuits or intercepts.
- **Military Humvee:** Prototype high-water rescue calls, picking up stranded residents and taking them to staging areas.

Start with replayable scored shifts. Career progression, unlocks, additional districts, and vehicle upgrades are later design decisions.

## Build order

1. **Deliver four-rig Patient Tag in the first session.** Run the baseline, add the fourth vehicle, tune handling and terrain, build a simple playable bayou crossing with a distant skyline, and improve the phone HUD. Verify that bots can navigate the changed district. Keep the original shift playable from vehicle selection through results and replay.
2. **Build one complete Battle Royale match.** Deliver scoring, wrecks, respawns, pickups, a result screen, and replay before expanding the arsenal. Playtest on the phone with steering and firing happening at the same time.
3. **Build one complete combat race.** Reuse the vehicles and combat systems. Focus on route readability, checkpoint fairness, and getting back into the race after a hit.
4. **Build the ambulance campaign shift.** Once pickup and delivery feel good, add the other roles one at a time.
5. **Prototype private-room multiplayer in Tag.** Start with two devices joining through a link and agreeing on who has Mr. Crouch after a collision. Reuse the existing swappable-driver design. Multiplayer hosting is a later milestone.

Keep one game entry point. As each mode becomes playable, add it to the mode picker. Reuse the current stack and put tuning values in `config.js` where that fits the code. Share driving, terrain, and vehicle definitions across modes. Keep the win conditions and bot objectives specific to each mode.

## First milestone acceptance checks

- I can select each of the four rigs, start Tag, and identify who is IT while moving.
- Acceleration helps the ambulance, contact stability helps the engine, a paved straight helps the cruiser, and a dirt route helps the Humvee. Each advantage has a track section or encounter where I can try it myself.
- Both bayou routes are drivable. Bots can cross, chase, escape, and recover from a missed turn. The skyline is visible on the bridge approach.
- A handoff transfers Mr. Crouch once, applies the grace period, and lets the chase resume. The buzzer, round replay, shift rating, and new-game reset work.
- On a phone-sized screen, the timer and patient status are readable. I can steer and drift simultaneously. The camera keeps my rig visible under palm fronds and near the bridge.
- Keyboard play still works. Check audio activation after the first player interaction. Distinguish audio events firing from someone actually listening on a device.
- Report what you tested with a browser, what you simulated, and what still needs a human on a real phone. Fun, balance, and difficulty are open playtest questions.

For later balance testing, use roughly a 5% spread in clean lap times on the first mixed-surface circuit as a starting diagnostic. Also compare time spent IT, arena kills and deaths, race finishes, and whether players can explain why they prefer a particular rig. Keep the differences that make the vehicles enjoyable to drive.

## What to give me at the end of this session

Start implementing milestone one after inspecting the source. Hand back the exact way to launch the playable build, a short list of what changed, the checks you actually ran, and any decisions you made provisionally. Include a phone-accessible preview link if the current environment already provides one. Otherwise give me the local launch instructions and explain how to reach the build from a phone on the same network if supported.

Give me one short playtest assignment: drive the cruiser and Humvee through the same bayou section, then play a round of Tag in my favorite. Ask where I felt the difference, what made me laugh, and what frustrated me. That feedback should guide the next build.
