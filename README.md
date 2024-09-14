# TravelingSalesman

## About

This repository features an innovative algorithm for solving the Euclidean Traveling Salesman Problem (ETSP) by utilizing the midpoints of the convex hull edges. The approach combines elements of geometry and optimization to address the classic TSP in a novel way. The algorithm employs a modified greedy method with two distinct metrics for determining the shortest path, inspired by natural optimization principles.

## Features

- **Algorithm Type**: Modified greedy algorithm.
- **Metrics**:
  - Metric 1: Shortest distance from any inner point (IP) to all infinitely extended outer points (OP) edges, adjusted by the angle from the midpoint (MP) to the IP.
  - Metric 2: Euclidean distance between an MP and an IP.
- **Inspiration**: Based on natural optimization principles and geometric analogies, such as the effect of a vacuum around a buckyball.

## How It Works

1. **Get All Midpoints (MP)**: MP is used to show which edge is being connected to an IP.
2. **Calculate Shortest Distance**: Use the selected metric to find the shortest distance from IP.
3. **Update Points**: Connect IP(s) to OP(s) based on the shortest distance and update points accordingly.
4. **Handle Virtual Connections**: For non-distinct IP connections, use simultaneous recursions to find the optimal path.
