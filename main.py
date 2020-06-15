from convex_hull import CreateConvexHull
from add_node import AddNode
import time
import numpy as np

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
    def Distance(point1, point2): # Distance Formula
        return ((point1[0]-point2[0])**2+(point1[1]-point2[1])**2)**.5 # Taking sqrt not needed

    @staticmethod
    def GetAngle(leftOP,rightOP,IP): # Find angle to order IP when one MP connects to multiple IP
        vector_1 = (leftOP[0]-rightOP[0],leftOP[1]-rightOP[1])
        vector_2 = (IP[0]-rightOP[0],IP[1]-rightOP[1])

        unitVector_1 = vector_1 / np.linalg.norm(vector_1)
        unitVector_2 = vector_2 / np.linalg.norm(vector_2)
        dot_product = np.dot(unitVector_1, unitVector_2)
        angle = np.arccos(dot_product)
        return angle #TODO fix return
    
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
        minVal = float("inf")
        self.IPToMidDict = {}
        for k,v in self.midpointsToIPs.items():
            if v[0][1] == minVal:
                self.CheckForMultiOR(k,v,minVal)
            elif v[0][1] < minVal:
                minVal = v[0][1]
                self.MidToIPDict = {}
                self.IPToMidDict = {}
                self.CheckForMultiOR(k,v,minVal)
        
        print("MidToIPDict:",self.MidToIPDict,"\n")
        print("IPToMidDict:",self.IPToMidDict,"\n"*2)

    def CheckForMultiOR(self,key,val,minVal): # Checks if an OP connects to multiple IP
        self.UpdateMidToIPDict(key,val[0][0],val[0][1])
        self.UpdateIPToMidDict(val[0][0],key,val[0][1])
        for i in range(len(val)-1):
            if val[i+1][1] == minVal:
                self.UpdateMidToIPDict(key,val[i+1][0],val[i+1][1]) # Not currently used
                self.UpdateIPToMidDict(val[i+1][0],key,val[i+1][1])
            else:
                break

    def UpdateMidToIPDict(self,MP,IP,Dist): # Not currently used
        try:
            self.MidToIPDict[MP].append((IP,Dist))
        except KeyError:
            self.MidToIPDict.update({MP:[(IP,Dist)]})
    
    def UpdateIPToMidDict(self,IP,MP, Dist):
        try:
            self.IPToMidDict[IP].append((MP,Dist))
        except KeyError:
            self.IPToMidDict.update({IP:[(MP,Dist)]})

    def UpdateAll(self):   
        usedDict = {} # To stop IPToMidDict from using same midpoint again
        for NewIP,ListMP in self.IPToMidDict.items():
            if len(ListMP)==1: # When an IP is only touched by one MP
                try:
                    usedDict[ListMP[0][0]]  # Checks if midpoint is in used dictionary
                    continue
                except:
                    usedDict.update({ListMP[0][0]:None})
                ListIP = self.MidToIPDict[ListMP[0][0]]
                count = len(ListIP)
                if count == 1:
                    self.UpdateDicts(ListMP[0][0],ListIP[0][0])
                    self.ConnectNewIPs(ListMP[0][0],ListIP[0][0])
                else: #TODO Use tree to insert IP instead of creating IP angle list
                    tree = None
                    self.angleList = []
                    for i in range(count):
                        IP = ListIP[i]
                        leftRightOP = self.convexHull.midpointDict[ListMP[0][0]]
                        angle = self.GetAngle(leftRightOP[0],leftRightOP[1],IP[0])
                        tree = self.AngleBinaryTree((IP[0],IP[1],angle),i,tree)
                        self.CreateAngleListFromTree(tree)
                        print(self.angleList)
                        self.UpdateDicts(ListMP[0][0],IP[0])
                        self.ConnectNewIPs(ListMP[0][0],IP[0],i,count)
            else: # When multiple Midpoints touch the same IP
                print("multi-case requiring recursion")
                exit()

        print("IP:",len(self.convexHull.IP),"\n",self.convexHull.IP,"\n"*2)

    def AngleBinaryTree(self,angleIP,i,tree=None):
        if i == 0:
            self.point = angleIP
            self.left = None
            self.right = None
        elif tree.point[2] > angleIP[2]:
            if tree.left is not None:
                tree.left = self.AngleBinaryTree(angleIP,i,tree.left)
            else:
                tree.left == self.AngleBinaryTree(angleIP,0)
        elif tree.point[2] < angleIP[2]:
            if tree.right is not None:
                tree.right = self.AngleBinaryTree(angleIP,i,tree.right)
            else:
                tree.right == self.AngleBinaryTree(angleIP,0)
    
    def CreateAngleListFromTree(self,tree):
        if tree:
            self.CreateAngleListFromTree(tree.left)
            self.angleList.append(tree.point)
            self.CreateAngleListFromTree(tree.right)
            
    def UpdateDicts(self,MP,IP):
        for p in self.convexHull.midpointDict.keys():
            if p == MP: # Is completely deleted directly after loop
                continue
            distRef = self.midpointsToIPsRef[p][IP]
            self.midpointsToIPs[p].remove((IP,distRef)) # Deletes new IP from midpointsToIPs
            del self.midpointsToIPsRef[p][IP] # Deletes new IP from midpointsToIPsRef
        del self.midpointsToIPs[MP] # Deletes entire midpoint case

    def ConnectNewIPs(self,k,v,i=None,count=None):
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
        print("\n")
        
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


TravelingSalesmanMidpointAlgo(50,15) 

# (Number of Points,Range of Points +/-) # Both integers

# Can also input a single list of (x,y) points with integer values instead of two seperate integers
