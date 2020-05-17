mv /root/onebusaway-gtfs-modules-onebusaway-gtfs-modules-1.3.48/onebusaway-gtfs-merge-cli/target/onebusaway-gtfs-merge-cli-1.3.48.jar /volume/
echo 'wait 10 second.'
sleep 10
PGPASSWORD=password psql -f ./init.sql -U postgres -d postgres -h postgis
echo 'start import!'
/gtfsdb/bin/gtfsdb-load --database_url postgresql://postgres:password@postgis:5432/postgres --is_geospatial GTFS.zip
