# Declare which image to pull
# We use a prebuilt PostgreSQL Database with the GIS Extension already installed
FROM kartoza/postgis:11.0-2.5

# Set default credentials and database
ENV POSTGRES_USER gis_user
ENV POSTGRES_PASSWORD gis_pass
ENV POSTGRES_DB gis

# Update apt-get cache and install the OpenStreetMap Importer
RUN apt-get update
RUN apt-get install -y osm2pgsql

VOLUME [ "/docker-entrypoint-initdb.d" ]

# Copy data from local filesystem into docker container.
# Import_dataset is the importer script for the OSM data 
# and docker-entrypoint.sh overrides the default startup script.

COPY equakes_processed.csv /importdata/earthquakes.csv
#COPY earthquakes.csv /importdata/earthquakes.csv
COPY ca-population.csv /importdata/ca-population.csv

COPY CA_Counties /importdata/ca_bounds
COPY docker-entrypoint.sh /docker-entrypoint.sh
