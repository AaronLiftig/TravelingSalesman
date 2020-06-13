from convex_hull import CreateConvexHull
from math import sqrt # Not needed
from add_node import AddNode
import time

# OP: Outer Points. IP: Inner Points.
class TravelingSalesmanMidpointAlgo:
    def __init__(self,pointNum,pointRange=15):
        self.convexHull = CreateConvexHull(pointNum,pointRange)
        print("linkedOP:",self.convexHull.linkedOP,"\n"*2)
        self.midpointsToIPs = {}
        self.midpointsToIPsRef = {}
        self.GetMidpointToIPs()

        begin = time.time()
        while len(self.convexHull.IP) != 0:
            self.GetMinOR()
            self.UpdateAll()
        end = time.time()
        print("Time:",end-begin,"\n"*2)

        self.PrintConnectedOP()

    @staticmethod
    def Distance(point1, point2): # Distance Formula (sqrt is technically not necessary for this problem)
        return sqrt((point1[0]-point2[0])**2+(point1[1]-point2[1])**2)  # sqrt not needed

    def GetMidpointToIPs(self): # Gets all distances from each Midpoint to IP
        print("midpointsToIPs:","\n")
        for OP in self.convexHull.linkedOP.items():
            self.AddToMidpointToIPs(OP[1],"right")
        print("\n")

    def AddToMidpointToIPs(self,OP1,directionString):
        tempDict = {}
        tempList = []
        for b in self.convexHull.IP:
            if directionString.lower() == "right":
                tempVal = self.Distance(OP1.rightMidpoint,b)
            elif directionString.lower() == "left":
                tempVal = self.Distance(OP1.leftMidpoint,b)
            else:
                print("string error")
                exit()
            tempDict.update({b:tempVal}) 
            tempList.append((b,tempVal)) # TODO May not need list because it won't be sorted
        
        tempList.sort(key=lambda tup: tup[1]) # TODO Don't sort. Find smallest instead, and put it in the front of every list whenever you pull out smallest. Keep track of whether smallest is deleted. If so, find smallest for that list. Put min at front of list (will require marker to know it is min).
        if directionString.lower() == "right":    
            print(OP1.rightMidpoint,":",tempList,"\n")
            self.midpointsToIPsRef.update({OP1.rightMidpoint:tempDict}) # Used as reference to delete from midpointsToIPs
            self.midpointsToIPs.update({OP1.rightMidpoint:tempList})
        elif directionString.lower() == "left":
            print(OP1.leftMidpoint,":",tempList,"\n")
            self.midpointsToIPsRef.update({OP1.leftMidpoint:tempDict}) # Used as reference to delete from midpointsToIPs
            self.midpointsToIPs.update({OP1.leftMidpoint:tempList})

    def GetMinOR(self): # Gets smallest outer radius (from OP to IP)
        min_value = float("inf")
        self.IPToMidDict = {}
        for k,v in self.midpointsToIPs.items():
            if v[0][1] == min_value:
                self.CheckForMultiOR(k,v,min_value)
            elif v[0][1] < min_value:
                min_value = v[0][1]
                self.MidToIPDict = {}
                self.IPToMidDict = {}
                self.CheckForMultiOR(k,v,min_value)
        
        print("MidToIPDict:",self.MidToIPDict,"\n")
        print("IPToMidDict:",self.IPToMidDict,"\n"*2)

    def CheckForMultiOR(self,key,val,min_value): # Checks if an OP connects to multiple IP
        self.UpdateMidToIPDict(key,val[0][0],val[0][1])
        self.UpdateConIP(val[0][0],key,val[0][1])
        for i in range(len(val)-1):
            if val[i+1][1] == min_value:
                self.UpdateMidToIPDict(key,val[i+1][0],val[i+1][1]) # Not currently used
                self.UpdateConIP(val[i+1][0],key,val[i+1][1])
            else:
                break

    def UpdateMidToIPDict(self,MP,IP,Dist): # Not currently used
        try:
            self.MidToIPDict[MP].append((IP,Dist))
        except KeyError:
            self.MidToIPDict.update({MP:[(IP,Dist)]})
    
    def UpdateConIP(self,IP,MP, Dist):
        try:
            self.IPToMidDict[IP].append((MP,Dist))
        except KeyError:
            self.IPToMidDict.update({IP:[(MP,Dist)]})

    def UpdateAll(self):   
        usedDict = {} # To stop IPToMidDict from using same midpoint again
        for NewIP,ListMP in self.IPToMidDict.items(): #TODO deal with multi-cases
            if len(ListMP)==1: # When an IP is only touched by one MP
                try:
                    usedDict[ListMP[0][0]]  # Checks if midpoint is in used dictionary
                    continue
                except:
                    usedDict.update({ListMP[0][0]:None})            
                ListIP = self.MidToIPDict[ListMP[0][0]]
                count = len(ListIP)
                for i in range(count):
                    IP = ListIP[i]
                    for p in self.convexHull.midpointDict.keys():
                        if p == ListMP[0][0]: # Is completely deleted directly after loop
                            continue
                        distRef = self.midpointsToIPsRef[p][IP[0]]
                        self.midpointsToIPs[p].remove((IP[0],distRef)) # Deletes new IP from midpointsToIPs
                        del self.midpointsToIPsRef[p][IP[0]] # Deletes new IP from midpointsToIPsRef
                    del self.midpointsToIPs[ListMP[0][0]]

                    self.ConnectNewIPs(ListMP[0][0],IP[0],i,count)
                    print("\n")
            else: # When multiple Midpoints touch the same IP
                print("multi-case requiring recursion")
                exit()

        print("IP:",len(self.convexHull.IP),"\n",self.convexHull.IP,"\n"*2)

    def ConnectNewIPs(self,k,v,i,count):
        # if i < count:
        #     tempOPsList = self.convexHull.midpointDict[k]
        # elif i == count:
        tempOPsList = self.convexHull.midpointDict.pop(k)
        
        leftOfMid = tempOPsList[0]
        rightOfMid = tempOPsList[1]

        newNode = AddNode(v,leftOfMid,rightOfMid,self.convexHull.midpointDict)

        # update linkedOP
        self.convexHull.linkedOP[leftOfMid].right = v
        self.convexHull.linkedOP[leftOfMid].rightMidpoint = newNode.leftMidpoint
        self.convexHull.linkedOP[rightOfMid].left = v
        self.convexHull.linkedOP[rightOfMid].leftMidpoint = newNode.rightMidpoint
        self.convexHull.linkedOP.update({v : newNode})

        print("linkedOP:",self.convexHull.linkedOP,"\n"*2)

        self.UpdateOP(v)
        self.UpdateIP(v)

        # update midpointsToIPs
        print("New midpointsToIPs:","\n")
        self.AddToMidpointToIPs(newNode,"right")
        self.AddToMidpointToIPs(newNode,"left")
        
    def UpdateOP(self,IP):
        self.convexHull.OP.append(IP) 

    def UpdateIP(self,IP):
        self.convexHull.IP.remove(IP) 

    def PrintConnectedOP(self):
        printList = []
        for i in range(len(self.convexHull.linkedOP)-1):
            if i == 0:
                printList.append(list(self.convexHull.linkedOP.items())[0][0])
                rightPoint = list(self.convexHull.linkedOP.items())[0][1].right
                printList.append(rightPoint)
            else:
                rightPoint = self.convexHull.linkedOP[rightPoint].right
                printList.append(rightPoint)
        print("Path:",printList)



TravelingSalesmanMidpointAlgo(15,15) 

# (Number of Points,Range of Points +/-) # Both integers

# Can also input a single list of (x,y) points with integer values instead of two seperate integers
