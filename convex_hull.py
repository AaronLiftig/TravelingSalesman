from scipy.spatial import ConvexHull
import numpy as np
from link_nodes import LinkNodes


class CreateConvexHull:
    def __init__(self,pointNum,pointRange):
        try:
            pointNum = int(pointNum)
            pointRange = int(pointRange)
        except:
            print("Inputs must be integers.")
            exit()
        
        print("pointNum:",pointNum)
        print("pointRange:",pointRange,"\n"*2)
        
        self.CreatePoints(pointNum,pointRange)
        self.CreateLinkedList()
    
    def CreatePoints(self,pointNum,pointRange):    
        allPoints = [] 

        for i in range(pointNum):
            points = (float(np.random.randint(-pointRange,pointRange)),
                        float(np.random.randint(-pointRange,pointRange)))
            allPoints.append(points)
        # creates list of random points

        allPoints = list(set(allPoints)) #takes out possible duplicates

        print("allPoints:",allPoints,"\n")
        
        self.OP = [allPoints[i] for i in ConvexHull(allPoints).vertices]
        print("OP:",self.OP,"\n") # Prints points of convex hull (OP)

        self.IP = [x for x in allPoints if x not in self.OP]
        print("IP:",self.IP,"\n"*2) # Prints all inner points (not in OP)

    def CreateLinkedList(self):
        self.linkedOP = {}
        self.midpointDict = {} # For referencing efficency
        for i in range(len(self.OP)):
            self.linkedOP.update({self.OP[i] : LinkNodes(self.OP,i,self.midpointDict)})
        
        print("midpointDict:",self.midpointDict,"\n"*2)           
