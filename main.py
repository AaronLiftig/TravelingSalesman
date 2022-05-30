from convex_hull import ConvexHull_
from link_nodes import AddNode
from recursive_case import RecursiveCase
import time
import numpy as np
import math

class TreeNode:
    def __init__(self,angle_IP):
        self.point = angle_IP
        self.left = None
        self.right = None

# OP: Outer Point(s). IP: Inner Point(s). MP: Midpoint(s)
class TravelingSalesmanSolution:
    def __init__(self, number_of_points=None, range_of_points=None,
                point_list=None, _parent_object=None, metric=2):
        
        self.validate_metric(metric)

        if _parent_object is None:
            self.run_non_recursive_case(number_of_points, range_of_points, 
                                        point_list)
        else:
            self.run_recursive_case(_parent_object)
        
    def validate_metric(self, metric):
        if metric not in (1,2):
            print("Currently only two metric options exist."
                    + " Please choose 1 or 2.")
            exit()
        else:
            self.metric = metric

    @staticmethod
    def get_convex_hull(number_of_points, range_of_points, point_list):
        return ConvexHull_(number_of_points, range_of_points, point_list)

    def connect_IP(self):
        while len(self.convex_hull.IP) != 0:
            self.get_closest_IPs()
            self.update_points_lists()
            self.update_all_dictionaries()

    def run_non_recursive_case(self, number_of_points, range_of_points, 
                                point_list):
        self.convex_hull = self.get_convex_hull(number_of_points,
                                                range_of_points,
                                                point_list)

        print('linked_OP:',self.convex_hull.linked_OP,'\n'*2)
        
        self.MP_to_IP_distances = {}
        self.MP_to_IP_distances_reference = {}
        self.get_MP_to_IP_distances()

        begin = time.time()
        self.connect_IP()
        end = time.time()
        
        print('Time:',end - begin,'\n'*2)
        self.print_connected_OP()

    def run_recursive_case(self, _parent_object):
        self.convex_hull = _parent_object.convex_hull
            # _parent_object.get_closest_IPs()
            # _parent_object.update_points_lists()
            # _parent_object.update_all_dictionaries()

    def get_MP_to_IP_distances(self): 
    # Gets all distances from each Midpoint to IP
        print('MP_to_IP_distances:\n')
        for OP in self.convex_hull.linked_OP.items():
            self.add_to_MP_to_IP_distances(OP[1],'right')
        print()

    def add_to_MP_to_IP_distances(self,OP,direction_string):
        temp_dictionary = {}
        temp_list = []
        for IP in self.convex_hull.IP:
            if direction_string.lower() == 'right':
                OPs = self.convex_hull.MP_to_OP_dictionary[OP.right_MP]
                left_OP,right_OP = OPs[0],OPs[1]
                angle = self.get_angle(left_OP,OP.right_MP,IP)
            elif direction_string.lower() == 'left':
                OPs = self.convex_hull.MP_to_OP_dictionary[OP.left_MP]
                left_OP,right_OP = OPs[0],OPs[1]
                angle = self.get_angle(left_OP,OP.left_MP,IP)

            # Divides shortest distance between OPs line and IP 
            # by the angle created by the left_OP--MP--IP
            distance_value = self.metric_function(left_OP,right_OP,
                                                IP,angle,self.metric)

            temp_dictionary.update({IP:distance_value}) 
            temp_list.append((IP,distance_value)) 
            # TODO May not need list because it won't be sorted
        
        temp_list.sort(key = lambda tup: tup[1])
        # TODO Don't sort. Always put min(s) at the front of lists
        if direction_string.lower() == 'right':    
            print(OP.right_MP,':',temp_list,'\n')
            self.MP_to_IP_distances_reference.update({OP.right_MP:temp_dictionary}) 
            # Used as reference to delete from MP_to_IP_distances
            self.MP_to_IP_distances.update({OP.right_MP:temp_list})
        elif direction_string.lower() == 'left':
            print(OP.left_MP,':',temp_list,'\n')
            self.MP_to_IP_distances_reference.update({OP.left_MP:temp_dictionary}) 
            # Used as reference to delete from MP_to_IP_distances
            self.MP_to_IP_distances.update({OP.left_MP:temp_list})

    def metric_function(self,left_OP,right_OP,IP,angle,metric):
        if metric == 1:
        # May need to be a multiple of the angle or some other variation
            try:
                distance_value = round(
                                self.get_distance(IP,left_OP,right_OP)
                                    / np.sin(angle),10
                                )
            except ZeroDivisionError:    
                distance_value = math.inf 
                # inf if IP is collinear to OPs  
        elif metric == 2: #TODO Get MP from data instead of calculation
            distance_value = self.get_distance(IP,MP=self.get_MP(left_OP,
                                                                right_OP),
                                                metric=2)
        return distance_value

    @staticmethod
    def get_distance(IP,left_OP=None,right_OP=None,MP=None,metric=1):
    # Create line in the form ax + by + c = 0
        if metric == 1:
        # Finds shortest distance between IP and line created by OPs
            a = right_OP[1] - left_OP[1] 
            b = left_OP[0] - right_OP[0]  
            c = - (a * (left_OP[0]) + b * (left_OP[1]))
            return abs((a * IP[0] + b * IP[1] + c)) / (a**2 + b**2)**.5
        elif metric == 2:
            a = IP[1] - MP[1]
            b = IP[0] - MP[0]
            return (a**2 + b**2)**.5

    @staticmethod
    def get_angle(left_OP,MP,IP):
    # Find angle to order IP when one MP connects to multiple IP 
    # (Angle is from MP's perspective)
        vector1 = (left_OP[0] - MP[0],left_OP[1] - MP[1])
        vector2 = (IP[0] - MP[0],IP[1] - MP[1])

        dot_product = np.dot(vector1, vector2) 
        norms_product = (np.linalg.norm(vector1) * np.linalg.norm(vector2))
        return np.arccos(dot_product/norms_product)

    @staticmethod
    def get_MP(point1,point2): # Midpoint Formula
        return ((point1[0]+point2[0])/2,(point1[1]+point2[1])/2)

    def get_closest_IPs(self): 
    # Gets smallest outer radius (from OP to IP)
        minimum_distance = float('inf')
        self.MP_to_IP_dictionary = {}
        self.IP_to_MP_dictionary = {}
        self.IP_set = set()
        for k,v in self.MP_to_IP_distances.items():
            if v[0][1] == minimum_distance:
                self.check_for_multi_connection_case(k,v,minimum_distance)
            elif v[0][1] < minimum_distance:
                minimum_distance = v[0][1]
                self.MP_to_IP_dictionary = {}
                self.IP_to_MP_dictionary = {}
                self.IP_set = set()
                self.check_for_multi_connection_case(k,v,minimum_distance)
        print('MP_to_IP_dictionary:',self.MP_to_IP_dictionary,'\n')
        print('IP_to_MP_dictionary:',self.IP_to_MP_dictionary,'\n'*2)

    def check_for_multi_connection_case(self,key,value,minimum_distance): 
    # Checks if an OP connects to multiple IP
        self.update_MP_to_IP_dictionary(key,value[0][0],value[0][1])
        self.update_IP_to_MP_dictionary(value[0][0],key,value[0][1])
        self.IP_set.add(value[0][0])
        for i in range(1,len(value)):
            if value[i][1] == minimum_distance:
                self.update_MP_to_IP_dictionary(key,value[i][0],
                                                value[i-1][1])
                self.update_IP_to_MP_dictionary(value[i][0],key,
                                                value[i-1][1])
                self.IP_set.add(value[i][0])
            else:
                break

    def update_MP_to_IP_dictionary(self,MP,IP,distance):
        try:
            self.MP_to_IP_dictionary[MP].append((IP,distance))
        except KeyError:
            self.MP_to_IP_dictionary.update({MP:[(IP,distance)]})
    
    def update_IP_to_MP_dictionary(self,IP,MP,distance):
        try:
            self.IP_to_MP_dictionary[IP].append((MP,distance))
        except KeyError:
            self.IP_to_MP_dictionary.update({IP:[(MP,distance)]})

    def update_points_lists(self):
        for IP in self.IP_set:
            self.convex_hull.OP.append(IP) 
            self.convex_hull.IP.remove(IP) 
    
    def update_all_dictionaries(self):   
        used_dictionary = {} 
        # Stops IP_to_MP_dictionary (IP keys) from using same MP again
        recursive_case = []
        for new_IP,list_MP in self.IP_to_MP_dictionary.items():
            if len(list_MP)==1: 
            # CASE1: when an IP is only touched by one MP
                MP = list_MP[0][0]
                try:
                    used_dictionary[MP]  
                    # Checks if MP is in used dictionary
                except:
                    used_dictionary.update({MP:None})
                else:
                    continue
                IP_list = self.MP_to_IP_dictionary[MP]
                count = len(IP_list)
                temp_OPs_list = self.convex_hull.MP_to_OP_dictionary.pop(MP)
                left_of_MP = temp_OPs_list[0]
                right_of_MP = temp_OPs_list[1]
                if count == 1: # CASE1a: when the MP touches one IP
                    self.connect_new_IPs(IP_list[0][0],left_of_MP,
                                        right_of_MP)
                    self.delete_from_dictionaries(MP,IP_list[0][0])
                else: # CASE1b: when the MP touches multiple IP
                    tree = None
                    for i in range(count):
                        IP = IP_list[i]
                        angle = self.get_angle(left_of_MP,MP,IP[0])
                        tree = self.insert_into_OPs_tree((IP[0],angle),
                                                        left_of_MP,
                                                        right_of_MP,
                                                        i,tree)
                        self.delete_from_dictionaries(MP,IP[0])
            else: # CASE2: When multiple Midpoints touch the same IP
                recursive_case.append((new_IP,list_MP)) 
                # Resolves CASE2s after all CASE1s
        
        if len(recursive_case) > 0: # Resolving CASE2s
            print('multi-case requiring recursion')
            for new_IP, list_MP in recursive_case:
                for MP in list_MP:
                    next_distance = RecursiveCase(self,MP)
                    pass
                    # MP = list_MP[0][0]
                    # try:
                    #     used_dictionary[MP]  
                    #     # Checks if MP is in used dictionary
                    # except:
                    #     used_dictionary.update({MP:None})
                    # else:
                    #     continue

        print('IP:',len(self.convex_hull.IP),'\n',self.convex_hull.IP,'\n'*2)
        
    def insert_into_OPs_tree(self,angle_IP,left_OP,right_OP,i,tree=None): 
    #TODO Make into AVL tree
    # Uses binary tree to insert into linked_OP
        if i == 0:
            self.connect_new_IPs(angle_IP[0],left_OP,right_OP)
            return TreeNode(angle_IP)
        elif tree.point[1] > angle_IP[1]:
            if tree.left is not None:
                tree.left = self.insert_into_OPs_tree(angle_IP,
                                                    left_OP,
                                                    tree.point[0],
                                                    i,tree.left)
            else:
                tree.left = self.insert_into_OPs_tree(angle_IP,
                                                    left_OP,
                                                    tree.point[0],
                                                    0)
        elif tree.point[1] < angle_IP[1]:
            if tree.right is not None:
                tree.right = self.insert_into_OPs_tree(angle_IP,
                                                        tree.point[0],
                                                        right_OP,i,
                                                        tree.right)
            else:
                tree.right = self.insert_into_OPs_tree(angle_IP,
                                                        tree.point[0],
                                                        right_OP,0)
    
    def delete_from_dictionaries(self,MP,IP): 
    #TODO Find better way to prevent exceptions
        for p in self.convex_hull.MP_to_OP_dictionary.keys():
            if p == MP: # Is completely deleted directly after loop
                continue
            try: 
                distance_reference = self.MP_to_IP_distances_reference[p][IP]
            except:
                continue
            self.MP_to_IP_distances[p].remove((IP,distance_reference)) 
            # Deletes new IP from MP_to_IP_distances

            del self.MP_to_IP_distances_reference[p][IP] 
            # Deletes new IP from MP_to_IP_distances_reference
        try:
            del self.MP_to_IP_distances[MP] # Deletes entire MP case
        except:
            pass

    def connect_new_IPs(self,IP,left_of_MP,right_of_MP):
        new_node = AddNode(IP,left_of_MP,right_of_MP,
                            self.convex_hull.MP_to_OP_dictionary)
        # update linked_OP
        self.convex_hull.linked_OP[left_of_MP].right = IP
        self.convex_hull.linked_OP[left_of_MP].right_MP = new_node.left_MP
        self.convex_hull.linked_OP[right_of_MP].left = IP
        self.convex_hull.linked_OP[right_of_MP].left_MP = new_node.right_MP
        self.convex_hull.linked_OP.update({IP:new_node})

        print('linked_OP:',self.convex_hull.linked_OP,'\n'*2)

        # update MP_to_IP_distances
        print('New MP_to_IP_distances:\n')
        self.add_to_MP_to_IP_distances(new_node,'right')
        self.add_to_MP_to_IP_distances(new_node,'left')
        print()
        
    def multi_case(self):
        pass
    
    def print_connected_OP(self):
        print_list = []
        for i in range(len(self.convex_hull.linked_OP) - 1):
            if i == 0:
                print_list.append(list(self.convex_hull.linked_OP.items())[0][0])
                right_point = list(self.convex_hull.linked_OP.items())[0][1].right
                print_list.append(right_point)
            else:
                right_point = self.convex_hull.linked_OP[right_point].right
                print_list.append(right_point)
        print('Path:',print_list,'\n'*2)

        self.get_final_distance(print_list)

    def get_final_distance(self,final_list):
        total = 0
        length = len(final_list)
        for i in range(length):
            j = (i+1) % length
            total += self.get_distance(final_list[i],MP=final_list[j],metric=2)
            # Calculating euclidean distance of final Path
        print("Final Distance:",total)
            

if __name__ == "__main__":
    """Simple test case:"""
    TravelingSalesmanSolution(
        point_list = [(-2,2),(2,2),(-2,-10),(2,-10),(-1,1),(1,1),(1,3)],
        metric=2
    ) 

    """Simple recursive case:"""
    # TravelingSalesmanSolution(
    #     point_list = [(10,0),(0,10),(0,-10),(-10,0),(5,0),(2,1)]
    # ) 

    """
    Random point selection:
    (Number of Points,Range of Points must both be positive integers)
    """
    #TravelingSalesmanSolution(number_of_points=15,range_of_points=25)