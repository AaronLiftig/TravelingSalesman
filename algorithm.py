from scipy.spatial import ConvexHull
import numpy as np
from math import sqrt
from itertools import combinations

allPoints = []

n=15 # number of points
N=10 # +/- range of points 

for i in range(n):
	points = (float(np.random.randint(-N,N)),float(np.random.randint(-N,N)))
	allPoints.append(points)
# creates list of random points

allPoints = list(set(allPoints)) #takes out possible duplicates

print("allPoints:",allPoints,"\n")

class TravelPoly:
  def __init__(self):
    self.OP = [allPoints[i] for i in ConvexHull(allPoints).vertices]
    print("OP:",self.OP,"\n")
    
    self.IP = [x for x in allPoints if x not in self.OP]
    print("IP:",self.IP,"\n"*2)

    self.currEdges = []
    self.outerDistsDict = {}
    self.innerDistsList = []

    self.touchedIP = []

    self.getCurrEdges()
    self.getOuterDistsDict()
    self.getInnerDistsList()

  def algorithm(self):
    '''
    TODO WHILE there are IP (inner points) not connected by two edges
    '''
    for i in range(10): #TODO replace FOR with WHILE loop 
      self.getMinOR()
      self.listIR = self.listOR
      
      self.getListIR(self.listOR)
      self.listIR.sort(key=lambda tup: tup[1][1])
      print("listIR:",self.listIR)
      
      self.getListIR(self.listIR)
      self.listIR.sort(key=lambda tup: tup[1][1])
      print("listIR:",self.listIR)

      iterList = self.listIR.copy()
      self.listIR = []
      self.upThroughIR(iterList) 
                
  @staticmethod
  def distance(point1, point2):
    return sqrt((point1[0]-point2[0])**2+(point1[1]-point2[1])**2)    
        
  def getCurrEdges(self):    
    for i in range(len(self.OP)):
      self.currEdges = [(self.OP[i],self.OP[(i+1)%len(self.OP)]) for i in range(len(self.OP))] 
    print("currEdges:",self.currEdges,"\n"*2)

  def getOuterDistsDict(self): 
    print("outerDistsDict:")
    for a in self.OP:
      temp = []
      for b in self.IP:
        temp.append((b,self.distance(a,b)))
      
      temp.sort(key=lambda tup: tup[1])
      print(a,":",temp,"\n")
      self.outerDistsDict.update({a:temp})
            
  def getInnerDistsList(self):
    print("\n""innerDistsList:")
    for a,b in combinations(self.IP,2):
      self.innerDistsList.append(((a,b),self.distance(a,b)))
    
    self.innerDistsList.sort(key=lambda tup: tup[1])
    print(self.innerDistsList)

  def getMinOR(self):
    self.listOR = [] 
    min_value = float("inf")
    for k,v in self.outerDistsDict.items():
      if v[0][1] == min_value:
        self.checkForMultiOR(k,v,min_value,self.listOR)
      elif v[0][1] < min_value:
        min_value = v[0][1]
        self.listOR = []
        self.checkForMultiOR(k,v,min_value,self.listOR)
        
    print("\n"*2,"listOR:",self.listOR)
    for key,val in self.listOR: # Removes minOR_list values from outerDistsDict dictionary
      self.outerDistsDict[key].remove(val)

  def checkForMultiOR(self,key,val,min_value,radiusList):
    radiusList.append((key,(val[0][0],val[0][1])))
    for i in range(len(val)-1):
      if val[i+1][1] == min_value:
        radiusList.append((key,(val[i+1][0],val[i+1][1])))
      else:
        break
      
  def checkForIR(self,radiusList):       
    temp = []
    for (i,j),k in self.innerDistsList:
      for a,(b,c) in radiusList:
        if k <= c:
          if b == j:
            if not temp:
              temp.append((b,(i,k)))
            elif k == temp[0][1][1]:
              temp.append((b,(i,k)))
            elif k < temp[0][1][1]:
              temp = []
              temp.append((b,(i,k)))
          elif b == i:
            if not temp:
              temp.append((b,(j,k)))
            elif k == temp[0][1][1]:
              temp.append((b,(j,k)))
            elif k < temp[0][1][1]:
              temp = []
              temp.append((b,(j,k)))
        else:
          return temp                  

  def getListIR(self,radiusList):
    temp = self.checkForIR(radiusList)
    self.listIR += temp  
    print("temp:",temp,"\n")
    for a,(b,c) in temp: # Removes temp values from innerDistsList dictionary
      try:
        self.innerDistsList.remove(((a,b),c))
      except:
        try:
          self.innerDistsList.remove(((b,a),c))
        except:          
          pass
    if temp:
      self.getListIR(temp)

  def upThroughIR(self,iterList):
    del iterList[0]
    if iterList:
      self.getListIR(iterList)
      iterList += self.listIR
      iterList.sort(key=lambda tup: tup[1][1])
      self.listIR = []
      print("iterList:",iterList)
      self.upThroughIR(iterList)   

  def updateOP(self,listName):
    #for a,(b,c) in listName:
    pass

  def getTouchedPoints(self):
    #for val in self.listIR:
    pass

  def updateEdges(self):
    #for val in self.listIR:
    pass

  def breakEdges(self):
    pass


TravelPoly().algorithm()
