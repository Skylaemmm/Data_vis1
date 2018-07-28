var margin = {top: 120, right: 180, bottom: 100, left: 80},
    width = 750,
    height = 750;

var x = d3.scale.ordinal().rangeBands([0, width]),
    z = d3.scale.linear(),
    colors = d3.scale.category20c();

var svg_matrix = d3.select("#matrix").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", margin.left + "px")
    .append("g")
    .attr("transform", "translate(" + margin.right + "," + margin.top+ ")");

d3.json("HKUST_coauthor_graph.json", (error, graph) => {
    if (error) throw error;

//just copy from node-link.js to get the treated data
    var dept = d3.nest()
        .key((d) => d.dept)
        .entries(graph.nodes);

    var CSE = dept[1];

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
    var CSEedge_target = d3.nest()
        .key((d)=>d.target)
        .entries(only_cseedge);

    var only_cseedge_2 = [];
    for (var n = 0; n < CSEedge_target.length; n++) {
        for (var i = 0; i < CSEid.length; i++) {
            if (parseInt(CSEedge_target[n].key) === CSEid[i]) {
                only_cseedge_2 = only_cseedge_2.concat(CSEedge_target[n].values)
            }}};

    var nest1 = d3.nest()
        .key((d) => d.target)
        .entries(only_cseedge_2)

    var only_cseedge_3 = [];
    for (var i = 0; i < nest1.length; i++) {
        if ((i != 9) && (i != 13) && (i != 30)) {
            only_cseedge_3 = only_cseedge_3.concat(nest1[i].values)
        }};

    var nest2 = d3.nest()
        .key((d) => d.source)
        .entries(only_cseedge_3)

    var onlyCSEedges_final = [];
    for (var i = 0; i < nest2.length; i++) {
        if ((i != 16) && (i != 28)) {
            onlyCSEedges_final = onlyCSEedges_final.concat(nest2[i].values)
        }};

//use matrix to represent the cell
    var matrix = [],
        nodes = CSE.values,
        links = onlyCSEedges_final,
        n = nodes.length;

    nodes.forEach( (node,i) => {
        node.index = i;
        matrix[i] = d3.range(n).map((j) => {
            return {x: j, y: i, z: 0};
        })});

//convert links to matrix, use index tp represent id. And for each link matrix, add a number(4) to display
    links.forEach((link)=> {

        for (var i=0; i<n;i++){
            if (link.source === nodes[i].id)
                link.source = nodes[i].index
        }

        for (var j=0; j<n; j++){
            if (link.target === nodes[j].id)
                link.target = nodes[j].index
        }
        matrix[link.source][link.target].z = 4;
        matrix[link.target][link.source].z = 4;
    })

//precompute the orders
    var orders = {
        label: d3.range(n).sort((i, j) => nodes[i].index - nodes[j].index )
    };
    x.domain(orders.label);

//add svg
    svg_matrix.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    var row = svg_matrix.selectAll(".row")
        .data(matrix)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", (d, i)=> "translate(0," + x(i) + ")")
        .each(row);

//add an line to separate each row
    row.append("line")
        .attr("class","matrixLine")
        .attr("x2", width);

//add text use label here
    row.append("text")
        .attr("x", -6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "end")
        .text((d, i) => nodes[i].label);

    var column = svg_matrix.selectAll(".column")
        .data(matrix)
        .enter().append("g")
        .attr("class", "column")
        .attr("transform", (d, i) => "translate(" + x(i) + ")rotate(-90)");

    column.append("line")
        .attr("class","matrixLine")
        .attr("x1", -width);

    column.append("text")
        .attr("x", 6)
        .attr("y", x.rangeBand() / 2)
        .attr("dy", ".32em")
        .attr("text-anchor", "start")
        .text((d, i) => nodes[i].label);

//add cell based on the links , fill color is related to hte publication number
    function row(row) {
        var cell = d3.select(this).selectAll(".cell")
            .data(row.filter((d)=> d.z))
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", (d)=> x(d.x))
            .attr("width", x.rangeBand())
            .attr("height", x.rangeBand())
            .style("fill-opacity", (d)=>  z(d.z))
            .style("fill", (d) =>  colors(links[d.x].publications.length))
            .on("mouseover", mouseover)
            .on("mouseout", mouseout);

    }

//when hover the cell, the text will become grey
    function mouseover(p) {
        d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
        d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
    }

    function mouseout() {
        d3.selectAll("text").classed("active", false);
    }


})
