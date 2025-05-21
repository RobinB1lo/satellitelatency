from satellite import Satellite

#Note that latitude ranges from -90 to 90 and longitude ranges from -180 to 180 
class GroundPoint:
    def __init__(self, id, coordinate, is_coonnected):
        self.id = id
        self.coordinate = coordinate
        self.is_connected = is_coonnected
    
    def set(self):
        #this class will set thhe corrdinate down and start the connection to the satellite
        return 
    
    def connect(self, satellite: Satellite) -> bool:
        #do something so the visual connects
        #something related to latency to the satelite
        self.is_connected = True
        return self.is_connected
    
    def find_min_latency_path(self, satellite: Satellite) -> None:
        return 
    