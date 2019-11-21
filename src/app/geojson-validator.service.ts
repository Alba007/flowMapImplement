import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeojsonValidatorService {
  definitions = {};

  geoTypes = {
    'Point': this.isPoint,
    'Polygon': this.isPolygon,
    'MultiPolygon': this.isMultiPolygon,
  };

  nonGeoTypes = {};
  constructor() { }


 
  static isFunction(object) {
    return typeof (object) === 'function'
  }

  static isObject(object) {
    return object === Object(object)
  }

  _done(cb, message) {
    let valid = false;
    if (typeof message === 'string') {
      message = [message]
    } else if (Object.prototype.toString.call(message) === '[object Array]') {
      if (message.length === 0) {
        valid = true
      }
    } else {
      valid = true
    }
    if (GeojsonValidatorService.isFunction(cb)) {
      if (valid) {
        cb(valid, [])
      } else {
        cb(valid, message)
      }
    }
    return valid;
  }

  _customDefinitions(type, object) {
    let errors;

    if (GeojsonValidatorService.isFunction(this.definitions[type])) {
      try {
        errors = this.definitions[type](object)
      } catch (e) {
        errors = ['Problem with custom definition for ' + type + ': ' + e]
      }
      if (Object.prototype.toString.call(errors) === '[object Array]') {
        return errors
      }
    }
    return []
  }


  valid(geoJSONObject, cb) {
    if (!GeojsonValidatorService.isObject(geoJSONObject)) {
      return this._done(cb, ['must be a JSON Object'])
    } else {
      var errors = []
      if ('type' in geoJSONObject) {
        if (this.nonGeoTypes[geoJSONObject.type]) {
          return this.nonGeoTypes[geoJSONObject.type](geoJSONObject, cb)
        } else if (this.geoTypes[geoJSONObject.type]) {
          return this.geoTypes[geoJSONObject.type](geoJSONObject, cb)
        } else {
          errors.push('type must be one of: "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection", "Feature", or "FeatureCollection"')
        }
      } else {
        errors.push('must have a member with the name "type"')
      }
      // run custom checks
      errors = errors.concat(this._customDefinitions('GeoJSONObject', geoJSONObject))
      return this._done(cb, errors)
    }
  }

  isPosition(position, cb) {
    var errors = []
    // It must be an array
    if (Array.isArray(position)) {
      // and the array must have more than one element
      if (position.length <= 1) {
        errors.push('Position must be at least two elements')
      }
      position.forEach(function (pos, index) {
        if (typeof pos !== 'number') {
          errors.push('Position must only contain numbers. Item ' + pos + ' at index ' + index + ' is invalid.')
        }
      })
    } else {
      errors.push('Position must be an array')
    }
    // run custom checks
    errors = errors.concat(this._customDefinitions('Position', position))
    return this._done(cb, errors)
  }

  isPoint(point, cb) {
    if (!GeojsonValidatorService.isObject(point)) {
      return this._done(cb, ['must be a JSON Object'])
    }
    var errors = []
    if ('type' in point) {
      if (point.type !== 'Point') {
        errors.push('type must be "Point"')
      }
    } else {
      errors.push('must have a member with the name "type"')
    }
    if ('coordinates' in point) {
      this.isPosition(point.coordinates, function (valid, err) {
        if (!valid) {
          errors.push('Coordinates must be a single position')
        }
      })
    } else {
      errors.push('must have a member with the name "coordinates"')
    }
    // run custom checks
    errors = errors.concat(this._customDefinitions('Point', point))
    return this._done(cb, errors)
  }

  _linearRingCoor(coordinates, cb) {
    let errors = [];
    const that = this;
    if (Array.isArray(coordinates)) {
      // 4 or more positions
      coordinates.forEach(function (val, index) {
        that.isPosition(val, (valid, err) => {
          if (!valid) {
            // modify the err msg from 'isPosition' to note the element number
            err[0] = 'at ' + index + ': '.concat(err[0])
            // build a list of invalide positions
            errors = errors.concat(err)
          }
        })
      });
      // check the first and last positions to see if they are equivalent
      // TODO: maybe better checking?
      if (coordinates[0].toString() !== coordinates[coordinates.length - 1].toString()) {
        errors.push('The first and last positions must be equivalent')
      }
      if (coordinates.length < 4) {
        errors.push('coordinates must have at least four positions')
      }
    } else {
      errors.push('coordinates must be an array')
    }
    return this._done(cb, errors)
  }

  isPolygonCoor(coordinates, cb) {
    let errors = [];
    const that = this;
    if (Array.isArray(coordinates)) {
      coordinates.forEach(function (val, index) {
        that._linearRingCoor(val, function (valid, err) {
          if (!valid) {
            // modify the err msg from 'isPosition' to note the element number
            err[0] = 'at ' + index + ': '.concat(err[0])
            // build a list of invalid positions
            errors = errors.concat(err)
          }
        })
      })
    } else {
      errors.push('coordinates must be an array')
    }
    return this._done(cb, errors)
  }

  isPolygon(polygon, cb) {
    if (!GeojsonValidatorService.isObject(polygon)) {
      return this._done(cb, ['must be a JSON Object'])
    }
    let errors = [];
    const that = this;
    if ('type' in polygon) {
      if (polygon.type !== 'Polygon') {
        errors.push('type must be "Polygon"')
      }
    } else {
      errors.push('must have a member with the name "type"')
    }
    if ('coordinates' in polygon) {
      that.isPolygonCoor(polygon.coordinates, function (valid, err) {
        if (!valid) {
          errors = errors.concat(err)
        }
      })
    } else {
      errors.push('must have a member with the name "coordinates"')
    }
    // run custom checks
    errors = errors.concat(this._customDefinitions('Polygon', polygon))
    return this._done(cb, errors)
  }

  isMultiPolygonCoor(coordinates, cb) {
    var errors = [];
    const that = this;
    if (Array.isArray(coordinates)) {
      coordinates.forEach(function (val, index) {
        that.isPolygonCoor(val, function (valid, err) {
          if (!valid) {
            // modify the err msg from 'isPosition' to note the element number
            err[0] = 'at ' + index + ': '.concat(err[0])
            // build a list of invalide positions
            errors = errors.concat(err)
          }
        })
      })
    } else {
      errors.push('coordinates must be an array')
    }
    this._done(cb, errors)
  }


  isMultiPolygon(multiPolygon, cb) {
    if (!GeojsonValidatorService.isObject(multiPolygon)) {
      return this._done(cb, ['must be a JSON Object'])
    }

    let errors = [];
    const that = this;
    if ('type' in multiPolygon) {
      if (multiPolygon.type !== 'MultiPolygon') {
        errors.push('type must be "MultiPolygon"')
      }
    } else {
      errors.push('must have a member with the name "type"')
    }
    if ('coordinates' in multiPolygon) {
      that.isMultiPolygonCoor(multiPolygon.coordinates, function (valid, err) {
        if (!valid) {
          errors = errors.concat(err)
        }
      })
    } else {
      errors.push('must have a member with the name "coordinates"')
    }
    // run custom checks
    errors = errors.concat(this._customDefinitions('MultiPolygon', multiPolygon))
    return this._done(cb, errors)
  }
}
