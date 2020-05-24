from convex_hull import CreateConvexHull
from math import sqrt
from add_node import AddNode

# OP: Outer Points. IP: Inner Points.
class TravelingSalesmanMidpointAlgo:
    def __init__(self,pointNum: int,pointRange: int):
        self.convexHull = CreateConvexHull(pointNum,pointRange)
        print("linkedOP:",self.convexHull.linkedOP,"\n"*2)
        self.midpointsToIPs = {}
        self.midpointsToIPsRef = {}
        self.GetMidpointToIPs()

        self.GetMinOR()
        self.UpdateAll()
        self.ConnectNewIPs()

    @staticmethod
    def Distance(point1, point2): # Distance Formula
        return sqrt((point1[0]-point2[0])**2+(point1[1]-point2[1])**2)

    def GetMidpointToIPs(self): # Gets all distances from each Midpoint to IP
        print("midpointsToIPs:","\n")
        for OP in self.convexHull.linkedOP.items():
            self.AddToMidpointToIPs(OP,"right")
        print("\n")

    def AddToMidpointToIPs(self,OP,directionString):
        tempDict = {}
        tempList = []
        for b in self.convexHull.IP:
            if directionString.lower() == "right":
                tempVal = self.Distance(OP[1].rightMidpoint,b)
            elif directionString.lower() == "left":
                tempVal = self.Distance(OP[1].leftMidpoint,b)
            else:
                print("string error")
                exit()
            tempDict.update({b:tempVal}) 
            tempList.append((b,tempVal)) # TODO May not need list because it won't be sorted
        
        tempList.sort(key=lambda tup: tup[1]) # TODO Don't sort. Find smallest instead, and put it in the front of every list whenever you pull out smallest. Keep track of whether smallest is deleted. If so, find smallest for that list.
        if directionString.lower() == "right":    
            print(OP[1].rightMidpoint,":",tempList,"\n")
            self.midpointsToIPsRef.update({OP[1].rightMidpoint:tempDict}) # Used as reference to delete from midpointsToIPs
            self.midpointsToIPs.update({OP[1].rightMidpoint:tempList})
        elif directionString.lower() == "left":
            print(OP[1].leftMidpoint,":",tempList,"\n")
            self.midpointsToIPsRef.update({OP[1].leftMidpoint:tempDict}) # Used as reference to delete from midpointsToIPs
            self.midpointsToIPs.update({OP[1].leftMidpoint:tempList})

    def GetMinOR(self): # Gets smallest outer radius (from OP to IP)
        min_value = float("inf")
        for k,v in self.midpointsToIPs.items():
            if v[0][1] == min_value:
                self.checkForMultiOR(k,v,min_value)
            elif v[0][1] < min_value:
                min_value = v[0][1]
                self.listOR = []
                self.newConnectedIP = set()
                self.CheckForMultiOR(k,v,min_value)
        
        print("listOR:",self.listOR,"\n"*2)
        
    def CheckForMultiOR(self,key,val,min_value): # Checks if an OP connects to multiple IP
        self.listOR.append((key,(val[0][0],val[0][1])))
        self.newConnectedIP.add(val[0][0])
        for i in range(len(val)-1):
            if val[i+1][1] == min_value:
                self.listOR.append((key,(val[i+1][0],val[i+1][1])))
                self.newConnectedIP.add(val[i+1][0])
            else:
                break

    def UpdateAll(self):   
        if len(self.listOR) == 1:
        # len(self.listOR) == len(self.newConnectedIP): # includes (len(self.listOR) == 1) case
            self.updateIP()
            self.updateOP()
            for p in self.convexHull.midpointDict.keys():
                newIP = self.listOR[0][1][0]
                distRef = self.midpointsToIPsRef[p][newIP]
                self.midpointsToIPs[p].remove((newIP,distRef))    
        elif (len(self.listOR) != 1) & (len(self.newConnectedIP) == 1): # TODO Fix multi-case
            print("Multi-case")
            exit()
        else: # TODO Fix multi-case
            print("Multi-case")
            exit() 

        print("IP:",self.convexHull.IP,"\n"*2)
        # for key,val in self.listOR: # Removes minOR_list values from midpointToIPs dictionary
            # self.midpointsToIPs[key].remove(val)

    def ConnectNewIPs(self):
        for k,v in self.listOR:
            tempOPsList = self.convexHull.midpointDict.pop(k)
            
            leftOfMidpoint = tempOPsList[0]
            rightOfMidpoint = tempOPsList[1]

            newNode = AddNode(v[0],leftOfMidpoint,rightOfMidpoint,self.convexHull.midpointDict)

            # update linkedOP
            self.convexHull.linkedOP[leftOfMidpoint].right = v[0]
            self.convexHull.linkedOP[leftOfMidpoint].rightMidpoint = newNode.leftMidpoint
            self.convexHull.linkedOP[rightOfMidpoint].left = v[0]
            self.convexHull.linkedOP[rightOfMidpoint].leftMidpoint = newNode.rightMidpoint
            self.convexHull.linkedOP.update({v[0] : newNode})

            print("linkedOP:",self.convexHull.linkedOP,"\n"*2)

            # update midpointsToIPs
            # "dummy" string is just to make the input fit the proper data format
            print("New midpointsToIPs:","\n")
            self.AddToMidpointToIPs(["dummy",newNode],"right")
            self.AddToMidpointToIPs(["dummy",newNode],"left")
            
            # update midpointsToIPsRef
            
        print("\n")
        
    def updateOP(self):
        self.convexHull.OP.append(self.listOR[0][1][0]) # TODO Make dynamic for various listOP cases

    def updateIP(self):
        self.convexHull.IP.remove(self.listOR[0][1][0]) # TODO Make dynamic for various listOP cases
                    

TravelingSalesmanMidpointAlgo(15,15)
