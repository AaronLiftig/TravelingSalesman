# TravelingSalesman
## An alternative traveling salesman algorithm using the midpoints of the convex hull.
### Still a work in progress.
### Run current code here: https://repl.it/@AaronLiftig/Traveling-Salesman

I was inspired by the innate optimization of nature. I imagined a cross-section of a bubble enveloping an object whose vertices make up the nodes of a traveling salesman graph. This technique is a modified greedy algorithm starting from all midpoints between the verticies of the convex hull, where one is trying to minimize the concavity of the convex hull.

Another visual analogy is to imagine a vacuum seal bag around an irregular buckyball. Take a cross section of that object where the center of mass is in the cross section. With this algorithm, I am attempting to represent the effect of sucking out the air from the center of mass of the buckyball.
   
The primary differences between this and a typical greedy algorithm are that all midpoints of the convex hull are starting points.

The idea is similar to ideas found in the following links:
- https://www2.isye.gatech.edu/~mgoetsch/cali/VEHICLE/TSP/TSP017__.HTM
- https://arxiv.org/abs/1303.4969
- https://www.researchgate.net/publication/257201541_Alpha_Convex_Hull_a_Generalization_of_Convex_Hull
 
### Pseudocode:
1. Get all midpoints between connected OP (adjacent vertices on the convex hull).
2. Find all Euclidean distances between those midpoints and all interior points.
3. WHILE there are still unconnected IP (inner points):
   1. Find the shortest distance between any existing midpoint and an IP.
   2. IF the shortest distance is one or many midpoints connecting to one or multiple, **distinct** (not shared) IP:
      1. Connect the new IP(s) via the OP(s) that share the midpoint(s) that made contact.
      2. Calculate new midpoints that were created with inclusion of the new IP(s).
      3. Update current OP and IP.
      4. Calculate all Euclidean distances from new midpoints to updated IP.
   1. ELSE IF the shortest distance is one or many midpoints connecting multiple, **non-distinct** (shared) IP:
      1. Treat all such IP as tempory virtual connections.
      2. Continue through WHILE loop until first new IP is reached by any connecting IP in question (i.e. create recursive simulations that yield distance of next closest point to the midpoints in question).
      3. That simulation that yields the shortest distance becomes part of main solution.
      4. Other temporary virtual connections are disregarded.


It appears that one of the shortcomings of this algorithm occurs when an IP is collinear to the two OPs whose midpoint is the closest option. I believe the correct way to counter this is to somehow weigh a collinear point as being infinitely far away. 
Furthermore, it may generally be best to weigh each midpoint's distance based on the angle that its two OP create with the IP in question. 
Another way around this may be to use the distance between the perpendicular intersection of the line, which is created by the two OP, and an IP. This would ensure that a collinear IP (having a distance of zero) could be counted as infintely far away.

### The questions that I seek to answer are:
- What are the upper and lower bounds (or best and worst cases) of its time complexity?
- What types of graphs does this algorithm work for? This is where my inspiration from natural physical optimization and the \"vacuum effect\" come from.
- Furthermore, does the \"vacuum effect\" represent some geometric center where if this effect occurs within the ultimate optimal path, then the algorithm may work?
- What is the probability that this \"center\" generally falls within the optimal path, and can a Monte Carlo simulation be used to answer this question?
- Additionally, does the additional step of calculating the Euclidean distances from the midpoints to the interior points constitute an additional step since the typical Euclidean distances initially provided are not needed?
- Also, is there a better point on each edge of the convex hull to use part from midpoint? (e.g. the point perpendicular to the closest unconnected interior point)? 
