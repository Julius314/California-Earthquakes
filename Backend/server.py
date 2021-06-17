# flask imports, CORS will be important next week (install using: pip install -U flask-cors)
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# general python imports
import json

# psycopg2 imports
import psycopg2
import psycopg2.extras

# constants, check whether to use localhost or gis-database as the URL depending if its running in Docker 
IN_DOCKER = True
DB_HOST = "gis-database" if IN_DOCKER else "localhost"
DB_PORT = "5432" if IN_DOCKER else "15432"
DB_USER = "gis_user"
DB_PASS = "gis_pass"
DB_NAME = "gis"

# we've imported flask, we still need to create an instance. __name__ is a built-in variable which evaluates 
# to the name of the current module. Thus it can be used to check whether the current script is being run on 
# its own or being imported somewhere else by combining it with if statement, as shown below.
app = Flask(__name__)
# extend flask with CORS, will be necessary next week
CORS(app)

maglim = 2.5



@app.route('/api/data/qbyyr', methods=["GET","POST"])
def earthbyyear():
    cid = request.json
    one = cid['one']
    two = cid['two']

    query = f"""
        SELECT 
			COUNT(earthquakes) as count,
			extract(year from time) as yr,
			SUM(earthquakes.mag) as avgmag,
			SUM(earthquakes.depth) as avgdepth
        from earthquakes,ca_borders 
		WHERE st_within (
            ST_SetSRID(st_makepoint(earthquakes.longitude,earthquakes.latitude),4326),
            ca_borders.geom)
        AND ca_borders.gid between {one} and {two}
        group by yr
		order by yr; 
    """

    if one != two:
        query = """
            SELECT COUNT(*) as count,
                extract(year from time) as yr,
                SUM(mag) as avgmag,
                sum(depth) as avgdepth
                from earthquakes
                group by yr
                order by yr
        """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:

        # Create a cursor object, which allos us to create the connection
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            # execute the query
            cur.execute(query)

            # fetch ALL results, we could also use fetchone() or fetchmany()
            records = cur.fetchall()
            
            

    # close the connection, after we're finished
    conn.close()

    #
    rturn = []
    y = 1970
    print(cid, flush=True)
    for r in records:
        
        while r.yr > y:
            rturn.append({"count": 0, "year": y, "avgmag": 0})
            y = y+1

        rturn.append({"count": r.count, "year": r.yr, "avgmag": r.avgmag})
        y = y+1

    while y <= 2020:
        rturn.append({"count": 0, "year": y, "avgmag": 0})
        y = y+1

#    print(rturn,flush=True)

    return jsonify([{"count": r['count'], "year": r['year'], "mag": r['avgmag']/(r['count']+0.00001)} for r in rturn]), 200


@app.route('/api/data/earthquakes', methods=["GET","POST"])
def getEarthquakes():
    filter = request.json
    fr = filter['time'][0]
    to = filter['time'][1]
    magFilter = filter['mag']
    depthFilter = filter['depth']
    #print(f'data {fr}',flush=True)



    query = f"""
        SELECT * FROM earthquakes WHERE "time" >='{fr}/01/01 00:00:00' AND "time" <='{to}/12/31 23:59:59'
        AND mag between {magFilter[0]} and {magFilter[1]}
        AND depth between {depthFilter[0]} and {depthFilter[1]}
    """
#    print(query,flush=True)

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:

        # Create a cursor object, which allos us to create the connection
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            # execute the query
            cur.execute(query)

            # fetch ALL results, we could also use fetchone() or fetchmany()
            records = cur.fetchall()
            
            

    # close the connection, after we're finished
    conn.close()

    return jsonify([{
        "geojson": {
            "type":"LineString", 
            "coordinates": [[r.longitude,r.latitude],[r.longitude, r.latitude]]},
        "latitude": r.latitude, 
        "longitude": r.longitude, 
        "mag": r.mag, 
        "depth": r.depth,
        "time": r.time} for r in records]), 200


@app.route('/api/data/countyquake', methods=["GET","POST"])
def countyquakes():
    filter = request.json
    fr = filter['time'][0]
    to = filter['time'][1]
    magFilter = filter['mag']
    depthFilter = filter['depth']

    query = f"""
        SELECT poly.id as id,poly.name as name,SUM(CASE WHEN st_within(
            ST_SetSRID(st_makepoint(quakes.longitude,quakes.latitude),4326),
            poly.geom ) = true then 1 else 0 end)
        from ca_borders poly, earthquakes quakes
        WHERE quakes.time >='{fr}/01/01 00:00:00' AND quakes.time <='{to}/12/31 23:59:59'
        AND mag between {magFilter[0]} and {magFilter[1]}
        AND depth between {depthFilter[0]} and {depthFilter[1]}
        group by (poly.id)
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:

        # Create a cursor object, which allos us to create the connection
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:

            # execute the query
            cur.execute(query)

            # fetch ALL results, we could also use fetchone() or fetchmany()
            records = cur.fetchall()

    # close the connection, after we're finished
    conn.close()

    return jsonify([{"id": r.id, "name": r.name, "nQuakes": r.sum} for r in records]), 200



"""
CREATE TABLE IF NOT EXISTS population (
    fips int,
    county varchar(20),
    year int,
    age int,
    pop_female int,
    pop_male int,
    pop_total int,
    CONSTRAINT population_PK PRIMARY KEY (fips)
);

COPY population FROM '/importdata/ca-population.csv' DELIMITER ',' csv header;
"""


@app.route('/api/data/cacounties', methods=["GET","POST"])
def counties():
    filter = request.json
    fr = filter['time'][0]
    to = filter['time'][1]
    magFilter = filter['mag']
    depthFilter = filter['depth']

    query = f"""
        SELECT 
            ca_borders.gid as id, 
            ca_borders.name as name, 
            st_asgeojson(ca_borders.geom) as geojson, 
            ROUND((ca_borders.aland + ca_borders.awater)/1000000) as area, 
            COUNT(earthquakes) as sum,
			SUM(earthquakes.mag) as summag,
			SUM(earthquakes.depth) as sumdepth
        FROM ca_borders,earthquakes
        WHERE st_within (
            ST_SetSRID(st_makepoint(earthquakes.longitude,earthquakes.latitude),4326),
            ca_borders.geom)
        AND earthquakes.time >='{fr}/01/01 00:00:00' AND earthquakes.time <='{to}/12/31 23:59:59'
        AND mag between {magFilter[0]} and {magFilter[1]}
        AND depth between {depthFilter[0]} and {depthFilter[1]}
        group by ca_borders.gid
    """

    with psycopg2.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, dbname=DB_NAME) as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.NamedTupleCursor) as cur:
            cur.execute(query)
            records = cur.fetchall()


    return jsonify([{
        "id": r.id, 
        "name": r.name, 
        "geojson": json.loads(r.geojson), 
        "area": r.area, 
        "nQuakes": r.sum, 
        "mag": r.summag/(r.sum+0.00001), 
        "depth": r.sumdepth/(r.sum+0.00001)
        } for r in records]), 200

