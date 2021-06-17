import { Component, OnInit } from '@angular/core';
import { DataService } from './services/data.service';
import { FeatureCollection } from 'geojson';
import { Overlay } from './types/map.types';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  overlays: Array<Overlay> = new Array<Overlay>();

  // constructor is here only used to inject services
  constructor(private dataService: DataService) { }

  /**
   * Retrieve data from server
   */
  ngOnInit(): void {

    console.log("init app.component");



/*     this.dataService.getBardichteNorm().toPromise().then((val: FeatureCollection) => {
      this.overlays.push(new BardichteNormLayer('Bardichte Norm', val));
    });
 */
  }
}
