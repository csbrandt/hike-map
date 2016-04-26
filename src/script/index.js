var Handlebars = require('handlebars');
var point = require('turf-point');
var featureCollection = require('turf-featurecollection');
var mapboxgl = require('mapbox-gl');
var algoliasearch = require('algoliasearch');
var algoliasearchHelper = require('algoliasearch-helper');
var autocomplete = require('../node_modules/autocomplete.js/dist/autocomplete.js');
var suggestionTemplateText = require('../template/suggestion.html');
var client = algoliasearch('I5YMQQ8937', '50fa2c1a43ffa2fff2d98c02e6a7a30f');
var relations = client.initIndex('trail-relation');
var algoliaHelper = algoliasearchHelper(client, 'trail-relation');
var IP_SEARCH_RADIUS = 50000;

mapboxgl.accessToken = 'pk.eyJ1IjoiY3NicmFuZHQiLCJhIjoiUlRLbnBiRSJ9.T3maqaJkctB_3-BU0PGVTw';

var map = new mapboxgl.Map({
   container: 'map-canvas',
   center: [-104.055604, 41.011341],
   zoom: 5,
   style: 'mapbox://styles/csbrandt/cindqwsbh000rahm6os41f7as'
});

var markers = [];
var bounds = new mapboxgl.LngLatBounds();

map.addControl(new mapboxgl.Navigation({
   position: 'top-left'
}));

algoliaHelper.setQueryParameter('aroundLatLngViaIP', true);
algoliaHelper.setQueryParameter('aroundRadius', IP_SEARCH_RADIUS).search();

algoliaHelper.on('result', function(result) {
   result.hits.forEach(function(hit) {
      markers.push(point([hit._geoloc.lng, hit._geoloc.lat], hit));
      bounds.extend([hit._geoloc.lng, hit._geoloc.lat]);
   });

   if (markers.length) {
      map.fitBounds(bounds);
   }

   map.on('load', function() {
      addMarkers(map, markers, 'ip-geoloc-markers');
   });
});

autocomplete('#search', { hint: false }, [{
   source: autocomplete.sources.hits(relations, {
      hitsPerPage: 5
   }),
   displayKey: 'name',
   templates: {
      suggestion: Handlebars.compile(suggestionTemplateText)
   }
}]).on('autocomplete:selected', function(event, suggestion, dataset) {
   // add destination marker
   addMarkers(map, [point([suggestion._geoloc.lng, suggestion._geoloc.lat], suggestion)], 'destination-marker');

   // goto destination
   map.flyTo({
      center: [suggestion._geoloc.lng, suggestion._geoloc.lat],
      zoom: 14
   });
});

function addMarkers(map, markers, id) {
   if (map.getSource(id)) {
      map.removeSource(id);
   }

   map.addSource(id, {
      'type': 'geojson',
      'data': featureCollection(markers)
   });

   map.addLayer({
      'id': id,
      'type': 'symbol',
      'source': id,
      'layout': {
         'icon-image': 'marker-15',
         'text-field': '{name}',
         'text-font': ['DIN Offc Pro Bold'],
         'text-offset': [0, 0.6],
         'text-anchor': 'top'
      }
   });
}
