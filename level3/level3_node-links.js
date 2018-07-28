var margin = { top: 50, right: 0, bottom: 0, left: 50 },
    width = 960 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

var svg = d3.select("#chart").append("svg")
    .attr("width", width )
    .attr("height", height );


var color = d3.scaleOrdinal(d3.schemeCategory20c);

var simulation = d3.forceSimulation()
    .force("edge", d3.forceLink().id(((d) =>  d.id )))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

d3.json("HKUST_coauthor_graph.json", (error, graph) => {
    if (error) throw error;

//group data by dept to get CSE dept
    var dept = d3.nest()
        .key((d) => d.dept)
        .entries(graph.nodes);

//use console.log to get the data, found index of CSE is 1
    var CSE = dept[1];

//get the professor id
    var CSEid = []
    for (var i=0; i< CSE.values.length;i++)
        CSEid[i]= + CSE.values[i].id;

//group edges by source
    var edges_scource = d3.nest()
        .key((d) => d.source)
        .entries(graph.edges);

//CSE teacher in target or source, target =id + source=id
    var CSEedge = [];
    for( var n=0; n< edges_scource.length; n++) {
        for ( var i=0; i< CSEid.length; i++) {
            if ( parseInt(edges_scource[n].key) === CSEid[i]) {
                CSEedge = CSEedge.concat(edges_scource[n].values)
            }}};

//re-group the CSEedge by source
    var CSEedge_source = d3.nest()
        .key((d)=>d.source)
        .entries(CSEedge);

//get "source = CSEid" date
    var only_cseedge = [];
    for( var n=0; n< CSEedge_source.length; n++) {
        for ( var i=0; i< CSEid.length; i++ ) {
            if ( parseInt(CSEedge_source[n].key) === CSEid[i]) {
                only_cseedge = only_cseedge.concat(CSEedge_source[n].values)
            }}};

//re-group again by target
    var only_cseedge_target = d3.nest()
        .key((d)=>d.target)
        .entries(only_cseedge);

//source id =cse id
    var new_cseedge = [];
    for( var n=0; n< only_cseedge_target.length; n++) {
        for ( var i=0; i< CSEid.length; i++ ) {
            if ( parseInt(only_cseedge_target[n].key) === CSEid[i]) {
                new_cseedge = new_cseedge.concat(only_cseedge_target[n].values)
            }}};

//here find the problem that id is not unique, should use uniqueID, but do not know how to use uniqueID to connect the source and target in edges
//use a stupid way to fix it first , try to think about it later
    var nest1 = d3.nest()
        .key((d)=>d.target)
        .entries(new_cseedge)

    var new_cseedge_2 =[];
    for (var i= 0;i<nest1.length;i++){
        if( (i!= 9) && (i!=13) && (i!=30)){
            new_cseedge_2 = new_cseedge_2.concat(nest1[i].values)
        }
    }
    var nest2 = d3.nest()
        .key((d)=>d.source)
        .entries(new_cseedge_2)

    var onlyCSEedges_final =[];
    for (var i= 0;i<nest2.length;i++){
        if((i!= 16) && (i!=28)){
            onlyCSEedges_final = onlyCSEedges_final.concat(nest2[i].values)
        }
    }

//get the cooperation number of each professor, he/she may be source or target. So should group the data by source and target both
    var nest3 = d3.nest()
        .key((d)=>d.source)
        .entries(onlyCSEedges_final)

    var nest4 = d3.nest()
        .key((d)=>d.target)
        .entries(onlyCSEedges_final)

//if write the "id=source=target" in this loop, it will be refresh by the front loop, so write it outside. Think more to find an easy way to do it.
    CSE.values.forEach( (value) => {
        value.cooNum = 0;
        for (i=0;i<nest3.length;i++){
            for (j=0;j<nest4.length;j++){
                if (value.id === parseInt(nest3[i].key)) {
                    value.cooNum = nest3[i].values.length
                }
                if (value.id === parseInt(nest4[j].key)) {
                    value.cooNum = nest4[j].values.length
                }}
            }});

    for(k=0;k<CSE.values.length;k++){
       for (i=0;i<nest3.length;i++){
            for (j=0;j<nest4.length;j++){
                if (CSE.values[k].id === parseInt(nest3[i].key) && nest3[i].key === nest4[j].key){
                    CSE.values[k].cooNum = nest3[i].values.length+nest4[j].values.length
                }}}}

//add svg
    var link = svg.append("g")
        .attr("class", "edges")
        .selectAll("line")
        .data(onlyCSEedges_final)
        .enter().append("line")
        .attr("class","node-line")
        .attr("stroke-width", 2 )
        .on("mouseover", (d)=> {
            activeSource = d.source.index;
            activeTarget = d.target.index;
            d3.selectAll("#matrix .cell")
                .classed("active", function(d) {
                    if ( (activeSource == d.x && activeTarget == d.y) || (activeSource == d.y && activeTarget == d.x)) return true;
                    else return false;
                })
            d3.selectAll("#chart .node-line")
                .attr("stroke-width", function(d) {
                    if ( activeSource == d.source.index && activeTarget == d.target.index) return 5;
                    else return false;
                })})
        .on("mouseout", ()=> {
            d3.selectAll("#matrix .cell").classed("active",false);
            d3.selectAll("#chart .node-line").attr("stroke-width",2);

        });

//radius is the cooperation number
    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(CSE.values)
        .enter().append("circle")
        .attr("r", (d)=>d.cooNum)
        .attr("fill", (d) =>  color(d.label))
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

//title use label
    node.append("title")
        .text((d) => d.label);

    simulation
        .nodes(CSE.values)
        .on("tick", ticked);

    simulation.force("edge")
        .links(onlyCSEedges_final);

    function ticked() {
        link
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) =>  d.target.x)
            .attr("y2", (d) =>  d.target.y);

        node
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y);
    }
});

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}