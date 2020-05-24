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
