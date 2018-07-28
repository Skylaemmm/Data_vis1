// set whole width and height, x&y label text, colors

var margin = { top: 50, right: 0, bottom: 100, left: 50 },
    width = 960 - margin.left - margin.right,
    height = 660 - margin.top - margin.bottom,
    gridSize = Math.floor(width / 20),
    gridStep = gridSize + 10,
    legendElementWidth = 50,
    colors = ["#ffff99","#ffcc00","#ff9900","#ff6600","#ff3300","#990033"],
    months = ["Jan", "Feb", "March", "Apr", "May", "Jun", "July","Aug","Sep","Oct","Nov","Dec"],
    years = d3.range(1997,2007);

var svg = d3.select("#chart").append("svg")
    .attr("width", width )
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//set year(y) label
svg.selectAll(".yearLabel")
    .data(years)
    .enter().append("text")
    .text((d) => d )
    .attr("x", 0)
    .attr("y", (d, i)=> i * gridStep )
    .style("text-anchor", "end")
    .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
    .attr("class", "yearLabel labels");

//set month(x) label
svg.selectAll(".monthLabel")
    .data(months)
    .enter().append("text")
    .text((d) => d)
    .attr("x", (d, i) => i * gridStep )
    .attr("y", 0)
    .style("text-anchor", "middle")
    .attr("transform", "translate(" + gridSize / 2 + ", -6)")
    .attr("class", "monthLabel labels");

//add tooltips
var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

//set the heatmap, import csv file
d3.csv("../temperature_monthly.csv", (error, data) =>{
    if(error) throw error;

            var colorScale = d3.scale.quantile()
                .domain([0, d3.max(data, (d) => d.max_temperature )])
                .range(colors);

//get the value from select
            var category = d3.select('#category').property('value');
            d3.select("#category")
                .on('change', function(){
                durations = 750;
                update(this.value)
            });

            update(category);

//use function to control the display of min and max temperature
            function update(select) {
            var cards = svg.selectAll(".tem")
                .data(data, (d) => d.year+':'+d.month);

            cards.enter().append("rect")
                .attr("x", (d) => (d.month -1) * gridStep )
                .attr("y", (d) => (d.year - 1997) * gridStep )
                .attr("width", gridSize)
                .attr("height", gridSize)

//add mouseover event to show tooltips
                .on("mouseover", (d) =>{
                    div.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    div.html("Date:" + d.date + ";Min:" + d.min_temperature + ";Max:" + d.max_temperature)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY) + "px");
                })
                .on("mouseout", () =>{
                    div.transition()
                        .duration(500)
                        .style("opacity",0)
                });
//add transition animation
            cards.transition().duration(1000)
                .style("fill", (d) => colorScale(d[select]));

//add legend
            var legend = svg.selectAll(".legend")
                .data([0].concat(colorScale.quantiles()), (d) => d );

            legend.enter().append("g")
                .attr("class", "legend");

            legend.append("rect")
                .attr("x", (d, i) => legendElementWidth * i )
                .attr("y", height+ margin.top)
                .attr("width", legendElementWidth)
                .attr("height", gridSize / 2)
                .style("fill", (d, i) => colors[i] );

            legend.append("text")
                .attr("class", "labels")
                .text((d) => Math.round(d) )
                .attr("x", (d, i) =>  (legendElementWidth * i) )
                .attr("y", height + margin.top + gridSize);
        };
});


