var margin = { top: 25, right: 0, bottom: 20, left: 50 },
    width = 1550 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom,
    gridWidth = Math.floor(width / 20),
    gridWithStep = gridWidth +10  ,
    gridHeight = Math.floor(height/12),
    gridHeightStep = gridHeight +10,
    legendElementWidth = 50,
    colors = ["#ffff99","#ffcc00","#ff9900","#ff6600","#ff3300","#990033"],
    months = ["Jan", "Feb", "March", "Apr", "May", "Jun", "July","Aug","Sep","Oct","Nov","Dec"],
    years = d3.range(1997,2007)

var svg = d3.select("#chart").append("svg")
    .attr("width", width )
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//set year(y) label
svg.selectAll(".yearLabel")
    .data(years)
    .enter().append("text")
    .text((d) => d )
    .attr("x", 0)
    .attr("y", (d, i)=> i * gridHeightStep )
    .style("text-anchor", "end")
    .attr("transform", "translate(-6," + gridHeight/2 + ")")
    .attr("class", "label");

//set month(x) label
svg.selectAll(".monthLabel")
    .data(months)
    .enter().append("text")
    .text((d) => d)
    .attr("x", (d, i) => i * gridWithStep )
    .attr("y", 0)
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + gridWidth / 2 + ", -6)")
    .attr("class", "label");

//add tooltips
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

//set the heatmap, import csv file
d3.csv("../temperature_daily_new.csv",(error,data)=> {

    var colorScale = d3.scale.quantile()
        .domain([0, 40])
        .range(colors);

//get each month data
    var nest = d3.nest()
        .key((d) => d.year_month)
        .entries(data)

//line chart x label and y label
    var x = d3.time.scale().range([0, gridWidth]);
    var y = d3.time.scale().range([gridHeight, 0]);

//important! set the data/time format
    var parseTime = d3.time.format("%Y/%m/%d");

//decide to use append("line") in the svg to make the html like <rect><<line></line><line></line></rect>. Do no know why it is not work. Code in the test file. Try to think about it.
//use a stupid way to fix it first.
    function draw(nest,time) {

        var eachData = nest[time].values;

        var minTemperature = d3.svg.line()
            .x( (d) => x(parseTime.parse(d.date)))
            .y( (d) => y(d.min_temperature));

        var maxTemperature = d3.svg.line()
            .x( (d) => x(parseTime.parse(d.date)))
            .y( (d) => y(d.max_temperature));

//set the x,y for each line chart. Low-quality code. Try to use another way.
        var translateX =[];
        for (var n=0; n< 12;n++) translateX[n]=0;
        for (var n=12; n< 24 ;n++) translateX[n]=1;
        for (var n=24; n< 36;n++) translateX[n]=2;
        for (var n=36; n< 48;n++) translateX[n]=3;
        for (var n=48; n< 60;n++) translateX[n]=4;
        for (var n=60; n< 72;n++) translateX[n]=5;
        for (var n=72; n< 84;n++) translateX[n]=6;
        for (var n=84; n< 96;n++) translateX[n]=7;
        for (var n=96; n< 108;n++) translateX[n]=8;
        for (var n=108; n< 120;n++) translateX[n]=9;

        var translateY=[];
        for (var n=0; n< 12;n++) translateY[n]=n;
        for (var n=12; n< 24 ;n++) translateY[n]=n-12;
        for (var n=24; n< 36;n++) translateY[n]=n-24;
        for (var n=36; n< 48;n++) translateY[n]=n-36;
        for (var n=48; n< 60;n++) translateY[n]=n-48;
        for (var n=60; n< 72;n++) translateY[n]=n-60;
        for (var n=72; n< 84;n++) translateY[n]=n-72;
        for (var n=84; n< 96;n++) translateY[n]=n-84;
        for (var n=96; n< 108;n++) translateY[n]=n-96;
        for (var n=108; n< 120;n++) translateY[n]=n-108;

//here set the highest temperature 40
        x.domain((d3.extent(eachData, (d) => parseTime.parse(d.date))));
        y.domain([0, 40])

        svg.append("path")
            .attr("transform","translate(" + translateY[time] * gridWithStep + ","+ translateX[time]* gridHeightStep +")" )
            .attr("class","line min")
            .attr("d", minTemperature(eachData));

        svg.append("path")
            .attr("transform","translate(" + translateY[time] * gridWithStep + ","+ translateX[time]* gridHeightStep +")" )
            .attr("class","line max")
            .attr("d", maxTemperature(eachData));
    }


//chart layout same as level1
    var charts = svg.selectAll(".tem")
        .data(data);

    charts.enter().append("rect")
        .attr("class","rect")
        .attr("x", ((d) => (d.month -1) * gridWithStep))
        .attr("y", ((d) => (d.year -1997) * gridHeightStep))
        .attr("width", gridWidth)
        .attr("height", gridHeight)
        .on("mouseover", (d) =>{
            div.transition()
                .duration(200)
                .style("opacity", 0.9);
            div.html("Date:" + d.year_month + ";Min:" + d.min_temperature + ";Max:" + d.max_temperature)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseout", () =>{
            div.transition()
                .duration(500)
                .style("opacity",0)
        })


    charts.transition().duration(1000)
        .style("fill", (d) => colorScale(d.min_temperature));

    var legend = svg.selectAll(".legend")
        .data([0].concat(colorScale.quantiles()), (d) => d );

    legend.enter().append("g")
        .attr("class", "legend");

    legend.append("rect")
        .attr("x", 1100 )
        .attr("y",  (d, i) => legendElementWidth * i + margin.top)
        .attr("width", legendElementWidth)
        .attr("height", legendElementWidth)
        .style("fill", (d, i) => colors[i] );

    legend.append("text")
        .attr("class", "mono")
        .text((d) => Math.round(d) )
        .attr("x", 1100 + legendElementWidth )
        .attr("y",  (d, i) => legendElementWidth * i + margin.top)


    var i ;
    for (i = 0; i <120; i++){
        draw(nest,i)
    }

})