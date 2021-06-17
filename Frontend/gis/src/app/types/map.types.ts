import { FeatureCollection } from 'geojson';
import { DataService } from '../services/data.service';


import * as L from 'leaflet';
import * as d3 from 'd3';
import 'leaflet.markercluster';


class Overlay {

    name: string;
    featureCollection: FeatureCollection;
    dataService: DataService;
    
    constructor(name: string, featureCollection: FeatureCollection, dataService: DataService) {
        this.name = name;
        this.featureCollection = featureCollection;
        this.dataService = dataService;
    }


    createOverlay() {
        return L.geoJSON(this.featureCollection);
    }

    changeColorScale(key){}

    showHistogram(countyid){
        this.dataService.getQuakesByYear(countyid).toPromise().then((val: FeatureCollection) => {
    
          let margin = {left: 20, top: 20}
    
          //let height = 300;
          let height =  document.getElementById('histo').getBoundingClientRect().height/2;
          let width = document.getElementById('histo').getBoundingClientRect().width*0.8; //0.8
          //console.log("heightWidth",height,width)
          //let width = 900;

          const minMaxArea = d3.extent([2.5,4.5]);
          const colorScale = d3.scaleSequential(d3.interpolateRgb("blue","red")).domain(minMaxArea);
  
    
          d3.select("#histo").selectAll("*").remove();
    
          let canvas = d3.select("#histo")
          .append('g')
          .attr('class','plot')
          .style('transform', 'translate(' + document.getElementById('histo').getBoundingClientRect().width*0.1 + 'px, ' + margin.top + 'px)' );
        

          canvas.append('text').text(countyid.name)

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
            .style('fill',d => {return colorScale(d.properties.mag)})
        })
      }
}

class EarthquakeLayer extends Overlay {
    constructor(name: string, featureCollection: FeatureCollection,dataService: DataService) {
        super(name, featureCollection,dataService);
    }

    createOverlay(){

        const minMaxArea = d3.extent(this.featureCollection.features.map(d => d.properties.cluster));
        //const colorScale = d3.scaleSequential(d3.interpolateReds).domain(minMaxArea);
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(minMaxArea)

        // create tooltip
        const tooltip = d3.select('#map-tooltip')


        console.log(this.featureCollection)

         // create geojson layer (looks more complex than it is)
        const earthquakeLayer = L.geoJSON(this.featureCollection, {

            style: (feature) => {

                return {
                    opacity: 0.1,
                    color: colorScale(feature.properties.cluster),
                    stroke: true,
                    weight: feature.properties.mag * 2  
                };
            },
            onEachFeature: (feature, layer) => {

                layer.on({
                    // on mouseover update tooltip and highlight county
                    mouseover: (e: L.LeafletMouseEvent) => {

                        // set highlight style
                        const l = e.target;
                        l.setStyle({
                            weight: e.target.options.weight*2,
                            color: 'blue',
                            opacity: 0.8
                        });

                        l.bringToFront();

                        tooltip.selectAll('*').remove();

                        tooltip.style('opacity', '1');
                        
                        //console.log("feat",feature.properties);
                        
                        tooltip.style('box-shadow','inset 0 0 4px 2px '+colorScale(feature.properties.mag)+', 0px 0px 6px 0.25px #8e8e8e')
                        //e.target.setStyle({weight:8}).addTo(this.mymap)
          
                        tooltip.style('top', ((e as any).originalEvent.clientY - 150) + 'px');
                        tooltip.style('left', ((e as any).originalEvent.clientX + 75) + 'px');
                    
//                        tooltip.append('h3').attr('class', 'head').html(feature.properties.name);
          
                        let r1 = tooltip.append('span').attr('class', 'cont');
                        r1.append('span').attr('class','lftcol').html("Magnitude");
                        r1.append('span').html(feature.properties.mag);
                         let r2 = tooltip.append('span').attr('class', 'cont');
                        r2.append('span').attr('class','lftcol').html("Cluster");
                        r2.append('span').html(feature.properties.cluster);
 
                    },
                    // on mouseover hide tooltip and reset county to normal sytle
                    mouseout: (e: L.LeafletMouseEvent) => {
                        tooltip.style('opacity', '0');
                        earthquakeLayer.resetStyle(e.target);
                    }
                });
            }
        });

        return earthquakeLayer;
    }
    
}


