from convex_hull import CreateConvexHull
from link_nodes import AddNode
import time
import numpy as np
import math

# OP: Outer Points. IP: Inner Points.
class TravelingSalesmanMidpointAlgo:
    def __init__(self,pointNum,pointRange=15,isPointNumConvexHull=False):
        self.convexHull = CreateConvexHull(pointNum,pointRange,isPointNumConvexHull)
        print('linkedOP:',self.convexHull.linkedOP,'\n'*2)
        self.midpointsToIPs = {}
        self.midpointsToIPsRef = {}
        self.GetMidpointToIPs()

        begin = time.time()
        while len(self.convexHull.IP) != 0:
            self.GetClosestIPs()
            self.UpdatePointsLists()
            self.UpdateAllDicts()
        end = time.time()
        print('Time:',end-begin,'\n'*2)

        self.PrintConnectedOP()
    
    def GetMidpointToIPs(self): # Gets all distances from each Midpoint to IP
        print('midpointsToIPs:','\n')
        for OP in self.convexHull.linkedOP.items():
            self.AddToMidpointToIPs(OP[1],'right')
        print('\n')

    def AddToMidpointToIPs(self,OP,directionString):
        tempDict = {}
        tempList = []
        for IP in self.convexHull.IP:
            if directionString.lower() == 'right':
                OPs = self.convexHull.midpointDict[OP.rightMidpoint]
                leftOP,rightOP = OPs[0],OPs[1]
                angle = self.GetAngle(leftOP,OP.rightMidpoint,IP)
            elif directionString.lower() == 'left':
                OPs = self.convexHull.midpointDict[OP.leftMidpoint]
                leftOP,rightOP = OPs[0],OPs[1]
                angle = self.GetAngle(leftOP,OP.leftMidpoint,IP)

            # Divides shortest distance between OPs line and IP by the angle created by the leftOP--midpoint--IP
            # May need to be a multiple of the angle or some other variation
            try:
                tempVal = round(self.ShortestDistance(leftOP,rightOP,IP) / np.sin(angle),10)
            except ZeroDivisionError:    
                tempVal = math.inf # inf if IP is collinear to OPs

            tempDict.update({IP:tempVal}) 
            tempList.append((IP,tempVal)) # TODO May not need list because it won't be sorted
        
        tempList.sort(key=lambda tup: tup[1]) # TODO Don't sort. Always put min(s) at the front of lists
        if directionString.lower() == 'right':    
            print(OP.rightMidpoint,':',tempList,'\n')
            self.midpointsToIPsRef.update({OP.rightMidpoint:tempDict}) # Used as reference to delete from midpointsToIPs
            self.midpointsToIPs.update({OP.rightMidpoint:tempList})
        elif directionString.lower() == 'left':
            print(OP.leftMidpoint,':',tempList,'\n')
            self.midpointsToIPsRef.update({OP.leftMidpoint:tempDict}) # Used as reference to delete from midpointsToIPs
            self.midpointsToIPs.update({OP.leftMidpoint:tempList})
    
    @staticmethod
    def ShortestDistance(leftOP,rightOP,IP):
        # Create line in the form ax + by + c = 0
        a = rightOP[1] - leftOP[1] 
        b = leftOP[0] - rightOP[0]  
        c = - (a * (leftOP[0]) + b * (leftOP[1]))
        # Finds shortest distance between IP and line created by OPs
        return abs((a * IP[0] + b * IP[1] + c)) / (a**2 + b**2)**.5

    @staticmethod
    def GetAngle(leftOP,midpoint,IP): # Find angle to order IP when one MP connects to multiple IP (Angle is from midpoint's perspective)
        vector1 = (leftOP[0] - midpoint[0],leftOP[1] - midpoint[1])
        vector2 = (IP[0] - midpoint[0],IP[1] - midpoint[1])

        dotProduct = np.dot(vector1, vector2) 
        normsProduct = (np.linalg.norm(vector1)*np.linalg.norm(vector2))
        return np.arccos(dotProduct/normsProduct)

    def GetClosestIPs(self): # Gets smallest outer radius (from OP to IP)
        minVal = float('inf')
        self.MidToIPDict = {}
        self.IPToMidDict = {}
        self.SetIP = set()
        for k,v in self.midpointsToIPs.items():
            if v[0][1] == minVal:
                self.CheckForMultiConnectionCase(k,v,minVal)
            elif v[0][1] < minVal:
                minVal = v[0][1]
                self.MidToIPDict = {}
                self.IPToMidDict = {}
                self.SetIP = set()
                self.CheckForMultiConnectionCase(k,v,minVal)
        print('MidToIPDict:',self.MidToIPDict,'\n')
        print('IPToMidDict:',self.IPToMidDict,'\n'*2)

    def CheckForMultiConnectionCase(self,key,val,minVal): # Checks if an OP connects to multiple IP
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

    def UpdatePointsLists(self):
        for IP in self.SetIP:
            self.convexHull.OP.append(IP) 
            self.convexHull.IP.remove(IP) 
    
    def UpdateAllDicts(self):   
        usedDict = {} # Stops IPToMidDict (IP keys) from using same midpoint again
        recursiveCase = []
        for newIP,listMP in self.IPToMidDict.items():
            if len(listMP)==1: # CASE1: when an IP is only touched by one MP
                MP = listMP[0][0]
                try:
                    usedDict[MP]  # Checks if midpoint is in used dictionary
                except:
                    usedDict.update({MP:None})
                else:
                    continue
                listIP = self.MidToIPDict[MP]
                count = len(listIP)
                tempOPsList = self.convexHull.midpointDict.pop(MP)
                leftOfMid = tempOPsList[0]
                rightOfMid = tempOPsList[1]
                if count == 1: # CASE1a: when the MP touches one IP
                    self.ConnectNewIPs(listIP[0][0],leftOfMid,rightOfMid)
                    self.DeleteFromDicts(MP,listIP[0][0])
                else: # CASE1b: when the MP touches multiple IP
                    tree = None
                    for i in range(count):
                        IP = listIP[i]
                        angle = self.GetAngle(leftOfMid,MP,IP[0])
                        tree = self.InsertIntoOPsTree((IP[0],angle),leftOfMid,rightOfMid,i,tree)
                        self.DeleteFromDicts(MP,IP[0])
            else: # CASE2: When multiple Midpoints touch the same IP
                recursiveCase.append((newIP,listMP)) # Resolves CASE2s after all CASE1s
        
        if len(recursiveCase) > 0: # Resolving CASE2s
            print('multi-case requiring recursion')
            for newIP,listMP in recursiveCase:
                for MP in listMP:
                    exit()
                    pass

        print('IP:',len(self.convexHull.IP),'\n',self.convexHull.IP,'\n'*2)
        
    def InsertIntoOPsTree(self,angleIP,leftOP,rightOP,i,tree=None): #TODO Make into AVL tree
    # Uses binary tree to insert into linkedOP
        if i == 0:
            self.ConnectNewIPs(angleIP[0],leftOP,rightOP)
            return TreeNode(angleIP)
        elif tree.point[1] > angleIP[1]:
            if tree.left is not None:
                tree.left = self.InsertIntoOPsTree(angleIP,leftOP,tree.point[0],i,tree.left)
            else:
                tree.left = self.InsertIntoOPsTree(angleIP,leftOP,tree.point[0],0)
        elif tree.point[1] < angleIP[1]:
            if tree.right is not None:
                tree.right = self.InsertIntoOPsTree(angleIP,tree.point[0],rightOP,i,tree.right)
            else:
                tree.right = self.InsertIntoOPsTree(angleIP,tree.point[0],rightOP,0)
    
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

        print('linkedOP:',self.convexHull.linkedOP,'\n'*2)

        # update midpointsToIPs
        print('New midpointsToIPs:','\n')
        self.AddToMidpointToIPs(newNode,'right')
        self.AddToMidpointToIPs(newNode,'left')
        print('\n')
        
    def MultiCase(self):
        pass
    
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
        print('Path:',printList)

class TreeNode:
    def __init__(self,angleIP):
        self.point = angleIP
        self.left = None
        self.right = None


# TravelingSalesmanMidpointAlgo(15,15)

# Simple test case:
# TravelingSalesmanMidpointAlgo([(-2,2),(2,2),(-2,-10),(2,-10),(-1,1),(1,1)]) 

# Simple recursive case
TravelingSalesmanMidpointAlgo([(-2.0, -15.0),(10.0, -13.0),(8.0, -4.0),(-6.0, 7.0),(-14.0, 12.0),(-14.0, 7.0),(-14.0, -4.0),(-6.0,-15.0)],
                              [(0.0, 1.0),(-5.0, 2.0),(-4.0, 0.0),(-6.0, 4.0),(-4.0, -6.0),(-2.0, -13.0)],
                              True) 

# (Number of Points,Range of Points +/-) # Both integers

# Can also input a single list of (x,y) points with integer values instead of two seperate integers
