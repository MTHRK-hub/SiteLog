(function () {
  var canvas = document.getElementById('globe-canvas');
  if (!canvas) return;

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = cb;
    document.head.appendChild(s);
  }

  loadScript('https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js', function () {
    loadScript('https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js', function () {
      if (typeof d3 === 'undefined') return;
      initGlobe();
    });
  });

  function initGlobe() {
    var ctx = canvas.getContext('2d');
    var SIZE = 80, DPR = window.devicePixelRatio || 2;
    canvas.width = SIZE * DPR;
    canvas.height = SIZE * DPR;
    ctx.scale(DPR, DPR);

    var projection = d3.geoOrthographic()
      .scale(SIZE / 2 - 2)
      .translate([SIZE / 2, SIZE / 2])
      .clipAngle(90);

    var path = d3.geoPath(projection, ctx);
    var land, countries;
    var graticule = d3.geoGraticule10();
    var SPHERE = { type: 'Sphere' };
    var lambda = 0, phi = -8;

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
      .then(function (res) { return res.json(); })
      .then(function (topo) {
        countries = topojson.feature(topo, topo.objects.countries);
        land = topojson.merge(topo, topo.objects.countries.geometries);
      })
      .catch(function () {});

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE);
      projection.rotate([lambda, phi, 0]);

      ctx.beginPath();
      path(SPHERE);
      ctx.fillStyle = '#0a1e42';
      ctx.fill();

      ctx.beginPath();
      path(graticule);
      ctx.lineWidth = 0.4;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.stroke();

      if (countries) {
        ctx.beginPath();
        path(countries);
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();
      }

      if (land) {
        ctx.beginPath();
        path(land);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
      }

      ctx.beginPath();
      path(SPHERE);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.stroke();
    }

    var last = performance.now();
    function tick(now) {
      var dt = (now - last) / 1000;
      last = now;
      lambda = (lambda + dt * 45) % 360;
      draw();
      requestAnimationFrame(tick);
    }
    draw();
    requestAnimationFrame(tick);
  }
})();
