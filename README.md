# Traveling Salesman Lab

An interactive browser implementation of a convex-hull insertion approach to the Euclidean Traveling Salesman Problem (TSP). It lets you watch points being incorporated into an initial convex-hull tour, compare three geometric selection metrics, and compare the resulting tour with an exact Held–Karp solution for small point sets.

## Live demo

Enable **GitHub Pages** for this repository and the project runs directly from `index.html`. No server, package manager, bundler, or external JavaScript library is required.

## What it does

The algorithm starts with the convex hull of the generated points. Interior points are then evaluated against the current tour edges and inserted according to the selected geometric metric. The application records each insertion so the process can be played, paused, stepped through, and reset.

The right-hand comparison uses an exact Held–Karp dynamic-programming solution for point sets of up to 20 points. This provides a ground truth for investigating where the geometric heuristic matches the optimum and where it diverges.

## Geometric metrics

### 1. Angle-adjusted line distance

For an internal point `P` and an outer edge `AB`, first calculate the perpendicular distance from `P` to the infinitely extended line through `A` and `B`. That distance is then divided by the sine of the angle measured at the edge midpoint between the direction toward an endpoint and the direction toward `P`.

This is the angle-adjusted geometric measure used by the original project. When the sine approaches zero, the metric is treated as infinite.

### 2. Midpoint distance

Let `M` be the midpoint of edge `AB`. The score is the Euclidean distance from `P` to `M`:

`d(P,M) = sqrt((Px-Mx)^2 + (Py-My)^2)`

### 3. Shortest segment distance

This additional metric measures the shortest Euclidean distance from `P` to **any point on the finite segment `AB`**. It does not restrict the closest point to the midpoint. The perpendicular projection is calculated and clamped to the segment endpoints when necessary.

## Comparing the heuristic with the optimum

For small point sets, the application calculates:

- heuristic tour length
- exact optimal tour length
- excess tour length
- optimality gap
- whether the tour has the same length as the optimum
- insertion count
- measured execution time

The optimality gap is:

`(heuristic length - optimal length) / optimal length`

The exact solver is intentionally limited to 20 points because Held–Karp grows exponentially with the number of points.

## Investigating where the heuristic works

The application is intended not only as a TSP solver demonstration but also as an experimental tool for studying the geometry of the insertion process. In particular, point sets can be constructed or generated with different interior structures—such as simple inroads, multiple competing inroads, nested structures, clusters, and adversarial arrangements—and compared against the exact solution.

A useful question is whether the quality of the resulting tour depends systematically on the depth and interaction of these interior structures.

## Project structure

```text
.
├── index.html
├── README.md
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── docs/
    └── (space for future documentation)
```

## Running locally

Open `index.html` directly in a modern browser. The application has no external dependencies.

For local development, a simple static server can also be used, for example:

```bash
python -m http.server
```

Then open the local address shown by Python.

## GitHub Pages

1. Push the contents of this directory to the repository.
2. In GitHub, open **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Select the branch containing `index.html` and the `/ (root)` folder.
5. Save.

Because the project is entirely static, no build command is required.

## Background

The project is based on the repository's convex-hull/midpoint insertion approach to the Euclidean TSP. The original repository describes the method as a modified greedy approach that uses convex-hull edges and their midpoints to guide the insertion of interior points.

This browser version makes the process visual and provides an exact comparison for small instances so that the heuristic can be studied rather than treated as an assumed optimal algorithm.


## Project structure

The application is intentionally split into small browser-native JavaScript modules (loaded as ordered scripts, not bundled):

```text
assets/
├── css/
│   └── style.css
└── js/
    ├── geometry.js    # distance, cross product, convex hull, route length
    ├── generator.js   # seeded point generation
    ├── metrics.js     # the three geometric insertion metrics
    ├── solver.js      # convex-hull insertion heuristic
    ├── exact.js       # Held–Karp exact solver
    ├── renderer.js    # canvas visualization
    └── ui.js          # controls, animation, statistics, event log
```

This keeps the project easy to inspect and modify while remaining directly deployable to GitHub Pages without npm, a bundler, or a server.
