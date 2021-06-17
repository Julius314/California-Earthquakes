
import { Component, OnInit, Input, ViewEncapsulation, IterableDiffers} from '@angular/core';

import * as L from 'leaflet';
import * as d3 from 'd3';

import './leaflet-triangle-marker'

import { Overlay, CountyLayer, EarthquakeLayer } from '../types/map.types';
//import * as comp from './comparisons'
import { FeatureCollection } from 'geojson';
import { DataService } from '../services/data.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css', 
    '../../../node_modules/leaflet.markercluster/dist/MarkerCluster.Default.css',], 
  // super important, otherwise the defined css doesn't get added to dynamically created elements, for example, from D3.
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements OnInit{

  @Input() overlays: Array<Overlay> = [];
  iterableDiffer: any;
  
  private layerControl: L.Control.Layers;
  olays = {};
  bmaps;

  mymap;
  tooltip;
  circles = [];
  counties = [];
  dataRange = {from: 2010, to: 2018};
  filter = {
    time: [2010,2018],
    mag:[2.4,10],
    depth:[-1,120]
  }
  maxcluster = 1000;
  zoom = 0;
  markers;
  countyLayer:Overlay;

  constructor(private iterable: IterableDiffers, private dataService: DataService) {
    this.iterableDiffer = this.iterable.find(this.overlays).create();
  }

  ngOnInit() {
    // use osm tiles
    const basemap = L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // create map, set initial view to basemap and zoom level to center of BW
    this.mymap = L.map('main', { layers: [basemap] }).setView([37.821500, -122.474748], 6);

    // create maps and overlay objects for leaflet control
    this.bmaps = {
      OpenStreetMap: basemap,
    };

    // add a control which lets us toggle maps and overlays
//    this.layerControl = L.control.layers(this.bmaps);
//    this.layerControl.addTo(this.mymap);
    


    // create tooltip
    this.tooltip = d3.select('body')
      .append('div')
      .attr('id', 'map-tooltip')
      .attr('class', 'map-tooltip');

      


    //compare histogram against filtered 
    this.showHistogram({one:0,two:60});


    this.markers = L.markerClusterGroup({
      disableClusteringAtZoom:9,
      spiderfyOnMaxZoom: false,
      iconCreateFunction:  (cluster) => {

        let num = cluster.getChildCount()
        if(num > this.maxcluster)
          this.maxcluster = num;

        let zoom = this.mymap.getZoom();

        let maxItems = 2000;
        if(zoom != this.zoom){
          maxItems = this.maxcluster;
          this.maxcluster = 1;
          this.zoom = zoom;
          console.log("zoom",this.zoom, maxItems)
        }

        //calculate radius
        let minR = zoom*2;
        let maxR = zoom*8;

        let rad = (num/maxItems)*(maxR-minR)+minR;

        //determine color
        let colorClass = "gruen";
        if((num/maxItems) > 0.2)
          colorClass = "gelb";
        if((num/maxItems) > 0.4)
          colorClass = 'orange';
        if((num/maxItems) > 0.6)
          colorClass = 'rot';

        return L.divIcon({ html: num.toString(), className: 'clCircle' + " " + colorClass, iconSize: L.point(rad,rad) });
      }
    });

    this.getClusterData();

    this.markers.on(
      {'mouseover': (e) => {
//        e.layer.setRadius(e.layer.options.radius*3) 
        e.layer.setHeight(e.layer.options.height*3)
        e.layer.setWidth(e.layer.options.width*3)


        this.tooltip.selectAll('*').remove();
        this.tooltip.style('opacity', '1');
                                
        this.tooltip.style('box-shadow','inset 0 0 4px 2px '+e.layer.options.color+', 0px 0px 6px 0.25px #8e8e8e')

        this.tooltip.style('top', ((e as any).originalEvent.clientY - 90) + 'px');
        this.tooltip.style('left', ((e as any).originalEvent.clientX + 40) + 'px');
    

        let r1 = this.tooltip.append('span').attr('class', 'cont');
        r1.append('span').attr('class','lftcol').html("Mag");
        r1.append('span').attr('class','rghtcol').html(e.layer.options.mag);
        let r2 = this.tooltip.append('span').attr('class', 'cont');
        r2.append('span').attr('class','lftcol').html("Depth");
        r2.append('span').attr('class','rghtcol').html(e.layer.options.dept);
        let r3 = this.tooltip.append('span').attr('class', 'cont');
        r3.append('span').attr('class','lftcol').html("Time");
        r3.append('span').attr('class','rghtcol').html(e.layer.options.time);


      }, 'mouseout': (e) => {
        this.tooltip.style('opacity', '0');
        e.layer.setHeight(e.layer.options.height/3)
        e.layer.setWidth(e.layer.options.width/3)
        //e.layer.setRadius(e.layer.options.radius/3) 
      }, 'clustermouseover': (e) => {
        e.layer.setOpacity(0.3)
      },  'clustermouseout': (e) => {
        e.layer.setOpacity(1)
      }
    })


    //show counties 
    this.dataService.getCounties(this.filter).toPromise().then((val: FeatureCollection) => {
      this.countyLayer = new CountyLayer('Counties', val, this.dataService)
      this.olays[this.countyLayer.name] = this.countyLayer.createOverlay().addTo(this.mymap);

      this.mymap.addLayer(this.markers);
      this.olays["Cluster"] = this.markers;  
  
      this.layerControl = L.control.layers(this.bmaps,this.olays).addTo(this.mymap);        

    })

  }


  getClusterData(){

    this.markers.eachLayer((l) => {
      this.markers.removeLayer(l);
    })

    this.dataService.getEarthquakes(this.filter).toPromise().then((val: FeatureCollection) => {
  
      let cscale = d3.scaleOrdinal().domain(["0","5"]).range(['#598000','#DEC800','#ff7900','#ff4F00','#ff2F00',"#ff0000"]);
      let tscale = d3.scaleLinear().domain(d3.extent(val.features,(d) => {
        //console.log(new Date(d.properties.time))
        return new Date(d.properties.time).getTime()})).range([-180,180])

      let getMagClass = (mag) => {
        if(mag < 3.9)
          return "0";
        if(mag < 4.9)
          return "1";
        if(mag < 5.9)
          return "2";
        if(mag < 6.9)
          return "3";
        if(mag < 7.9)
          return "4";
        else return "5";
      }

      let getDepthSize = (depth) => {
        
        if(depth < 0)
          depth = 0
        if(depth > 20)
          depth = 20
        return (20-depth)/(20) * (13-2) + 2
      }

      //combat overplotting
      let getOpacity = (mag) => {
        if(mag < 3.9)
          return 0.1
        if(mag < 4.9)
          return 0.5
        else return 0.9
      }


      val.features.forEach(element => {

        let sty = {
          //radius: getDepthSize(element.properties.depth) ,
          width: getDepthSize(element.properties.depth),
          height: getDepthSize(element.properties.depth),
          fill: true,
          opacity:getOpacity(element.properties.mag),
          fillColor: cscale(getMagClass(element.properties.mag)).toString(),
          stroke: true,
          color: cscale(getMagClass(element.properties.mag)).toString(),
          rotation: tscale(new Date(element.properties.time).getTime()),

          mag: element.properties.mag,
          dept: element.properties.depth,
          time: element.properties.time
        };
        
        // @ts-ignore
        this.markers.addLayer(L.triangleMarker(element.properties.location, sty).bringToFront()).addTo(this.mymap);
      });

    })

  }

  showHistogram(countyid){
    this.dataService.getQuakesByYear(countyid).toPromise().then((val: FeatureCollection) => {

      let margin = {left: 20, top: 20}

      //let height = 300;
      let height =  document.getElementById('histo').getBoundingClientRect().height/2;
      let width = document.getElementById('histo').getBoundingClientRect().width*0.8;
      //console.log("heightWidth",height,width)
      //let width = 900;

      d3.select("#histo").selectAll("*").remove();

      let canvas = d3.select("#histo")
      .append('g')
      .attr('class','plot')
      .style('transform', 'translate(' + document.getElementById('histo').getBoundingClientRect().width*0.1 + 'px, ' + margin.top + 'px)' );

      let maxVal = d3.max(val.features, d => {return d.properties.count})
      
      //create scales
      const yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([0, maxVal])

      canvas.append('g')
        .attr("class","axis")
        .call(d3.axisLeft(yScale)
          .ticks(3)
          .tickFormat(d3.format("d")));

      const xScale = d3.scaleBand()
        .range([0, width])      
        .domain(val.features.map(d => { return d.properties.year;}))
        //.ticks(nLikert)
        .padding(0.2)
        
      canvas.append('g')
        .attr("class","axis")
        .style('transform', 'translate(0, '+ height +'px)')
        .call(d3.axisBottom(xScale).tickFormat((date) =>{
          return String(date).substr(2);
        }));

      //add bars
      let bars = canvas.append('g').attr("class","bars")
      
      bars.selectAll('rect').data(val.features).enter().append('rect')
        
        .attr('x', d => {return xScale(d.properties.year)})
        .attr('y', d => {return yScale(d.properties.count)})
        .attr('height', d => {return (height - yScale(d.properties.count))})
        .attr('width', xScale.bandwidth())
        .style('fill','#4bb160')
    })
  }


  //gets executed when the show button is clicked
  checkYears(event: any){
    console.log(event);

    if(
      Number.isInteger(this.filter.time[0]) &&
      Number.isInteger(this.filter.time[1]) &&
      this.filter.time[0] <= this.filter.time[1] &&

      Number.isFinite(this.filter.mag[0]) &&
      Number.isFinite(this.filter.mag[1]) &&
      this.filter.mag[0] <= this.filter.mag[1] &&

      Number.isFinite(this.filter.depth[0]) &&
      Number.isFinite(this.filter.depth[1]) &&
      this.filter.depth[0] <= this.filter.depth[1] 
      ){
      console.log("were good to go!");
      

       this.dataService.getCounties(this.filter).toPromise().then((val: FeatureCollection) => {
        this.countyLayer = new CountyLayer('Counties', val, this.dataService)  
        this.getClusterData();

        this.reloadLayers();        
      })  

    }
    else{
      //show message that years are not valid
      console.log("Dirty Input values");
    }
  }

  reloadLayers(){
        
    //remove layers
    this.mymap.eachLayer((layer) => {
      if( !(layer instanceof L.TileLayer) )
        this.mymap.removeLayer(layer);
    });
    
    //remove layerControl
    this.layerControl.remove()
    
    this.olays[this.countyLayer.name] = this.countyLayer.createOverlay().addTo(this.mymap);

    //add new layerControl
    this.layerControl = L.control.layers(this.bmaps,this.olays).addTo(this.mymap);    
    
  }


  //update from and to values necessary for dataselection
  onKey(event: any) {
    switch (event.target.id) {
      case "yrFrom":
        this.dataRange.from = event.target.value; 
        this.filter.time[0] = Number.parseInt(event.target.value);
        break;
      case "yrTo":
        this.dataRange.to = event.target.value;  
        this.filter.time[1] = Number.parseInt(event.target.value);
        break;
      case "magFrom":
        this.filter.mag[0] = Number.parseFloat(event.target.value);
        break;        
      case "magTo":
          this.filter.mag[1] = Number.parseFloat(event.target.value);
          break;      
      case "depthFrom":
          this.filter.depth[0] = Number.parseFloat(event.target.value);
          break;        
      case "depthTo":
          this.filter.depth[1] = Number.parseFloat(event.target.value);
          break;        

      default:
        break;
    }
  }

  chLayCol(event: any){
    this.countyLayer.changeColorScale(event.target.value);
    this.reloadLayers();
  }

}
