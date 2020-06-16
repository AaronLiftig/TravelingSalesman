class LinkNodes: # Left and right are from perspective facing convex hull from outside
    def __init__(self,array,i,midDict):
        self.point = array[i]
        self.left = array[(i-1)%len(array)] # Clockwise
        self.right = array[(i+1)%len(array)] # Counterclockwise
        self.leftMidpoint = self.Midpoint(self.point,self.left)
        self.rightMidpoint = self.Midpoint(self.point,self.right)
        
        # update midpointDict
        # These lists are organized [left of midpoint,right of midpoint]
        if i == 0:
            midDict.update({self.leftMidpoint:[self.point]})
            midDict.update({self.rightMidpoint:[self.point]})
        elif i != len(array)-1:
            midDict[self.leftMidpoint].append(self.point)
            midDict.update({self.rightMidpoint:[self.point]})
        elif i == len(array)-1:
            midDict[self.leftMidpoint].append(self.point)
            midDict[self.rightMidpoint] = [self.point] + midDict[self.rightMidpoint]

    @staticmethod
    def Midpoint(point1,point2): # Midpoint Formula
        return ((point1[0]+point2[0])/2,(point1[1]+point2[1])/2)

class AddNode:
    def __init__(self,point,left,right,midDict):
        self.point = point
        self.left = left # Clockwise
        self.right = right # Counterclockwise
        self.leftMidpoint = self.Midpoint(self.point,self.left)
        self.rightMidpoint = self.Midpoint(self.point,self.right)

        # update midpointDict
        midDict[self.leftMidpoint] = [left,point]
        midDict[self.rightMidpoint] = [point,right]
        
        print("midpointDict:",midDict,"\n"*2)

    @staticmethod
    def Midpoint(point1,point2): # Midpoint Formula
        return ((point1[0]+point2[0])/2,(point1[1]+point2[1])/2)
