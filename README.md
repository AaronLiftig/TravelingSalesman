# TravelingSalesman
## An alternative traveling salesman algorithm using the midpoints of the convex hull edges.
### Still a work in progress.
### Run current code here: https://repl.it/@AaronLiftig/Traveling-Salesman

OP = Outer Points (connected points of the convex hull and the inner points that have been connected)
IP = Inner Points (unconnected points on the interior of the convex hull)
MP = Midpoints (midpoints of the OP)

This algorithm is a modified greedy algorithm. 

The user can use the metrics paramteter to select from two different metrics to calculate the next shortest distance. 
- Metric 1 is the shortest distance from any IP to all infinitely extended OP edges, divided by sine of the angle from the respective MP to the IP.
- Metric 2 is the euclidean distance between an MP to an IP
- More metrics to come...

For Metric 1, the **\"divided by sine...\"** angle weight is used to incorporate proximity to the MP while also avoiding collinear cases where one of the OPs would be jumped in the process of connecting to the closest IP. Such collinear points are treated as being infinitely far away. 

I was inspired by the innate optimization of nature. I imagined a cross-section of a bubble enveloping an object whose vertices make up the nodes of a traveling salesman graph of points. Another visual analogy is to imagine a vacuum seal bag around an irregular buckyball. Take a cross section of that object where the center of mass is in the cross section. With this algorithm, I am attempting to represent the effect of sucking out the air from the center of mass of the buckyball.

The idea is similar to ideas found in the following links:
- https://www2.isye.gatech.edu/~mgoetsch/cali/VEHICLE/TSP/TSP017__.HTM
- https://arxiv.org/abs/1303.4969
- https://www.researchgate.net/publication/257201541_Alpha_Convex_Hull_a_Generalization_of_Convex_Hull
 
### Pseudocode:
1. Get all MP.
   1. MPs are also used as reference to show which edge is being connected to an IP.
2. Use the selected metric to find the shortest distance from IP.
3. WHILE there are still unconnected IP:
   1. Find the IP(s) associated with the min value from step 2.
   2. Update OPs and IPs, with newly connected IPs becoming OPs. 
   3. IF the shortest distance is one or many MP connecting to one or multiple, **distinct** (not shared) IP:
      1. Connect the new IP(s) via the OP(s) that share the MP(s) that made contact.
      2. Repeat steps 1 through 3 for all newly created MPs.
   4. ELSE IF the shortest distance is one or many MP connecting multiple, **non-distinct** (shared) IP:
      1. Treat all such IP as tempory virtual connections.
      2. Have **simultaneous** recursions for each virtual connection occurring, yield their next shortest distance until one prevails.
      3. The winning virtual connection is kept and others are disregarded.
         1. Use information from virtual connection to save compuation time.
         2. In cases where IP are eliminated before a winning virtual connection is found, there are multiple shortest path solutions.


### Additional Notes:
The current version does not have a working version of the **non-distinct** cases. All other aspects of the algorithm are functioning as written, though it may still require tweeking, particularly the metrics.

### The questions that I seek to answer are:
- What are the upper and lower bounds (or best and worst cases) of this algorithm's time complexity?
   - This depends on what information is initially (allowed to be) given. In some cases the Euclidean distances are provided, but this requires distances from new points on the edges. 
- What types of graphs does this algorithm work for? 
- How could I better implement my inspiration from natural physical optimization and \"vacuum effect\"?
   - Does the \"vacuum effect\" represent some geometric center where if this effect occurs within the ultimate optimal path, then the algorithm may work?
      - What is the probability that this \"center\" generally falls within the optimal path
         - Can a Monte Carlo simulation be used to answer this question?
- What is the best way to apply a weight the distances created in step 2 of the pseudocode?
   - Should the distance from the midpoint be used?
   - Should some multiple of the angle be used?
   - Should some variation of Euclidean distance be used (e.g. not taking the square root)?
