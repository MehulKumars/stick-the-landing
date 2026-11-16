# 04 — Game spec: Stick the Landing (working title)

> Selected 2026-11-16, after Siesta ("too basic") and Lungful ("no clear goal, cheap-looking, no VFX") were
> turned down by the project owner. The brief for this one, in his words: a clear win condition, 2.5D with real
> animation and VFX, a clear ladder from easy to hard, fun from the first seconds, multiplayer as an option.
> The name is a working title and has not been checked for conflicts.

## 1. Pitch
You are a tree frog. Pull back and let go, like a catapult, and the frog flies in an arc and **sticks to whatever
it lands on**: the ground, a wall, the underside of a branch. Every level has one goal that is always on screen:
**reach the flower**. Fewer hops is better; each level has a par.

## 2. Why this one
- **One sentence explains it** ("flick the frog to the flower"), and the first level is won with one flick.
- **Physical and immediate**: aim, release, watch. Past winners lean on a physical hook; "fun beats planning".
- **A clear ladder**: three tiers named Easy, Medium and Hard on the map, each level numbered, each with a par.
- **2.5D**: the game is played on a flat plane, drawn as a lit 3D diorama (Three.js) with shadows, depth and particles.
- **Room to grow**: daily levels, community-made levels and races all fit the same rules (see §6).

## 3. Rules (implemented in `src/shared/leap`, pure and deterministic)
- The board is 8 tiles wide and 13 tall. The frog is a circle 0.68 tiles across.
- **Hop**: a speed and direction, at most 17 tiles a second (about 4 tiles high, 8 far). It must leave the surface
  the frog is on. Hops are whole numbers of 1/8 tile per second, so a run can be written down and replayed.
- **Bark** (`#`): the frog sticks where it touches, at any angle.
- **Wet stone** (`o`) and the bamboo at the sides: too slick to hold. The frog bounces, or slides to a stop on top.
- **Mushroom** (`M`): touch it anywhere and it throws the frog straight out from the middle of its cap at 22 tiles
  a second (about 7 tiles high), whatever way the frog arrived. On the ground that is straight up; on a wall,
  sideways. It throws once per hop: coming back down on it, the frog just sits on top.
- **Web** (`W`): catches the frog in mid-air. From a web it can hop in any direction.
- **Thorns** (`^`) and **water** (`~`, or falling off the bottom): back to the last perch. The hop still counts.
- **Flower**: it has a dotted ring round it. The level is won the moment any part of the frog touches the ring,
  in the air or at rest. Three stars at par or better, two within two hops of par, one for finishing.
- A frog that catches the very corner of a block shuffles onto the nearest flat face, so it never hangs at an angle.
- Physics runs in fixed steps of 1/120 s using only + − × ÷ and square roots, so the server can replay a
  player's hops (`replay`) and land in exactly the same place.

## 4. Levels and proof
- 15 built-in levels in three tiers of five (`levels.ts`): Sprout (easy), Sapling (medium), Canopy (hard).
  Each new thing gets its own first level and a one-line hint.
- `solve.ts` searches hops from every perch (every 5 degrees, seven strengths) for the shortest route. A unit
  test checks that every level has a route and that its par equals the solver's hop count.
- The first three levels draw the whole arc while aiming; after that only the start of it.

## 5. Screens
- **Home / level map**: the live 3D scene with the frog in close-up beside the name, and the three tiers on a
  sheet below, each with its difficulty in words and leaves, stars per level, locked levels, one button to carry on.
- **Level**: name and difficulty, the goal ("Reach the flower"), hops and par, restart, mute. A hint line under
  the board until the first hop. On the first level a finger shows the pull.
- **Reaching the flower**: the flower opens, petals burst, the camera moves in, then a card with the stars.

## 6. Not built yet
- The Reddit layer: server (verify a run by replay), daily post, streaks, leaderboard, sharing. The `src/server`
  code in this folder is still Siesta's.
- **Daily levels**: a generated, solver-proven set each day (easy, medium, hard).
- **Multiplayer**: race the same level against other players (their frogs shown as ghosts), with honest
  small-number copy when few are playing.
- **Community levels**: an editor, where a level can only be posted once its author has finished it.
- Real sounds, more levels and mechanics, the inline splash, tutorial state in Redis (it is in localStorage now).
