// create svg canvas //
const svg = d3
  .select(".vis-container")
  .append("svg")
  .attr("class", "svg-container")
  .attr("width", 960)
  .attr("height", 600);

// .geoPath() is the D3 Geo Path Data Generator helper class for generating svg path instructions from GeoJSON data (counties.json)... this will be called later
const path = d3.geoPath();

// scale for the key
var x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);

// set color range

// scaleThreshold maps continuous numeric input to discrete values defined by the range
// n-1 domain split points are specified where n is the number of range values
const color = d3
  .scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1 - 2.6) / 8)) // d3 is generating a range of 8 colours using the color scheme specified below
  .range(d3.schemeBlues[9]);

// create key
var g = svg
  .append("g")
  .attr("class", "key")
  .attr("id", "legend")
  .attr("transform", "translate(0,40)");

// this maps the colors to the rect elements
// then creates the rect element for each color in the key
g.selectAll("rect")
  .data(
    color.range().map((d) => {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    })
  )
  .enter()
  .append("rect")
  .attr("height", 16)
  .attr("x", (d) => x(d[0]))
  .attr("width", (d) => x(d[1]) - x(d[0]))
  .attr("fill", (d) => color(d[0]));
// add text to key
g.append("text")
  .attr("class", "caption")
  .attr("x", x.range()[0])
  .attr("y", -12);

// create axis for key
g.call(
  d3
    .axisBottom(x)
    .tickSize(13)
    .tickFormat((x) => {
      return Math.round(x) + "%";
    })
    .tickValues(color.domain())
)
  .select(".domain")
  .remove();

// raw data...
const educationData =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
// svg coordinates (GeoJSON data)
const countiesData =
  "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

// load both JSON files and await their loading
const queue = async () => {
  const [first, second] = await Promise.all([
    d3.json(countiesData),
    d3.json(educationData),
  ]);
  return [first, second];
};

queue().then((data, err) => {
  if (err) throw err;
  const [countiesData, educationData] = [data[0], data[1]];

  // create tooltip
  const tooltip = d3
    .select("#tooltip-container")
    .append("div")
    .style("opacity", 0);

  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path") // adding path for all data points, like adding "rect"
    .data(
      topojson.feature(countiesData, countiesData.objects.counties).features // convert topojson data to geojson data
    )
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => {
      var result = educationData.filter((obj) => {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      //could not find a matching fips id in the data
      console.log("could find data for: ", d.id);
      return 0;
    })
    .attr("fill", (d) => {
      var result = educationData.filter((obj) => {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return color(result[0].bachelorsOrHigher);
      }
      //could not find a matching fips id in the data
      return color(0);
    })
    .attr("d", path)
    // data to be displayed in tooltip
    // county:: data.area_name, state:: data.state, percent:: data.bachelorsOrHigher
    .on("mouseover", (d) => {
      tooltip.style("opacity", 0.9);
      tooltip.attr("id", "tooltip");
      tooltip.html(() => {
        var result = educationData.filter((obj) => {
          return obj.fips == d.id;
        });
        if (result[0]) {
          return (
            result[0]["area_name"] +
            ", " +
            result[0]["state"] +
            ": " +
            result[0].bachelorsOrHigher +
            "%"
          );
        }
        //could not find a matching fips id in the data
        return 0;
      });
      // tooltip.attr("data-education", result[0].bachelorsOrHigher);
    })
    .attr("data-education", (d) => {
      const result = educationData.filter((obj) => {
        return obj.fips == d.id;
      });
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      //could not find a matching fips id in the data
      return 0;
    })
    .style("left", 10 + "px")
    .style("top", 28 + "px")
    .on("mouseout", (d) => {
      tooltip.style("opacity", 0);
    });
});

svg
  .append("path")
  .datum(
    topojson.mesh(countiesData, countiesData.states, (a, b) => {
      return a !== b;
    })
  )
  .attr("class", "states")
  .attr("d", path);

// attribution for overall code structure: freeCodeCamp https://codepen.io/freeCodeCamp/full/EZKqza
