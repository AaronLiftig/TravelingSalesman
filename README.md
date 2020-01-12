# Alternative Traveling Salesman Algorithm
### (Still a work in progress)
  
## I was inspired by the innate optimization of nature. I imagined a cross-section of a bubble enveloping an object whose vertices make up the nodes of a traveling salesman graph. This technique is a modified greedy algorithm starting from all points on the convex hull, where one is, in some sense, trying to minimize the concavity of the convex hull.
   
## The primary differences between this and a typical greedy algorithm are that all boundary points of the convex hull are starting points, that progress of all radii stop until the smallest radius catches up (representing a kind of bubble surface tension), and that edges of the radii merge.

## The idea is similar to ideas found in the following links: https://www2.isye.gatech.edu/~mgoetsch/cali/VEHICLE/TSP/TSP017__.HTM; https://arxiv.org/abs/1303.4969
 
 ### Pseudocode:

1. Start with a convex hull whose points are OP and with the interior points, IP.<br /><br />
2. Find Euclidean distances between every pair of points.<br /><br />
3. The shortest distance for any OP to an IP is the current outer radius, \"OR\".<br /><br />
4. WHILE all IP are NOT connected by two edges,<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;a) IF the distance from that now connected IP, namely IP_1, is longer than any <br />
distance from IP_1 to another unconnected IP or another edge (as edges can <br />
connect to each other)<br />
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; i) THEN connect to that point AND repeat step 4,a.<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;b) ELSE, all newly connected IP_n become part of the OP set, AND CONTINUE to<br />
next smallest \"OR\" (including the connected IP_n).<br /><br />
&nbsp;&nbsp;&nbsp;&nbsp;c) Whenever inner edges from two OP, through any number of IP_n, connect, DELETE <br />
the edge between those OP (including IP_n that are now OP).
  
## Another visual analogy is to imagine a vacuum seal bag around an irregular buckyball. Take a cross section of that object where the center of mass is in the cross section. With this algorithm, I am attempting to represent the effect of sucking out the air from the center of mass of the buckyball.
 
## The significance of this, I believe, is that the edges can connect and that connections are made to the nearest connected nodes in ascending order (a kind of greedy algorithm from every point on the complex hull). With similar algorithms, I believe that either all edges are measured relative to the start or that they do not connect on the edge too.
    
# I believe that this algorithm doesn't work in many cases, but I am unsure which cases it does work for. The questions that I seek to answer are:
### What are the upper and lower bounds of its time complexity?<br /><br />What types of graphs does this algorithm work for? This is where my inspiration from natural physical optimization and the \"vacuum effect\" come from.<br /><br />Furthermore, does the \"vacuum effect\" represent some geometric center where if this effect occurs within the ultimate optimal path, then the algorithm may work?<br /><br />Finally, what is the probability that this \"center\" generally falls within the optimal path, and can a Monte Carlo simulation be used to answer this question?
