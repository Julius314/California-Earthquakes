import { ElementRef, Component, OnInit, Input } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'barchart',
  styleUrls: [],
  template: `
    
        <svg id="canvas" style="width:100%;height:350px">
        </svg>
    
         
  `
})

export class Barchart implements OnInit {  

  constructor(private el: ElementRef) { }

  title = 'barchart';
  @Input() data: Array<any>;
  @Input() qType: number;         //needed to know what likert scale was used               
  processed: object;

  margin: any = {
    top: 20, 
    right: 20, 
    bottom: 70, 
    left: 40};
  width: number = 600;
  height: number = 300;

  ngOnInit(){
    //console.log("data: ", this.data, "qType: ", this.qType);
    let nLikert = this.qType;
    nLikert = 5;
    let maxVal = 1;

    
    //prepare data
    this.processed = this.data;
/*     for (let i = 1; i <= nLikert; i++) {
      this.processed[i] = 0;
    }
    //remove names
    console.log("data",this.data)
    Array.from(this.data).forEach(element => {
      console.log("element",element)
      if(!isNaN(element)){
        this.processed[element]++;
        if(this.processed[element] > maxVal)
          maxVal = this.processed[element];
      }
    });
     */
    console.log("data",this.data)
    

    this.width = this.el.nativeElement.getBoundingClientRect().width*0.7;
    this.margin.left = this.margin.right = this.el.nativeElement.getBoundingClientRect().width*0.15;
    //TODO: Set height according to viewport

    let canvas = d3.select(this.el.nativeElement.firstChild)
      .append('g')
      .attr('class','plot')
      .style('transform', 'translate(' + this.margin.left + 'px, ' + this.margin.top + 'px)' );

    //create scales
    const yScale = d3.scaleLinear()
      .range([this.height, 0])
      .domain([0, maxVal])

    canvas.append('g')
      .attr("class","axis")
      .call(d3.axisLeft(yScale)
        .tickValues([...Array(maxVal).keys()].map(x => ++x))
        .tickFormat(d3.format("d")));

    const xScale = d3.scaleBand()
      .range([0, this.width])      
      .domain(d3.extent(this.data, d => {return d.year}))
      //.ticks(nLikert)
      .padding(0.2)
  
    canvas.append('g')
      .attr("class","axis")
      .style('transform', 'translate(0, '+ this.height +'px)')
      .call(d3.axisBottom(xScale));

    //add bars
    let bars = canvas.append('g').attr("class","bars")
    for (const key in this.processed) {
      bars.append('rect')
        .attr('x', xScale(key))
        .attr('y', yScale(this.processed[key]))
        .attr('height', (this.height - yScale(this.processed[key])))
        .attr('width', xScale.bandwidth())
        .style('fill','#4bb160')
    }


  }
}
