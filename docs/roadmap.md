<!-- Content -->
<div class="error-div"></div>
<div id="myRadar-div" class="radar-div"></div>
<div id="myRadar-tooltip" class="radar-tooltip"></div>

<!-- Scripts -->
<script src="https://d3js.org/d3.v6.min.js"></script>
<script type="module">

  function getFilename() {
    const urlParams = new URLSearchParams(window.location.search);
    let filename = urlParams.get("filename");
    if (filename === null) {
      filename = "roadmap.csv";
    }
    return filename;
  }

  import('./RadarPie/RadarPie.min.js')
  .catch(() => import('./RadarPie/RadarContainer.js'))
  .then((module) => {
    const svgDiv = document.getElementById("myRadar-div");

    // Get CSV data to load
    const filename = getFilename();

    // Load the CSV data
    module.init(filename).then((data) => {
      const radarContainer = new module.RadarContainer(data);
      radarContainer.appendTo(svgDiv);
    });
  });

</script>