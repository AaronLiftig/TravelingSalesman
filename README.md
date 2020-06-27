# TravelingSalesman
## An alternative traveling salesman algorithm using the midpoints of the convex hull.
### Still a work in progress.
### Run current code here: https://repl.it/@AaronLiftig/Traveling-Salesman

This algorithm is a modified greedy algorithm. For any two connected points on a convex hull, OP, it finds that shortest distance between the line created by those OP and any interior point, IP. It then weighs that distance based on the angle created between one of those OP, their midpoint, MP, and the IP. The angle weight is used to incorporate proximity to the MP while also avoiding collinear cases where one of the OPs would be jumped in the process of connecting to the closest IP. Such collinear points are treated as being infinitely far away. 

I was inspired by the innate optimization of nature. I imagined a cross-section of a bubble enveloping an object whose vertices make up the nodes of a traveling salesman graph. Another visual analogy is to imagine a vacuum seal bag around an irregular buckyball. Take a cross section of that object where the center of mass is in the cross section. With this algorithm, I am attempting to represent the effect of sucking out the air from the center of mass of the buckyball.

The idea is similar to ideas found in the following links:
- https://www2.isye.gatech.edu/~mgoetsch/cali/VEHICLE/TSP/TSP017__.HTM
- https://arxiv.org/abs/1303.4969
- https://www.researchgate.net/publication/257201541_Alpha_Convex_Hull_a_Generalization_of_Convex_Hull
 
### Pseudocode:
1. Get all midpoints, MP, between connected OP (adjacent vertices on the convex hull).
   1. Midpoints are also used as reference to show which edge is being connected to an interior point, IP.
   2. MP will often be used to represent the edge the midpoint is on.
2. Find the shortest Euclidean distance between all IP and the line created by any two connected OP.
3. Find the angle between the left OP (from the perspective of the outside of the convext hull) to the midpoint to the IP.
   1. The left OP is not significant and is only used for consistency.
4. Multiply the values in step 2 and step 3. (These weights may need to be adjusted) 
   1. An IP that is collinear to the two OP that produce a midpoint are treated as being infinitely far away.
5. WHILE there are still unconnected IP:
   1. Find the IP(s) associated with the min value from step 4.
   2. Update OPs and IPs, with newly connected IPs becoming OPs. 
   2. IF the shortest distance is one or many midpoints connecting to one or multiple, **distinct** (not shared) IP:
      1. Connect the new IP(s) via the OP(s) that share the MP(s) that made contact.
      2. Repeat steps 1 through 4 for all newly created MPs.
   1. ELSE IF the shortest distance is one or many midpoints connecting multiple, **non-distinct** (shared) IP:
      1. Treat all such IP as tempory virtual connections.
      2. Have simultaneous recursions for each virtual connection occurring until one yields a distance.
      3. The winning virtual connection is kept and others are disregarded.
         1. Use information from virtual connection to save compuation time.
         2. In cases where IP are eliminated before a winning virtual connection is found, there are multiple shortest paths.


### Additional Notes:
The current version does not have a working version of the **non-distinct** cases. All other aspects of the algorithm are functioning as written, though it may still require tweeking, particularly the distance and angle weight part.

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
