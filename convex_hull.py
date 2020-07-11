from scipy.spatial import ConvexHull
import numpy as np
from link_nodes import LinkNodes


class CreateConvexHull:
    def __init__(self,pointNum,pointRange,isConvexHull):
        if isConvexHull == False:
            if isinstance(pointNum,list) \
               and all(list(map(type,tup)) == [int,int] for tup in pointNum):
               
                allPoints = pointNum
            else:
                try:
                    pointNum = int(pointNum)
                    pointRange = int(pointRange)
                except:
                    print("Both pointNum and pointRange must be integers,"
                          " or enter pointNum as a list of (x,y) points with integer values")
                    exit()
                
                print("pointNum:",pointNum)
                print("pointRange:",pointRange,"\n"*2)
                    
                allPoints = self.GetRandomPoints(pointNum,pointRange)
            self.SeparatePoints(allPoints)
        else:
            if isinstance(pointNum,list) and isinstance(pointRange,list)\
               and all(list(map(type,tup)) == [float,float] for tup in pointNum) \
               and all(list(map(type,tup)) == [float,float] for tup in pointRange):
                
                self.OP = pointNum
                self.IP = pointRange
            else:
                print("If isConvexHull equals True, both pointNum and pointRange must be lists."
                      " Specifically, pointNum should contain the points of the convex hull in counterclockwise order,"
                      " and pointRange should be the interior points not part of the convex hull.")
                exit()
            
        self.CreateLinkedList()
    
    def GetRandomPoints(self,pointNum,pointRange):
        allPoints = [] 

        for i in range(pointNum):
            points = (float(np.random.randint(-pointRange,pointRange)),
                        float(np.random.randint(-pointRange,pointRange)))
            allPoints.append(points)
        # creates list of random points

        allPoints = list(set(allPoints)) #takes out possible duplicates
        return allPoints

    def SeparatePoints(self,allPoints):    
        print("allPoints:",allPoints,"\n")
        
        self.OP = [allPoints[i] for i in ConvexHull(allPoints).vertices]
        print("OP:",self.OP,"\n") # Prints points of convex hull (OP)

        self.IP = [x for x in allPoints if x not in self.OP]
        print("IP:",len(self.IP),"\n",self.IP,"\n"*2) # Prints all inner points (not in OP)

    def CreateLinkedList(self):
        self.linkedOP = {}
        self.midpointDict = {} # For referencing efficency
        for i in range(len(self.OP)):
            self.linkedOP.update({self.OP[i] : LinkNodes(self.OP,i,self.midpointDict)})
        
        print("midpointDict:",self.midpointDict,"\n"*2)           
