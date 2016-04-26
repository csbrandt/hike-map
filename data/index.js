var fs = require('fs');
var turf = require('turf');
var worldCountries = require('world-countries');
var cityPointsUS = require('city-points-us');
var relations = require('./relations.json');

var indices = [];
var countryPoints = [];
var features;

// merge cityPointsUS with countryPoints
worldCountries.forEach(function(country) {
   var point = turf.point([country.latlng[1], country.latlng[0]]);
   point.properties.country = country.name.common;
   countryPoints.push(point);
});

features = turf.featurecollection(cityPointsUS.features.concat(countryPoints));

relations.elements.forEach(function(relation) {
   var index = {
      "_geoloc": {
         "lat": relation.center.lat,
         "lng": relation.center.lon
      }
   };
   var nearest = turf.nearest(turf.point([index._geoloc.lng, index._geoloc.lat]), features);
   index = Object.assign({}, index, nearest.properties);
   index.id = relation.id;
   index.name = relation.tags.name;

   indices.push(index);
});

fs.writeFileSync('./indices.json', JSON.stringify(indices));