class CountyLayer extends Overlay {
    
    layCol = "depth";
    colorScale = d3.scaleSequential(d3.interpolateYlOrRd);
    maxQ = 0;

    constructor(name: string, featureCollection: FeatureCollection,dataService: DataService) {
        super(name, featureCollection,dataService);
    }


    changeColorScale(key){
        this.layCol = key;
        let minMaxArea = []
        if(key == "nQuakes")  
            minMaxArea = d3.extent(this.featureCollection.features.map(d => {return (d.properties.nQuakes/this.maxQ)/(d.properties.area/423970) }));
        else
            minMaxArea = d3.extent(this.featureCollection.features.map(d => {return d.properties[key]}));
        //@ts-ignore
        this.colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain(minMaxArea);
    }

    createOverlay(){

        let caArea = 423970;
        this.featureCollection.features.forEach(co => {
            this.maxQ += co.properties.nQuakes;
        })

        this.changeColorScale(this.layCol)

        const tooltip = d3.select('#map-tooltip')

        // create geojson layer (looks more complex than it is)
        const countyLayer = L.geoJSON(this.featureCollection, {

            style: (feature) => {

                let col = "#ffffff"
                if(this.layCol == "nQuakes") 
                    col = this.colorScale((feature.properties.nQuakes/this.maxQ)/(feature.properties.area/caArea))
                else
                    col = this.colorScale(feature.properties[this.layCol])

                return {
                    fillColor: col,
                    weight: 2,
                    opacity: 0.25,
                    color: col,
                    dashArray: '3',
                    fillOpacity: 0.2
                };
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    // on mouseover update tooltip and highlight county
                    mouseover: (e: L.LeafletMouseEvent) => {

                        let col = "#ffffff"
                        if(this.layCol == "nQuakes") 
                            col = this.colorScale((feature.properties.nQuakes/this.maxQ)/(feature.properties.area/caArea))
                        else
                            col = this.colorScale(feature.properties[this.layCol])
        

                        // set highlight style
                        const l = e.target;
                        l.setStyle({
                            weight: 5,
                            color: col,
                            dashArray: '',
                            fillOpacity: 0.4
                        });

                        tooltip.selectAll('*').remove();

                        tooltip.style('opacity', '1');
                                                
                        tooltip.style('box-shadow','inset 0 0 4px 2px '+col+', 0px 0px 6px 0.25px #8e8e8e')
          
                        tooltip.style('top', ((e as any).originalEvent.clientY - 150) + 'px');
                        tooltip.style('left', ((e as any).originalEvent.clientX + 75) + 'px');
                    
                        tooltip.append('h3').attr('class', 'head').html(feature.properties.name);
          
                        let tbl = tooltip.append('table')
                        let r1 = tbl.append('tr')
                        r1.append('td').attr('class','lftcol').html("Earthquakes");
                        r1.append('td').attr('class','rghtcol').html(feature.properties.nQuakes);
                        r1.append('td').attr('class','rghtcol').html((100*(feature.properties.nQuakes/this.maxQ)).toFixed(2) + "%")
                        let r2 = tbl.append('tr')
                        r2.append('td').attr('class','lftcol').html("Area (km<sup>2</sup>)");
                        r2.append('td').attr('class','rghtcol').html(feature.properties.area);
                        r2.append('td').attr('class','rghtcol').html((100*(feature.properties.area/caArea)).toFixed(2) + "%")
                        let r3 = tbl.append('tr')
                        r3.append('td').attr('class','lftcol').html("avgMag");
                        r3.append('td').attr('class','rghtcol').html(feature.properties.mag.toFixed(2))
                        let r4 = tbl.append('tr')
                        r4.append('td').attr('class','lftcol').html("avgDepth");
                        r4.append('td').attr('class','rghtcol').html(feature.properties.depth.toFixed(2))
                        
                        this.showHistogram({one:feature.properties.id,two:feature.properties.id,name: feature.properties.name})

                    },
                    // on mouseover hide tooltip and reset county to normal sytle
                    mouseout: (e: L.LeafletMouseEvent) => {
                        tooltip.style('opacity', '0');
                        countyLayer.resetStyle(e.target);
                    }
                });
            }
        });
        return countyLayer;
    }
    
}


export { Overlay, CountyLayer, EarthquakeLayer };
