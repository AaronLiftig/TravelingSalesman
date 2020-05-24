# TravelingSalesman
## An alternative traveling salesman algorithm using the midpoints of the convex hull.

### I was inspired by the innate optimization of nature. I imagined a cross-section of a bubble enveloping an object whose vertices make up the nodes of a traveling salesman graph. This technique is a modified greedy algorithm starting from all midpoints on the verticies of the convex hull, where one is, in some sense, trying to minimize the concavity of the convex hull.

#### Another visual analogy is to imagine a vacuum seal bag around an irregular buckyball. Take a cross section of that object where the center of mass is in the cross section. With this algorithm, I am attempting to represent the effect of sucking out the air from the center of mass of the buckyball.
   
### The primary differences between this and a typical greedy algorithm are that all midpoints of the convex hull are starting points.

### The idea is similar to ideas found in the following links:
#### https://www2.isye.gatech.edu/~mgoetsch/cali/VEHICLE/TSP/TSP017__.HTM; 
#### https://arxiv.org/abs/1303.4969;
#### https://www.researchgate.net/publication/257201541_Alpha_Convex_Hull_a_Generalization_of_Convex_Hull
 
### Pseudocode:

1. Get all midpoints between connected OP (adjacent vertices on the convex hull).<br /><br />
2. Find all Euclidean distances between those midpoints and all interior points.<br /><br />
3. WHILE there are still unconnected IP (inner points):<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;a) Find the shortest distance between any existing midpoint and an IP.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;b1) IF the shortest distance is one or many midpoints connecting to one or multiple, **distinct** IP:<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;i) Connect the new IP(s) via the OP(s) that share the midpoint(s) that made contact.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ii) Calculate new midpoints that were created with inclusion of the new IP(s).<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iii) Update current OP and IP.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iv) Calculate all Euclidean distances from new midpoints to updated IP.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;b2) ELSE IF the shortest distance is one or many midpoints connecting multiple, **non-distinct** IP:<br /><br />
(**Current idea**)<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;i) Treat all such IP as tempory virtual connections.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ii) Continue through WHILE loop until first new IP is reached by any connecting IP in question.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iii) That series of connections becomes permanent<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;iv) Other temporary virtual connections are disregarded and recalculated.<br /><br />


## The questions that I seek to answer are:
### What are the upper and lower bounds (or best and worst cases) of its time complexity?<br /><br />What types of graphs does this algorithm work for? This is where my inspiration from natural physical optimization and the \"vacuum effect\" come from.<br /><br />Furthermore, does the \"vacuum effect\" represent some geometric center where if this effect occurs within the ultimate optimal path, then the algorithm may work?<br /><br />What is the probability that this \"center\" generally falls within the optimal path, and can a Monte Carlo simulation be used to answer this question?<br /><br />
### Additionally, does the additional step of calculating the Euclidean distances from the midpoints to the interior points constitute an additional step since the typical Euclidean distances initially provided are not needed?<br /><br />Also, is there a better point on each edge of the convex hull to use part from midpoint? (e.g. the point having the short perpendicular distance to any unconnected interior points)? 
