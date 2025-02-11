/*
 * Copyright 2003-2006, 2009, 2017, 2020 United States Government, as represented
 * by the Administrator of the National Aeronautics and Space Administration.
 * All rights reserved.
 *
 * The NASAWorldWind/WebWorldWind platform is licensed under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License
 * at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * NASAWorldWind/WebWorldWind also contains the following 3rd party Open Source
 * software:
 *
 *    ES6-Promise – under MIT License
 *    libtess.js – SGI Free Software License B
 *    Proj4 – under MIT License
 *    JSZip – under MIT License
 *
 * A complete listing of 3rd Party software notices and licenses included in
 * WebWorldWind can be found in the WebWorldWind 3rd-party notices and licenses
 * PDF found in code  directory.
 */
/**
 * @exports RayIntersectable
 */
define(['../error/ArgumentError',
    '../util/Logger',
    '../geom/Line',
    '../geom/Vec3',
    '../util/WWMath'],
function (ArgumentError,
          Logger,
          Line,
          Vec3,
          WWMath) {
    "use strict";

    /**
     * Constructs a ray intersectable interface.
     * @alias RayIntersectable
     * @constructor
     * @classdesc Defines an interface for shapes that can be intersected by a ray.
     * Provides common functionality for intersection testing while allowing shapes
     * to implement their own specific intersection logic.
     */
    var RayIntersectable = function () {
    };

    /**
     * Computes intersection between a ray and this shape.
     * @param {DrawContext} dc The current draw context
     * @param {Vec3} pickPoint The screen point in question
     * @throws {ArgumentError} If the dc or pickPoint parameters are null or undefined
     * @returns {Object} An object containing intersection details:
     *         {Vec3} point - The intersection point in world coordinates
     *         {Number} distance - Distance from ray origin to intersection
     *         Returns null if no intersection
     */
    RayIntersectable.prototype.computeIntersection = function (dc, pickPoint) {
        if (!dc) {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, "RayIntersectable", 
                    "computeIntersection", "missingDc"));
        }
        if (!pickPoint) {
            throw new ArgumentError(
                Logger.logMessage(Logger.LEVEL_SEVERE, "RayIntersectable", 
                    "computeIntersection", "missingPoint"));
        }

        if (!this.enabled) {
            return null;
        }

        // Check if object is in view - following Tessellator's pattern
        if (dc.globe.projectionLimits && 
            !this.sector.overlaps(dc.globe.projectionLimits)) {
            return null;
        }

        // Create ray in world coordinates
        var ray = WWMath.computeRayFromScreenPoint(dc, pickPoint);

        // Check bounding volume first if available
        if (this.extent && !this.extent.intersectsRay(ray)) {
            return null;
        }

        // Transform to local coordinates if we have a reference point
        var localRay = ray.clone();
        if (this.referencePoint) {
            localRay.origin.subtract(this.referencePoint);
        }

        // Let implementing classes do their specific intersection testing
        var intersection = this.doComputeIntersection(dc, localRay);
        if (!intersection) {
            return null;
        }

        // Transform intersection point back to world coordinates
        if (this.referencePoint) {
            intersection.point.add(this.referencePoint);
        }

        return intersection;
    };

    /**
     * Protected method that derived classes must implement with their
     * specific intersection testing logic.
     * @protected
     * @param {DrawContext} dc The current draw context
     * @param {Line} ray The ray to test against in local coordinates
     * @returns {Object} An object containing:
     *         {Vec3} point - The intersection point in local coordinates
     *         {Number} distance - Distance from ray origin to intersection
     *         Returns null if no intersection
     */
    RayIntersectable.prototype.doComputeIntersection = function (dc, ray) {
        throw new Error('Method not implemented');
    };

    /**
     * Determines if this shape's geometry might intersect a ray.
     * Default implementation uses the shape's extent if available.
     * Shapes can override this for more precise testing.
     * @protected
     * @param {DrawContext} dc The current draw context
     * @param {Line} ray The ray to test
     * @returns {Boolean} true if the shape might intersect the ray
     */
    RayIntersectable.prototype.intersectsRay = function (dc, ray) {
        if (this.extent) {
            return this.extent.intersectsRay(ray);
        }
        return true; // No bounds information available
    };

    return RayIntersectable;
});