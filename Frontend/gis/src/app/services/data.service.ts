import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeatureCollection } from 'geojson';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  getCountySumm(cid): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/countysumm';
    return this.getFeatureCollection(url,cid);
  }
  
  getEarthquakes(dataRange): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/earthquakes';
    return this.getFeatureCollection(url,dataRange);
  }

  getCounties(dataRange): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/cacounties';
    return this.getFeatureCollection(url, dataRange);
  }

  getCountyQuake(dataRange): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/countyquake';
    return this.getFeatureCollection(url, dataRange);
  }

  getQuakesByYear(countyid): Observable<FeatureCollection> {
    const url = 'http://localhost:5000/api/data/qbyyr';
    return this.getFeatureCollection(url, countyid);
  }


  /**
   * Retrieves the data and constructs a FeatureCollection object from the received data
   */
  private getFeatureCollection(url, data): Observable<FeatureCollection> {
    return this.http.post<any>(url, data, httpOptions).pipe(map(unparsed => {

      const f: FeatureCollection = {
        type: 'FeatureCollection',
        features: unparsed.map((u: any) => {
          return {
            type: 'Feature',
            geometry: u.geojson,
            properties: {
              id: u.id, 
              location: {lat: u.latitude, lng: u.longitude}, 
              mag: u.mag, 
              depth: u.depth,
              name: u.name, 
              area: u.area, 
              nQuakes: u.nQuakes,
              count: u.count,
              year:u.year,
              time:u.time}
//            properties: { osm_id: u.osm_id, name: u.name, area: u.area }
          };
        })
      };

      return f;
    }));
  }

}
