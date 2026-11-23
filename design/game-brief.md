# Game Brief: Crash Out: Houston Edition

## In your words
"I want to make a first responder version of this what do you think?" (with a write-up of how The Simpsons: Hit & Run worked) · "Comedic"

1. Service: "1 ambulance"
2. View: "3rd person above and behind"
3. Handling: "I like grippy until you drift"
4. On foot: "It should stay all driving"
5. Look: "90s arcade" (after seeing both test shots)
6. Difficulty: "the first one is fine"
7. Goal: "the first one is fine"
8. Slice: "the first one"

"the best part I enjoyed about the Simpsons tag game was being able to, like, chase other people around and crash into them and play, like, a version of tag. So I want that to be, like, the best part about the game. Maybe they could even play bots."

"yes build it but also know this will be a multiplayer game as well"

"i also want a mode where you can race and shoot weapons at each other. and a battle royal mode"

After play: "this is also meant to be a phone game"
After play: "name will be Crash Out Houston edition"
After play: "I want a full directional pad. So I'm moving the thumb pad forward to go forward etc.  the map should be open to drive around. So you can drive across grass or whatever."
After play: "Make the fire engine easy to use since it's much bigger than the others"
After play: the owner gave a full roadmap, "Build brief for Crash Out: Houston Edition", kept word for word in `design/crash-out-roadmap.md`. It sets four modes (Patient Tag, Battle Royale, Combat Racing, Campaign), four rigs, a Houston bayou crossing, and the build order. It replaces the earlier fire-engine tuning: the engine is now the stable one with the widest turn and slowest start.
After play: "Okay there needs to be more time more bots and they need to be way better"
After play: "Some of the bots are just driving around in circles on the edge of the map."
After play: "Build Battle Royale now in the existing Crash Out: Houston Edition prototype. Start from the latest four-rig Patient Tag build. Scott likes the subtle vehicle differences and considers the current handling good. Keep those tuning values. His requested gameplay change is more skilled bots." The request went on to ask for a mode picker, a three-minute free-roam battle scored on wrecks with unlimited respawns, one shared forward-firing blaster with ammo crates on the paved and dirt routes, a FIRE button under the right thumb, a protected respawn that ends on firing, bots that decide better (a crossing intercept in Tag; ammo seeking, lining up shots, breaking off and fighting each other in Battle Royale) under the same weapon rules as the player, and the four signature abilities held for the next pass.

**Pitch:** Vehicle tag between rival emergency crews: whoever is stuck with the town's most insufferable patient is "IT", and the only way to get rid of him is to ram him into someone else's vehicle. *(guessed: the patient as the tag)*

**Genre:** arcade driving, car tag

**Controls:** W/S or arrows to accelerate and brake, A/D to steer, Space to handbrake into a drift, R to reset onto the road. *(guessed)*

**Platform:** phone: it runs in a phone's browser, with no touch kit yet: touch controls are built from your words, and no check plays them. A full directional pad under the left thumb: forward to go, back to brake and reverse, sideways to steer. *(the DRIFT button on the right is guessed)*

**Question:** Is chasing and ramming bots in a game of tag fun for ten minutes?

**Hooks:** Tag by collision. The ram is the hand-off, with a short "no tag-backs" grace so the chase flips instead of ping-ponging. *(guessed)*

**Intent:** needs 3 players *(you said: bots fill the seats)*

## Look and references
- Look: saturated 90s arcade at sunset. Purple-to-orange sky with a huge low sun at the end of the street, flat-shaded low-poly blocks, palm trees, red-and-white striped kerbs, neon sign strips, long shadows. Palette roles: white and red ambulance (player), red fire engine and dark police cruiser (rivals), yellow "IT" marker (threat), dark violet road, teal ground. Signature: the "IT" vehicle trails a flapping hospital gown and a glowing marker you can see across the district. Every figure drawn, no emoji, no plain circles.
- References: the 90s arcade test shot the person picked; early-2000s open-world driving games for the roam-and-ram structure, none of their names, characters or maps.
- View: 3D · Camera: chase, above and behind the ambulance, widening with speed.

## First minute
You start in the ambulance at a junction in a small district of Houston. A dispatcher line pops up: the fire engine has the patient. Its yellow marker is two blocks away and coming for you. You run, learn the handbrake by taking your first corner, and get rammed anyway. Now you're IT: the marker is over you, the bots scatter, and you chase the police cruiser down a straight and slam into it. The patient flies across and the hook has paid off.

## Challenge
The bots are a real fight from round one: they drive at nearly full speed, aim ahead of you and come for you in particular. Round two takes the last of the brakes off. By round three they are slightly quicker than you, and an IT bot goes straight for whoever is leading. A lost round restarts that round, not the shift.

