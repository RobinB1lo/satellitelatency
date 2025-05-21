from groundpoint import GroundPoint

class Satellite:
    def __init__(self, id, distance, conection, orbit_time):
        self.id = id 
        self.distance = distance
        self.connection = conection
        self.orbit_time = orbit_time


    def connect(self, groundpoint: GroundPoint) -> bool:
        #do something that connects it to the groundpoint
        #do something that keeps track of the distance from the point
        #do something that keeps track of the latency from th epoint to the satellite
        return True 