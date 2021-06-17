#!/bin/bash

echo "Starting import of dataset..."
#osm2pgsql --create --database gis --slim --latlong --host localhost --username gis_user /importdata/baden-wuerttemberg-latest.osm.pbf

##use .sql file instead!
#psql -c "\copy earthquakes FROM '/importdata/earthquakes.csv' delimiter ',' csv" -h localhost 


shp2pgsql -s 3857:4326 importdata/ca_bounds/CA_Counties_TIGER2016.shp public.ca_borders | psql -d gis -U gis_user -h localhost -p 5432
#shp2pgsql -s 4326 importdata/ca_bounds/CA_Counties_TIGER2016.shp ca_borders | psql -d gis -U gis_user -h localhost -p 5432

echo "Finished import of dataset import of dataset..."
echo "Database ready!"

