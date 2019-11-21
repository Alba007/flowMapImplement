import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { latLng, tileLayer, Layer } from 'leaflet';
import '../FlowMap'
import { Papa } from 'ngx-papaparse';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  options = {
    layers: [
      tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, attribution: '...' })
    ], subdomains: 'abcd',
    maxZoom: 19,
    zoom: 3,
    center: latLng(40.762650, -26.337748)
  };
  nr=0
  layers: L.Layer[] = [];
   centerr="../assets/test.png"
    template= `
    <rg-gauge-chart [canvasWidth]="canvasWidth"
      [needleValue]="needleValue"
      [centralLabel]="centralLabel"
      [options]="options"
      [name]="name"
      [bottomLabel]="bottomLabel"
    ></rg-gauge-chart>`

  constructor(private papa: Papa) {
    this.layers = [];
  }
  ngOnInit() {

    this.createFlowMap()
     var drawnItems = new L.FeatureGroup();
        this.layers.push(drawnItems)
        var drawControl = new L.Control.Draw({
            edit: {
                featureGroup: drawnItems
            }
        });
        // this.layers.addControl(drawControl);
 
  }
  createFlowMap() {
    var csv_file = "../assets/csv-data";
    this.papa.parse(csv_file, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        //pikat
        console.log(results)
        var geoJsonFeatureCollection = {
          type: 'FeatureCollection',
          features: results.data.map(function (datum) {
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [datum.s_lon, datum.s_lat]
              },
              properties: datum
            }
          })
        }
        
        var lay = (L as any).canvasFlowmapLayer(geoJsonFeatureCollection, {
          originAndDestinationFieldIds: {
            originUniqueIdField: 's_city_id',
            originGeometry: {
              x: 's_lon',
              y: 's_lat'
            },
            destinationUniqueIdField: 'e_city_id',
            destinationGeometry: {
              x: 'e_lon',
              y: 'e_lat'
            }
          },
          canvasBezierStyle: {
            type: 'simple',
            symbol: {
              // use canvas styling options (compare to CircleMarker styling below)
              strokeStyle: 'blue',
              lineWidth: 5,
              lineCap: 'round',
              shadowColor: 'rgb(255, 0, 51)',
              shadowBlur: 1.5
            }
          },
          pathDisplayMode: 'selection',
          animationStarted: true,
          animationEasingFamily: 'Cubic',
          animationEasingType: 'In',
          animationDuration: 2
        });
        this.layers.push(lay);
        // this.layers.forEach(function (layer) {
        //   layer.setAnimationEasing('Cubic', 'In');
        //   layer.playAnimation();
        //   layer.setAnimationDuration(2000);
        //   layer.canvasBezierStyle.shadowColor='red'
          
        //   layer.on('click', (l) => {
        //     if (l.layer.feature.properties.isOrigin) {
        //       lay.selectFeaturesForPathDisplayById('s_city_id', l.layer.feature.properties.s_city_id, true, 'SELECTION_NEW');
        //       layer.bindPopup("New Origin!", { maxHeight: 200, width: 600, closeOnClick: true })
        //     } 
        //     else {
        //       layer.bindPopup("You must select an origin!", { maxHeight: 200, width: 600 ,closeOnClick: true })
        //     }
        //   });
          lay.selectFeaturesForPathDisplayById('s_city_id', 562, true, 'SELECTION_NEW');
        // });
      }
    })
  }
}