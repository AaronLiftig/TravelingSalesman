from convex_hull import CreateConvexHull
from link_nodes import AddNode
import time
import numpy as np


class Node:
    def __init__(self,angleIP):
        self.point = angleIP
        self.left = None
        self.right = None

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
            self.Update_OP_IP()
            self.UpdateAllDicts()
        end = time.time()
        print("Time:",end-begin,"\n"*2)

        self.PrintConnectedOP()

    @staticmethod
    def Distance(point1, point2): # Distance Formula
        return ((point1[0]-point2[0])**2+(point1[1]-point2[1])**2)**.5 # Taking sqrt not needed

    @staticmethod
    def GetAngle(leftOP,rightOP,IP): # Find angle to order IP when one MP connects to multiple IP (Angle is from right OP's perspective)
        vector_1 = (leftOP[0]-rightOP[0],leftOP[1]-rightOP[1])
        vector_2 = (IP[0]-rightOP[0],IP[1]-rightOP[1])

        unitVector_1 = vector_1 / np.linalg.norm(vector_1)
        unitVector_2 = vector_2 / np.linalg.norm(vector_2)
        dot_product = np.dot(unitVector_1, unitVector_2)
        angle = np.arccos(dot_product)
        return angle
    
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
        
        tempList.sort(key=lambda tup: tup[1]) # TODO Don't sort. Always put min(s) at the front of lists
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
        self.MidToIPDict = {}
        self.IPToMidDict = {}
        self.SetIP = set()
        for k,v in self.midpointsToIPs.items():
            if v[0][1] == minVal:
                self.CheckForMultiOR(k,v,minVal)
            elif v[0][1] < minVal:
                minVal = v[0][1]
                self.MidToIPDict = {}
                self.IPToMidDict = {}
                self.SetIP = set()
                self.CheckForMultiOR(k,v,minVal)
        print("MidToIPDict:",self.MidToIPDict,"\n")
        print("IPToMidDict:",self.IPToMidDict,"\n"*2)

    def CheckForMultiOR(self,key,val,minVal): # Checks if an OP connects to multiple IP
        self.UpdateMidToIPDict(key,val[0][0],val[0][1])
        self.UpdateIPToMidDict(val[0][0],key,val[0][1])
        self.SetIP.add(val[0][0])
        for i in range(len(val)-1):
            if val[i+1][1] == minVal:
                self.UpdateMidToIPDict(key,val[i+1][0],val[i+1][1])
                self.UpdateIPToMidDict(val[i+1][0],key,val[i+1][1])
                self.SetIP.add(val[i+1][0])
            else:
                break

    def UpdateMidToIPDict(self,MP,IP,Dist):
        try:
            self.MidToIPDict[MP].append((IP,Dist))
        except KeyError:
            self.MidToIPDict.update({MP:[(IP,Dist)]})
    
    def UpdateIPToMidDict(self,IP,MP,Dist):
        try:
            self.IPToMidDict[IP].append((MP,Dist))
        except KeyError:
            self.IPToMidDict.update({IP:[(MP,Dist)]})

    def UpdateAllDicts(self):   
        usedDict = {} # Stops IPToMidDict (IP keys) from using same midpoint again
        for NewIP,ListMP in self.IPToMidDict.items():
            if len(ListMP)==1: # CASE: when an IP is only touched by one MP
                MP = ListMP[0][0]
                try:
                    usedDict[MP]  # Checks if midpoint is in used dictionary
                except:
                    usedDict.update({MP:None})
                else:
                    continue
                ListIP = self.MidToIPDict[MP]
                count = len(ListIP)
                tempOPsList = self.convexHull.midpointDict.pop(MP)
                leftOfMid = tempOPsList[0]
                rightOfMid = tempOPsList[1]
                if count == 1: # CASE: when the MP touches one IP
                    self.DeleteFromDicts(MP,ListIP[0][0])
                    self.ConnectNewIPs(ListIP[0][0],leftOfMid,rightOfMid)
                else: # CASE: when the MP touches multiple IP
                    tree = None
                    for i in range(count):
                        IP = ListIP[i]
                        angle = self.GetAngle(leftOfMid,rightOfMid,IP[0])
                        tree = self.InsertIntoOPsTree((IP[0],angle),leftOfMid,rightOfMid,i,tree)
                        self.DeleteFromDicts(MP,IP[0])
            else: # CASE: When multiple Midpoints touch the same IP
                print("multi-case requiring recursion")
                exit()

        print("IP:",len(self.convexHull.IP),"\n",self.convexHull.IP,"\n"*2)
            
    def InsertIntoOPsTree(self,angleIP,leftOP,rightOP,i,tree=None):
        if i == 0:
            self.ConnectNewIPs(angleIP[0],leftOP,rightOP)
            return Node(angleIP)
        elif tree.point[1] > angleIP[1]:
            if tree.left is not None:
                tree.left = self.InsertIntoOPsTree(angleIP,leftOP,tree.point[0],i,tree.left)
            else:
                tree.left == self.InsertIntoOPsTree(angleIP,leftOP,tree.point[0],0,tree.left)
        elif tree.point[1] < angleIP[1]:
            if tree.right is not None:
                tree.right = self.InsertIntoOPsTree(angleIP,tree.point[0],rightOP,i,tree.right)
            else:
                tree.right == self.InsertIntoOPsTree(angleIP,tree.point[0],rightOP,0,tree.right)
    
    def DeleteFromDicts(self,MP,IP): #TODO Find better way to prevent exceptions
        for p in self.convexHull.midpointDict.keys():
            if p == MP: # Is completely deleted directly after loop
                continue
            try: 
                distRef = self.midpointsToIPsRef[p][IP]
            except:
                continue
            self.midpointsToIPs[p].remove((IP,distRef)) # Deletes new IP from midpointsToIPs
            del self.midpointsToIPsRef[p][IP] # Deletes new IP from midpointsToIPsRef
        try:
            del self.midpointsToIPs[MP] # Deletes entire midpoint case
        except:
            pass

    def ConnectNewIPs(self,IP,leftOfMid,rightOfMid):
        newNode = AddNode(IP,leftOfMid,rightOfMid,self.convexHull.midpointDict)

        # update linkedOP
        self.convexHull.linkedOP[leftOfMid].right = IP
        self.convexHull.linkedOP[leftOfMid].rightMidpoint = newNode.leftMidpoint
        self.convexHull.linkedOP[rightOfMid].left = IP
        self.convexHull.linkedOP[rightOfMid].leftMidpoint = newNode.rightMidpoint
        self.convexHull.linkedOP.update({IP:newNode})

        print("linkedOP:",self.convexHull.linkedOP,"\n"*2)

        # update midpointsToIPs
        print("New midpointsToIPs:","\n")
        self.AddToMidpointToIPs(newNode,"right")
        self.AddToMidpointToIPs(newNode,"left")
        print("\n")
        
    def Update_OP_IP(self):
        for IP in self.SetIP:
            self.convexHull.OP.append(IP) 
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


TravelingSalesmanMidpointAlgo(30,15) 

# (Number of Points,Range of Points +/-) # Both integers

# Can also input a single list of (x,y) points with integer values instead of two seperate integers