## Core loop
- Not IT: run, use corners and alleys to shake the chaser.
- IT: chase the nearest rival and ram them to pass the patient.
- Time spent not IT fills your score; the round ends on the clock.
- Three rounds make a shift, then a star rating.

## Goal & fail state
- Finish a three-round shift and earn a public-trust rating out of five stars. You lose a round if you're IT when its clock runs out.

## Features
- [x] Ambulance with grippy handling and an easy handbrake drift
- [x] Tag by ramming, with a no-tag-backs grace
- [x] Two bot rivals, named as bots: a heavy fire engine and a quick police cruiser, each driving differently
- [x] One small district, open to drive around: streets, grass lots you can cut across between buildings, parks and a plaza
- [x] Three-round shift with a round clock, scoreboard and star rating
- [ ] Engine note that climbs with speed, siren, crunchy ram hit
- [x] Four rigs to choose from, each with its own outline, strength and weakness: ambulance (quickest off the line, lightest), fire engine (most stable in contact, widest turn, slowest start), police cruiser (fastest on pavement, slowest on dirt, slides wide), Humvee (keeps its speed and grip on dirt, modest on pavement)
- [x] Terrain: pavement, dirt (grass lots and the bayou banks) and shallow water, each rig keeping its own share of speed on each
- [x] A bayou along the north side with two crossings, a paved arched bridge and a dirt ramp to a low-water crossing, trails along both banks and under the bridge, and downtown's skyline beyond
- [x] Two to seven rival bots, chosen on the title screen (five by default), two of each kind of rig
- [x] Two-minute rounds
- [x] Bots that hunt and run in earnest: they cut you off, round the block by the shortest way, lean towards you and the leader, avoid dead ends, jink off your bumper and take corners on the handbrake
- [x] A green ring and a SAFE mark on a rig that cannot be tagged yet
- [x] A phone HUD: large timer and patient status at the top, thumbs at the bottom
- [x] A mode picker on the title screen: Patient Tag and Battle Royale
- [x] Battle Royale: a three-minute free-roam match, most rival wrecks at the buzzer wins, a draw for tied leaders, unlimited respawns
- [x] One shared weapon, a forward-firing blaster with visible bolts, and ammo crates that come back, on the streets, the bridge, the lawns and the bayou's dirt routes
- [x] Health for every rig, one wreck credited to whoever landed the last hit, a short respawn delay and a protection window that ends if you fire
- [x] A results screen with wrecks, losses, placement, Rematch and Change Mode
- [x] FIRE under the right thumb on a phone, with DRIFT beside it
- [x] Bot decisions: in Tag an IT bot predicts which bayou crossing you are taking and cuts you off at its exit when it can get there; in Battle Royale bots fetch ammo when dry, line up shots with a reaction delay and aiming error, give up a bad pursuit and fight one another
- [x] Touch controls for a phone held sideways, beside the keyboard
- [x] Civilian traffic that pulls over for sirens (thin stand-in) *(guessed)*

## Your systems
- tag, chase and crash into others · in the slice
- bots · in the slice
- civilian traffic · thin stand-in *(guessed)*
- multiplayer · later
- a mode where you can race and shoot weapons at each other · later
- a battle royal mode · later
- emergency calls and the patient-stability meter · later *(guessed)*

## Keep
-

## Avoid
- No on-foot sections: "It should stay all driving"
- No existing game's names, characters, map, art or collectibles

## Out of scope
- Online: session (a match with friends on their own machines): needs a server, so not built; built instead: bots in the seats, named as bots. Every vehicle takes a swappable driver (you, a bot, later a remote player).
- Split-screen tag with a friend on one machine: change it after play
- Combat Racing and Campaign, in that order (`design/crash-out-roadmap.md`): add it as a feature
- The four rig abilities (Priority Run, Water Cannon, Siren Pulse, Armor Up): add it as a feature, next pass
- More weapons, and a lives rule for Battle Royale: add it as a feature
- More districts: grow it
- Vehicle upgrades and tuning: add it as a feature

## Build order
1. One district, the ambulance, two bots, and a full three-round shift of tag with the star rating.
2. Civilian traffic and district dressing.
3. Emergency calls as a second mode.

---
**Kill condition:** if ramming a bot still feels flat after two tuning rounds. *(guessed)*

**Who it's for / what they feel:** players who loved causing chaos in early-2000s driving games; the glee of a chase that flips. *(guessed)*

**Games you love / don't:** Love The Simpsons: Hit & Run (chasing and crashing into others).
