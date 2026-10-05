# Traveling Salesman Lab: Vacuum-Sealing the Points

Wrap a set of points in a thin plastic bag and pump the air out. The film shrinks inward, catching on points one at a time until it rests against all of them. The order in which it touches them is a tour.

This project asks how good that tour is. It simulates a vacuum-sealing film on the Euclidean Traveling Salesman Problem, alongside earlier geometric metrics that tried to capture the same suction effect, and measures every one against the exact optimum.

## Live Demo

**[Open the Traveling Salesman Lab](https://aaronliftig.github.io/TravelingSalesman/)**

Everything runs in the browser. No server, package manager, bundler, or external library is needed.

## The Idea

Before any air is removed, the film is stretched taut around the outermost points: the convex hull. As the pump runs, outside pressure pushes the film inward between the points it rests on. Each straight stretch bows into the interior until it touches another point, which then becomes a new pin, splitting that stretch in two. The process continues until every point is on the film.

Assume no gravity and no friction. The film slides freely over the points, and the points act as pins that can only push outward.

## How the Film Moves

Each free stretch of film between two pins bows inward as a circular arc. When an arc reaches a free point, that point becomes a new pin and the stretch splits in two. The film stops when every point is a pin, and the cyclic order of the pins is the tour.

What decides *which* point the film reaches first is how much each stretch bows relative to the others. Here every stretch bows **in proportion to its length**: at any moment, all stretches take the same arc shape, just scaled. An arc through A and B is fixed by the angle it subtends at its points, so the film reaches first the free point P that sees its stretch at the widest angle:

```text
touch first: the widest ∠APB, over every stretch AB and free point P
```

The angle is computed with an inverse trigonometric function (`atan2`), which makes the rule scale-free: a short gap between two nearby points can only bow as far as its length allows, so it cannot push a thin finger out to a distant point. Every point on a stretch's inner side is eventually reached, so the film never gets stuck.

### Why tension is left out

A real film under uniform tension obeys the Young–Laplace law: every free stretch has the *same radius* R. A stretch of length L then bows in by only about L²/8R, so stretches between nearby points stay almost straight while long stretches swing deep. In practice that made spans between near points far too stiff. Points beside short stretches could only be reached when a stretch lost equilibrium and "snapped through", and physics does not say where a snapping film lands. That version averaged 8.6% above optimal at 16 points, with snap-throughs causing most of the error. Dropping tension removes both problems.

### Why the bowing is proportional

Another tension-free option lets every stretch sag the same absolute *depth*. It averaged 4.0% above optimal at 16 points, but it also produced unrealistic shapes: a tiny gap could sag as deep as a long stretch, extruding a thin finger to a far point (in 12% of runs, versus under 1% for proportional bowing). Proportional bowing is both more accurate and closer to how suction looks.

### Modelling choices

* The film cannot pass through itself: a contact that would cross the tour is skipped, and that stretch moves on to its next point.
* A point duplicating a pin, or lying on a stretch between its pins, is touched immediately.
* Exact ties on one stretch insert together, in order along the arc; ties across stretches go to the lowest edge index.
* A stretch with no free point on its inner side rests against the rest of the film.
* If no contact is possible anywhere, the round falls back to cheapest insertion (this never happened in testing).

## What the Comparison Shows

Mean gap from the exact optimum on uniform random points (300 seeds per size; 40 at n = 20):

| Method | n = 8 | n = 12 | n = 16 | n = 20 |
|---|---|---|---|---|
| **Vacuum** | **0.37%** | **1.37%** | **2.07%** | **2.71%** |
| Segment Distance | 0.48% | 2.06% | 3.73% | 5.66% |
| Midpoint Distance / Trig-Adjusted | 1.69% | 4.71% | 7.58% | 9.82% |
| Cheapest Insertion (yardstick) | 0.05% | 0.41% | 0.84% | 1.26% |

The vacuum is the closest any suction-based method comes to the optimum. It roughly halves the error of the earlier metrics, and its gap grows slowly with point count.

**Vacuum tours never cross themselves.** The earlier metrics produce self-crossing tours in 14–27% of runs at n = 16; the film, by construction, cannot.

Reproduce these numbers, plus degeneracy and scaling checks, with:

```bash
node tests/benchmark.js
```

## Earlier Attempts to Capture the Suction

Before the full physics was worked out, the project approximated the same effect with simpler geometric scores. Each starts from the convex hull and, every round, inserts the interior point that scores lowest against some current edge, an attempt to predict which point the inward-moving film would reach first.

### Trig-Adjusted (the original metric)

The perpendicular distance from P to the line through A and B, divided by the sine of the angle at the edge midpoint M between the directions to A and to P:

```text
d(P, line AB) / sin θ,    θ = ∠(A − M, P − M)
```

It tries to account for points lying off to the side of an edge rather than straight in front of it.

### Midpoint Distance

The distance from P to the edge midpoint M, where a bowing film bulges deepest:

```text
‖P − M‖,    M = (A + B) / 2
```

This turns out to be **algebraically identical** to Trig-Adjusted: the line distance equals ‖P − M‖·sin θ, so dividing by sin θ gives back ‖P − M‖. Both produce the same tours.

### Segment Distance

The shortest distance from P to any point on segment AB. It treats the film as advancing along the whole edge at once, not just at its middle.

### Cheapest Insertion (yardstick)

The classic textbook rule, not derived from the suction picture: insert where the tour grows least.

```text
d(A, P) + d(P, B) − d(A, B)
```

It starts from the same hull, so it shows how close a hull-insertion method can get.

Each of these scores how close a point is to an edge. The vacuum asks a different question: how far must the film bow before it reaches the point? The vacuum answers with the angle APB, which accounts for where along the stretch the point sits as well as how far in it is.

## Using the Lab

Choose a point count and seed, tick the methods to compare, and press **Generate & Solve**. Every selected method runs on the same points, each in its own panel next to the exact optimum, with a ranking by tour length. The Display menu narrows the view to the best method or a single one.

Playback shows the tour growing from the hull. In vacuum panels, a **violet arc** shows the film at the moment it touches each point.

Runs up to 30 points animate automatically. Larger runs open on the final tour, and Play animates them on demand.

## Measuring Against the Optimum

Every run is compared with the exact optimum from the Held–Karp algorithm, reporting length, extra length, optimality gap, whether the tour matches the optimum, step count, and runtime:

```text
gap = (method length − optimal length) / optimal length
```

Held–Karp grows exponentially, so it sets the point limit: at startup the page times it on the visitor's device and allows the largest point count it can solve in about 10 seconds alongside the selected methods. It also needs 2^(n−1)·(n−1)·9 bytes of memory (about 400 MB at 22 points), so memory usually binds first: typically 22 points on desktops and 21 on low-memory devices. The sidebar says which constraint applies.

Computation runs in short time slices, so the page stays responsive. Runs longer than about a second show real progress, per method, and can be cancelled. Results are cached per point set, so toggling methods for the same seed reuses earlier work.

## Project Structure

The application is split into small browser-native scripts, loaded in dependency order, so no build step is required.

```text
.
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── geometry.js    # distance, cross product, convex hull, route length
│       ├── generator.js   # seeded point generation
│       ├── metrics.js     # earlier geometric metrics and cheapest insertion
│       ├── vacuum.js      # the vacuum-seal film
│       ├── solver.js      # hull-insertion engine with an optional pick hook
│       ├── exact.js       # Held–Karp exact solver (sets the point limit)
│       ├── scheduler.js   # time-sliced runner, device calibration, estimates
│       ├── renderer.js    # canvas drawing (tours, contact arcs)
│       └── ui.js          # controls, panels, playback, statistics
├── tests/
│   └── benchmark.js       # node: gaps vs Held–Karp, degeneracy, scaling
└── docs/
```

Simple metrics provide `score(P, A, B)`, lower is better. The vacuum compares every stretch at once and must skip contacts that would cross the film, so the solver also accepts optional `init`, `pick`, and `meta` hooks; metrics without them are unaffected.

## Running Locally

Open `index.html` directly, or serve the folder:

```bash
python -m http.server
```

## GitHub Pages

The project deploys straight from the repository:

1. Push the project files.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**, the branch containing `index.html`, and the `/ (root)` folder.
4. Save.

No build command is required.
