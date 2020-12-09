let vow_colors = null;
let seduced_colors = null;

const $container = d3.select("#colors_container");
const $vow_svg = d3.select("#colors_vow svg");
const $sed_svg = d3.select("#colors_seduced svg");

const square_side = 10;
const spacing = 0;
const svg_margin = 6;

function resize() {
	const w = $container.node().getBoundingClientRect().width;
	render((w - svg_margin)/2);
}

function render(w) {
	let row = Math.floor(w / (square_side + spacing));

	$vow_rect = $vow_svg.selectAll('rect');
	$sed_rect = $sed_svg.selectAll('rect');

	let h = Math.ceil(Math.max($vow_rect.size(), $sed_rect.size()) / row) * (square_side + spacing)

	$vow_svg
		.attr('width', w)
		.attr('height', h);
	$sed_svg
		.attr('width', w)
		.attr('height', h);

	$vow_rect
		.attr("x", function(d) {
			return (d.frame % row) * (square_side + spacing);
		})
		.attr("y", function(d) {
			return Math.floor(d.frame / row) * (square_side + spacing);
		});

	$sed_rect
		.attr("x", function(d) {
			return (d.frame % row) * (square_side + spacing);
		})
		.attr("y", function(d) {
			return Math.floor(d.frame / row) * (square_side + spacing);
		});
}

function avg(a,b){
  const regex=/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/ //regular expression to parse string
  a=regex.exec(a).slice(1)  //create array from string 'a' using regex
  b=regex.exec(b).slice(1)  //create array from string 'b' using regex
  let output=''
  for(let i=0;i<3;i++){
    const value=Math.floor(
       (
         parseInt(a[i],16) + //parse decimal from hexadecimal
         parseInt(b[i],16)   //parse decimal from hexadecimal
       )/2                   //perform averaging
     ).toString(16)          //convert back to hexadecimal
     output += (value.length<2?'0':'') + value //add leading zero if needed
  }
  return output
}

function init() {
	d3.csv("12-9-20_nxium/data/Vow_Frames.csv", function(data) {
		data = data.slice(0, 2087);
		d3.select("#colors_vow svg")
			.selectAll()
			.data(data)
			.enter()
			.append("rect")
			.attr("width", square_side)
			.attr("height", square_side)
			.style("fill", function(d) {
				return d.hex
			});
		resize();
	});

	d3.csv("12-9-20_nxium/data/Seduced_Frames.csv", function(data) {
		data = data.slice(0, 644);
		d3.select("#colors_seduced svg")
			.selectAll()
			.data(data)
			.enter()
			.append("rect")
			.attr("width", square_side)
			.attr("height", square_side)
			.style("fill", function(d) {
				return d.hex
			});
		resize();
	});

	window.addEventListener('resize', resize);
}

// Note: have to cut the frames off at (inclusive)...
// Vow - 2087
// Seduced - 643
// 
init();