CREATE TABLE IF NOT EXISTS earthquakes (
    time timestamp(3),
    latitude float,
    longitude float,
    depth float,
    mag float,
    id varchar(20) NOT NULL,
    CONSTRAINT earthquakes_PK PRIMARY KEY (id)
);


COPY earthquakes FROM '/importdata/earthquakes.csv' DELIMITER ',' csv header;