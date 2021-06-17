

  //calculate the distance between 2 points
export function p2p(p1,p2){

    var R = 6371e3; 
    var phi1 = p1.coords.lat * Math.PI / 180;
    var phi2 = p2.coords.lat * Math.PI /180;
    var dphi = (p2.coords.lat - p1.coords.lat) * Math.PI / 180;
    var dlam = (p2.coords.lng - p1.coords.lng) * Math.PI / 180;

    var a = Math.sin(dphi/2) * Math.sin(dphi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dlam/2) * Math.sin(dlam/2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    //divide by 1000 to get km
    var d = (R * c)/1000;
    
    return d.toFixed(2);
  }

export function p2l(line,p2){

    let l1= {coords:line.coords[0]}
    let l2= {coords:line.coords[1]}

    //points of the line
    var x1 = line.coords[0].lng;
    var y1 = line.coords[0].lat;
    var x2 = line.coords[1].lng;
    var y2 = line.coords[1].lat;


    //get haversine distance between line start & end point
    var R = 6371e3; 
    var phi1 = x1 * Math.PI / 180;
    var phi2 = x2 * Math.PI /180;
    var dphi = (x2 - x1) * Math.PI / 180;
    var dlam = (y2 - y1) * Math.PI / 180;

    var ha = Math.sin(dphi/2) * Math.sin(dphi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dlam/2) * Math.sin(dlam/2);

    var hc = 2 * Math.atan2(Math.sqrt(ha), Math.sqrt(1-ha));

    //divide by 1000 to get km
    var hd = (R * hc) / 100000;



    //Point2Line Distance formula (see point to line formula https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line#Line_defined_by_two_points )
    //TODO: This formula considers euclidian distance and not Haversine distance (the earth is a sphere and not a disk)
    var a = Math.abs((y2-y1)*p2.coords.lng-(x2-x1)*p2.coords.lat+x2*y1-y2*x1)
    var b = Math.sqrt(Math.pow((y2-y1),2)+Math.pow((x2-x1),2));
    
    var p2l_dist = a/b * 100; //*100 for km

	//print distance
    console.log('point to line dist: ' + p2l_dist.toFixed(2) + 'km')
	
    return p2l_dist.toFixed(2);
}

export function l2l(p1,p2){
	
	//points of the line p1
    var p1_x1 = p1.coords[0].lng;
    var p1_y1 = p1.coords[0].lat;
    var p1_x2 = p1.coords[1].lng;
    var p1_y2 = p1.coords[1].lat;
	//points of the line p2
    var p2_x1 = p2.coords[0].lng;
    var p2_y1 = p2.coords[0].lat;
    var p2_x2 = p2.coords[1].lng;
    var p2_y2 = p2.coords[1].lat;
	
	//Line intersection test 
	var det, gamma, lambda;
	det = (p1_x2 - p1_x1)*(p2_y2 - p2_y1) - (p2_x2 - p2_x1)*(p1_y2 - p1_y1);
	if (det === 0) {
		console.log("false");
	} 
	else {
		lambda = ((p2_y2 - p2_y1)*(p2_x2 - p1_x1) + (p2_x1 - p2_x2)*(p2_y2 - p1_y1)) / det;
		gamma = ((p1_y1 - p1_y2)*(p2_x2 - p1_x1) + (p1_x2 - p1_x1)*(p2_y2 - p1_y1)) / det;
		
		//return true if lines intersect, otherwise return false
		console.log( (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1) );
	}
	
	//TODO BONUS
	//Calculate l2l() distance
	
	
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

export function p2poly(point,poly){
	//Idea: Use ray casting algorithm https://en.wikipedia.org/wiki/Point_in_polygon
	
    //TODO Access each respective edge of polygon???
    
    let count = 0;


    let polyV = poly.coords[0];
    //iterate over each edge
    let pline =  {coords:[]};
    for (let index = 0; index < polyV.length; index++) {
        //nth & nth+1 point
        if(index != polyV.length-1)
            pline.coords = polyV.slice(index,index+2);
        //select first and last point
        else
            pline.coords = [polyV[0],polyV[polyV.length-1]]

        let int = ((pline.coords[0].lng > point.coords.lng) != (pline.coords[1].lng > point.coords.lng))
            && (point.coords.lat < (pline.coords[1].lat - pline.coords[0].lat) * (point.coords.lng - pline.coords[0].lng) / (pline.coords[1].lng - pline.coords[0].lng) + pline.coords[0].lat);

        if(int)
            count = count+1;
    }


//    console.log("ray intersected ",count," times");

    //even
    if((count % 2) == 0){
//        console.log("Point lies outside polygon");
        return false;
    }
    //odd
    else{
//        console.log("Point lies inside polygon");
        return true;	
    }

}

export function l2poly(line,poly){
	//Idea: call line2line intersection test for each respective polygon edge testing if line intersection polygon

    let intersects = false;
    let polyV = poly.coords[0];

    //iterate over each edge
    let pline =  {coords:[]};
    for (let index = 0; index < polyV.length; index++) {
        //nth & nth+1 point
        if(index != polyV.length-1)
           pline.coords = polyV.slice(index,index+2);
        //select first and last point
        else
            pline.coords = [polyV[0],polyV[polyV.length-1]]

        if(intersects = l2l(line,pline))
            return intersects;
    }
    
	
    return intersects;
}

export function poly2poly(p1,p2){
    return false;
}