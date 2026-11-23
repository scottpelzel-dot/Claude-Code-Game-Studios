// PROTOTYPE - NOT FOR PRODUCTION
// Question: Is chasing and ramming bots in a game of tag fun for ten minutes?
// Date: 2026-11-22
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },

  // ---- The shift (Patient Tag) -------------------------------------------------------------
  rounds: { value: 3, min: 1, max: 5, step: 1 },                 // rounds in a shift
  round_time: { value: 120, min: 20, max: 300, step: 5 },         // seconds a round lasts
  countdown: { value: 2.4, min: 0, max: 5, step: 0.2 },          // seconds frozen before a round
  bots: { value: 5, min: 2, max: 7, step: 1 },                   // rivals in a match: up to seven, two of each kind of rig
  star_base: { value: 0.42, min: 0, max: 1, step: 0.01 },        // share of the shift spent clean for 2 stars
  star_step: { value: 0.13, min: 0.02, max: 0.3, step: 0.01 },   // extra share for each star after that

  // ---- Tag --------------------------------------------------------------------------------
  tag_min_speed: { value: 3, min: 0, max: 15, step: 0.5 },       // m/s closing speed a ram needs to pass the patient
  tagback_grace: { value: 3.5, min: 0, max: 8, step: 0.25 },     // seconds the old IT cannot be tagged back
  tag_stall: { value: 1.0, min: 0, max: 3, step: 0.1 },          // seconds the new IT spins out, engine cut
  tag_spin: { value: 7, min: 0, max: 14, step: 0.5 },            // rad/s of comedy spin on the new IT
  it_speed_bonus: { value: 1.1, min: 1, max: 1.4, step: 0.01 },  // IT's top speed multiplier, so chases end

  // ---- Handling (all vehicles) ------------------------------------------------------------
  turn_rate: { value: 2.3, min: 1, max: 4, step: 0.05 },         // rad/s of steering at cornering speed
  turn_speed_ref: { value: 7, min: 2, max: 15, step: 0.5 },      // m/s at which steering reaches full rate
  turn_fade: { value: 0.4, min: 0, max: 0.8, step: 0.05 },       // share of steering lost at top speed
  grip: { value: 9, min: 2, max: 20, step: 0.5 },                // sideways grip on pavement, per second: grippy
  drift_grip: { value: 1.5, min: 0.2, max: 6, step: 0.1 },       // sideways grip with the handbrake held
  drift_turn_boost: { value: 1.75, min: 1, max: 3, step: 0.05 }, // steering multiplier in a drift
  drift_recover: { value: 0.35, min: 0.05, max: 1.5, step: 0.05 }, // seconds for grip to come back
  drift_min_speed: { value: 6, min: 0, max: 15, step: 0.5 },     // m/s below which the handbrake just brakes
  brake: { value: 34, min: 10, max: 60, step: 1 },               // m/s² of braking
  reverse_speed: { value: 9, min: 3, max: 15, step: 0.5 },       // m/s top speed in reverse
  drag: { value: 0.5, min: 0, max: 2, step: 0.05 },              // per second, coasting
  wall_bounce: { value: 0.25, min: 0, max: 0.9, step: 0.05 },    // speed kept bouncing off a wall
  car_bounce: { value: 0.55, min: 0, max: 1, step: 0.05 },       // bounce between vehicles
  reset_stall: { value: 0.8, min: 0, max: 3, step: 0.1 },        // seconds lost on a reset

  // ---- Terrain: pavement, dirt (grass lots and the bayou banks) and water ------------------
  offroad_grip: { value: 0.68, min: 0.2, max: 1, step: 0.02 },   // share of grip most rigs keep off the pavement
  offroad_drag: { value: 14, min: 4, max: 40, step: 1 },         // m/s² lost when a rig arrives on dirt too fast

  // ---- The rigs. top: m/s on pavement. accel: m/s². turn: steering share. mass: who shoves whom.
  // dirt and water: share of top speed kept on that surface. ----------------------------------
  // Ambulance: quickest off the line and out of a tight turn; lightest, so easiest to shove.
  amb_top: { value: 26, min: 15, max: 40, step: 0.5 },
  amb_accel: { value: 21, min: 5, max: 30, step: 0.5 },
  amb_turn: { value: 1.0, min: 0.5, max: 1.5, step: 0.05 },
  amb_mass: { value: 1.0, min: 0.5, max: 5, step: 0.1 },
  amb_dirt: { value: 0.8, min: 0.3, max: 1, step: 0.02 },
  amb_water: { value: 0.5, min: 0.2, max: 1, step: 0.02 },
  // Fire engine: the most stable in contact, steady steering; widest turn and slowest from a stop.
  fire_top: { value: 25, min: 15, max: 40, step: 0.5 },
  fire_accel: { value: 10, min: 5, max: 30, step: 0.5 },
  fire_turn: { value: 0.8, min: 0.5, max: 1.5, step: 0.05 },
  fire_mass: { value: 3.4, min: 0.5, max: 6, step: 0.1 },
  fire_dirt: { value: 0.78, min: 0.3, max: 1, step: 0.02 },
  fire_water: { value: 0.6, min: 0.2, max: 1, step: 0.02 },
  fire_forgive: { value: 0.85, min: 0.6, max: 1, step: 0.01 },   // share of its drawn size the fire engine collides at
  // Police cruiser: fastest on pavement, sharp steering; slowest on dirt, slides wide when too fast.
  cop_top: { value: 29.5, min: 15, max: 40, step: 0.5 },
  cop_accel: { value: 17, min: 5, max: 30, step: 0.5 },
  cop_turn: { value: 1.15, min: 0.5, max: 1.5, step: 0.05 },
  cop_mass: { value: 1.3, min: 0.5, max: 5, step: 0.1 },
  cop_dirt: { value: 0.58, min: 0.3, max: 1, step: 0.02 },
  cop_water: { value: 0.4, min: 0.2, max: 1, step: 0.02 },
  cop_slide: { value: 0.5, min: 0, max: 0.9, step: 0.05 },       // share of grip the cruiser loses at top speed
  // Humvee: loses nothing on dirt and keeps its grip there; modest on a paved straight.
  hum_top: { value: 23.5, min: 15, max: 40, step: 0.5 },
  hum_accel: { value: 15, min: 5, max: 30, step: 0.5 },
  hum_turn: { value: 0.95, min: 0.5, max: 1.5, step: 0.05 },
  hum_mass: { value: 2.2, min: 0.5, max: 5, step: 0.1 },
  hum_dirt: { value: 1.0, min: 0.3, max: 1, step: 0.02 },
  hum_water: { value: 0.8, min: 0.2, max: 1, step: 0.02 },
  hum_offroad_grip: { value: 1.0, min: 0.2, max: 1.2, step: 0.02 }, // share of grip the Humvee keeps off the pavement

  // ---- The bots, by round: the challenge's ramp --------------------------------------------
  bot_speed_r1: { value: 0.94, min: 0.4, max: 1.2, step: 0.01 }, // share of top speed a bot uses
  bot_speed_r2: { value: 1.0, min: 0.4, max: 1.2, step: 0.01 },
  bot_speed_r3: { value: 1.04, min: 0.4, max: 1.2, step: 0.01 },
  bot_turn_r1: { value: 0.92, min: 0.3, max: 1.2, step: 0.01 },  // share of steering a bot uses
  bot_turn_r2: { value: 1.0, min: 0.3, max: 1.2, step: 0.01 },
  bot_turn_r3: { value: 1.0, min: 0.3, max: 1.2, step: 0.01 },
  bot_lead_r1: { value: 0.6, min: 0, max: 1.5, step: 0.05 },       // how far ahead a chasing bot aims, 0 to 1
  bot_lead_r2: { value: 0.9, min: 0, max: 1.5, step: 0.05 },
  bot_lead_r3: { value: 1.1, min: 0, max: 1.5, step: 0.05 },
  bot_dodge_range: { value: 16, min: 5, max: 40, step: 1 },      // metres at which a fleeing bot jinks away
  bot_dodge_time: { value: 0.45, min: 0.1, max: 1.5, step: 0.05 }, // seconds a jink lasts
  bot_dodge_cooldown: { value: 2.5, min: 0.5, max: 8, step: 0.25 },
  bot_leader_bias: { value: 45, min: 0, max: 120, step: 5 },     // metres closer the leader looks to a round-3 IT bot
  bot_corner_speed: { value: 15, min: 5, max: 25, step: 0.5 },   // m/s a bot brakes to for a sharp turn
  bot_cruise: { value: 0.6, min: 0.2, max: 1, step: 0.05 },        // share of its speed a bot uses while IT is far away
  bot_player_bias: { value: 12, min: 0, max: 80, step: 2 },      // metres closer you look to an IT bot than you are: they come for you
  bot_jams_to_reset: { value: 3, min: 1, max: 8, step: 1 },      // times a bot backs out of a jam before it resets onto a road

  bot_intercept_margin: { value: 0.4, min: -2, max: 4, step: 0.1 }, // seconds late an IT bot may be at a crossing's exit and still try to cut you off there
  bot_speed_br: { value: 1.0, min: 0.4, max: 1.2, step: 0.01 },  // share of top speed a bot uses in Battle Royale
  bot_react: { value: 0.6, min: 0.05, max: 1.5, step: 0.05 },    // seconds between a bot's looks at its target: what it aims at is that old
  bot_aim_error: { value: 0.17, min: 0, max: 0.3, step: 0.01 },  // radians a bot's aim may be off, either side, re-rolled at each look
  bot_fire_range: { value: 55, min: 15, max: 110, step: 5 },     // metres inside which a bot will shoot
  bot_heal_below: { value: 45, min: 0, max: 100, step: 5 },       // health at or under which a bot goes looking for a red cross crate
  bot_break_off: { value: 10, min: 2, max: 30, step: 1 },         // seconds a bot hunts one rig without hurting it before it gives up

  // ---- Battle Royale ------------------------------------------------------------------------
  br_time: { value: 180, min: 30, max: 600, step: 10 },          // seconds a match lasts
  br_hp: { value: 100, min: 20, max: 300, step: 5 },             // health of every rig
  br_damage: { value: 20, min: 5, max: 100, step: 1 },           // health a blaster bolt takes
  br_ammo_start: { value: 6, min: 0, max: 30, step: 1 },         // bolts you start and respawn with
  br_ammo_max: { value: 12, min: 1, max: 60, step: 1 },          // bolts a rig can carry
  br_pickup_ammo: { value: 6, min: 1, max: 30, step: 1 },        // bolts in a crate
  br_pickup_respawn: { value: 9, min: 1, max: 60, step: 1 },     // seconds before a crate comes back
  br_health_amount: { value: 40, min: 5, max: 200, step: 5 },      // health in a red cross crate
  br_health_respawn: { value: 14, min: 1, max: 90, step: 1 },    // seconds before a health crate comes back
  br_fire_cooldown: { value: 0.35, min: 0.05, max: 2, step: 0.05 }, // seconds between bolts, for bots and you alike
  br_shot_speed: { value: 75, min: 30, max: 150, step: 5 },      // m/s
  br_shot_life: { value: 1.3, min: 0.3, max: 4, step: 0.1 },     // seconds a bolt flies
  br_shot_radius: { value: 0.9, min: 0.2, max: 3, step: 0.1 },   // metres of forgiveness round a bolt
  br_ram_min: { value: 10, min: 2, max: 30, step: 1 },           // m/s closing speed below which a ram does no damage
  br_ram_damage: { value: 1.0, min: 0, max: 6, step: 0.1 },      // health per m/s above that, shared out by weight
  br_respawn_delay: { value: 2.5, min: 0.5, max: 10, step: 0.5 }, // seconds wrecked before you are back
  br_protect: { value: 3, min: 0, max: 10, step: 0.5 },          // seconds a fresh respawn cannot be hurt; firing ends it

  // ---- Multiplayer rooms -------------------------------------------------------------------
  net_between: { value: 6, min: 2, max: 20, step: 1 },           // seconds the room waits between rounds before the next one starts by itself

  // ---- Civilian traffic (thin stand-in) ----------------------------------------------------
  civ_count: { value: 6, min: 0, max: 12, step: 1 },
  civ_speed: { value: 9, min: 3, max: 18, step: 0.5 },           // m/s cruising
  civ_pullover_range: { value: 30, min: 5, max: 80, step: 1 },   // metres from a siren at which they pull over
  civ_mass: { value: 0.8, min: 0.3, max: 3, step: 0.1 },

  // ---- Touch (a phone) ---------------------------------------------------------------------
  touch_pad_range: { value: 62, min: 30, max: 140, step: 2 },    // screen units the thumb moves for full throttle or full lock
  touch_pad_deadzone: { value: 0.18, min: 0, max: 0.5, step: 0.02 }, // share of the pad near its centre that does nothing

  // ---- Camera ------------------------------------------------------------------------------
  cam_dist: { value: 12, min: 6, max: 25, step: 0.5 },           // metres behind
  cam_height: { value: 6, min: 2, max: 15, step: 0.25 },         // metres above
  cam_turn: { value: 4.5, min: 1, max: 12, step: 0.25 },         // how fast the view swings behind you
  cam_fov: { value: 58, min: 40, max: 80, step: 1 },             // degrees at rest
  cam_fov_speed: { value: 16, min: 0, max: 30, step: 1 },        // degrees added at top speed
  cam_low_height: { value: 2.3, min: 1, max: 5, step: 0.1 },     // metres above your rig when you pass under the bridge
  cam_low_dist: { value: 8, min: 4, max: 15, step: 0.5 },        // metres behind, under the bridge
  shake: { value: 1, min: 0, max: 2, step: 0.1 },                // crash shake; 0 for reduced motion
};
