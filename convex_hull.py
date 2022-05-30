from scipy.spatial import ConvexHull
import numpy as np
from link_nodes import LinkNodes


class ConvexHull_:
    def __init__(self, number_of_points, range_of_points, point_list):
        all_points = self.get_points(number_of_points, range_of_points, point_list)
        self.separate_points(all_points)
        self.create_linked_list()
    
    def get_points(self, number_of_points, range_of_points, point_list):
        if (point_list is None and number_of_points is not None
                and range_of_points is not None):
            self.validate_point_inputs(number_of_points, range_of_points)
            print("number_of_points:",number_of_points)
            print("range_of_points:",range_of_points,"\n"*2)          
            all_points = self.get_random_points(number_of_points,
                                                range_of_points)         
        elif (isinstance(point_list,list) and number_of_points is None 
                and range_of_points is None 
                and (all(list(map(type,tup)) == [int,int] for tup in point_list)
                or all(list(map(type,tup)) == [float,float] for tup in point_list))):  
            all_points = list(set(point_list))   
        else:
            print("Either point_list must be a list of integers or number_of_points" 
                + " and range_of_points must be positive integers")
            exit()
        return all_points

    def validate_point_inputs(number_of_points, range_of_points):
        try:
            number_of_points = int(number_of_points)
            range_of_points = int(range_of_points)
            if number_of_points < 1 or range_of_points < 1:
                print("Both number_of_points and range_of_points" 
                    + " must be positive integers,")
                exit()
        except ValueError:
            print("Both number_of_points and range_of_points must" 
                + " be positive integers, or enter number_of_points" 
                + " as a list of (x,y) points with integer values")
            exit()

    def get_random_points(self,number_of_points,range_of_points):
        all_points = [] 

        for i in range(number_of_points):
            points = (float(np.random.randint(-range_of_points,
                                                range_of_points)),
                        float(np.random.randint(-range_of_points,
                                                range_of_points)))
            all_points.append(points)
        # creates list of random points

        all_points = list(set(all_points)) 
        #takes out possible duplicates
        return all_points

    def separate_points(self,all_points):    
        print("all_points:",all_points,"\n")
        
        self.OP = [all_points[i] for i in ConvexHull(all_points).vertices]
        print("OP:",self.OP,"\n") # Prints points of convex hull (OP)

        self.IP = [x for x in all_points if x not in self.OP]
        print("IP:",len(self.IP),"\n",self.IP,"\n"*2) 
        # Prints all inner points (not in OP)

    def create_linked_list(self):
        self.linked_OP = {}
        self.MP_to_OP_dictionary = {} # For referencing efficiency
        for i in range(len(self.OP)):
            self.linked_OP.update({self.OP[i]:LinkNodes(self.OP,i,
                                                    self.MP_to_OP_dictionary)})
        
        print("MP_to_OP_dictionary:",self.MP_to_OP_dictionary,"\n"*2)           