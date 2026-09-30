# Traveling Salesman Lab

An interactive browser implementation of a convex-hull insertion approach to the Euclidean Traveling Salesman Problem (TSP).

The application lets you watch points being incorporated into an initial convex-hull tour, compare three geometric selection metrics, and compare the resulting tour with an exact Held–Karp solution for small point sets.

## Live Demo

**[Open the Traveling Salesman Lab](https://aaronliftig.github.io/TravelingSalesman/)**

The project runs entirely in the browser. No server, package manager, bundler, or external JavaScript library is required.

## What It Does

The algorithm starts with the convex hull of the generated points. Interior points are then evaluated against the current tour edges and inserted according to the selected geometric metric.

The application records each insertion so the process can be:

* played
* paused
* stepped through
* reset
* compared against the exact solution

The interface also provides side-by-side comparisons of the different insertion strategies and the resulting tour lengths.

## Geometric Metrics

### 1. Angle-Adjusted Line Distance

For an internal point `P` and an outer edge `AB`, the algorithm first calculates the perpendicular distance from `P` to the infinitely extended line through `A` and `B`.

That distance is then divided by the sine of the angle measured at the edge midpoint between the direction toward an endpoint and the direction toward `P`.

This is the angle-adjusted geometric measure used by the original project.

When the sine approaches zero, the metric is treated as infinite.

### 2. Midpoint Distance

Let `M` be the midpoint of edge `AB`.

The score is the Euclidean distance from `P` to `M`:

```text
d(P,M) = sqrt((Px-Mx)² + (Py-My)²)
```

### 3. Shortest Segment Distance

This metric measures the shortest Euclidean distance from `P` to any point on the finite segment `AB`.

Unlike midpoint distance, it does not restrict the closest point to the midpoint.

The perpendicular projection is calculated and clamped to the segment endpoints when necessary.

## Comparing the Heuristic With the Optimum

For small point sets, the application calculates:

* heuristic tour length
* exact optimal tour length
* excess tour length
* optimality gap
* whether the heuristic tour has the same length as the optimum
* insertion count
* measured execution time

The optimality gap is:

```text
(heuristic length - optimal length) / optimal length
```

The exact solver is intentionally limited to 20 points because the Held–Karp algorithm grows exponentially with the number of points.

## Investigating Where the Heuristic Works

The application is intended not only as a TSP solver demonstration, but also as an experimental tool for studying the geometry of the insertion process.

Point sets can be generated or constructed with different interior structures, including:

* simple inroads
* multiple competing inroads
* nested structures
* clusters
* adversarial arrangements

These can then be compared against the exact solution.

A central question is whether the quality of the resulting tour depends systematically on the depth and interaction of these interior structures.

## Project Structure

The application is intentionally split into small browser-native JavaScript modules. The modules are loaded directly by the browser in dependency order, so no bundler or build system is required.

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
│       ├── metrics.js     # three geometric insertion metrics
│       ├── solver.js      # convex-hull insertion heuristic
│       ├── exact.js       # Held–Karp exact solver
│       ├── renderer.js    # canvas visualization
│       └── ui.js          # controls, animation, statistics, event log
└── docs/
    └── (space for future documentation)
```

## Running Locally

Because the application uses browser-native JavaScript modules, it is best run through a local static server.

For example:

```bash
python -m http.server
```

Then open the local address shown by Python.

You can also run the project through GitHub Pages:

**https://aaronliftig.github.io/TravelingSalesman/**

## GitHub Pages

The project is deployed directly from the repository using GitHub Pages.

To configure Pages for a new copy of the project:

1. Push the project files to the repository.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Select the branch containing `index.html`.
5. Select `/ (root)` as the folder.
6. Save.

No build command is required.

## Background

The project is based on the repository's convex-hull/midpoint insertion approach to the Euclidean TSP.

The original method is a modified greedy approach that uses convex-hull edges and their midpoints to guide the insertion of interior points.

This browser implementation makes the process visual and provides an exact comparison for small instances, allowing the heuristic to be investigated experimentally rather than assumed to be optimal.
