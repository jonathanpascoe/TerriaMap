'use strict';

/*global require*/
var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var EasingFunction = require('../../third_party/cesium/Source/Core/EasingFunction');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var SceneTransforms = require('../../third_party/cesium/Source/Scene/SceneTransforms');

var screenSpacePos = new Cartesian2();
var offScreen = '-1000px';

var CesiumSelectionIndicator = function(cesium) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(cesium)) {
        throw new DeveloperError('cesium is required.');
    }
    //>>includeEnd('debug')

    this._cesium = cesium;
    this._screenPositionX = offScreen;
    this._screenPositionY = offScreen;
    this._tweens = cesium.scene.tweens;
    this._container = cesium.viewer.container;
    this._scale = 1;
    this._rotate = 0;

    /**
     * Gets or sets the world position of the object for which to display the selection indicator.
     * @type {Cartesian3}
     */
    this.position = undefined;

    /**
     * Gets or sets the visibility of the selection indicator.
     * @type {Boolean}
     */
    this.showSelection = false;

    knockout.track(this, ['position', '_screenPositionX', '_screenPositionY', '_scale', 'rotate', 'showSelection']);

    /**
     * Gets the visibility of the position indicator.  This can be false even if an
     * object is selected, when the selected object has no position.
     * @type {Boolean}
     */
    this.isVisible = undefined;
    knockout.defineProperty(this, 'isVisible', {
        get : function() {
            return this.showSelection && defined(this.position);
        }
    });

    knockout.defineProperty(this, '_transform', {
        get : function() {
            return 'scale(' + (this._scale) + ') rotate(' + this._rotate + 'deg)';
        }
    });

    /**
     * Gets or sets the function for converting the world position of the object to the screen space position.
     *
     * @member
     * @type {SelectionIndicatorViewModel~ComputeScreenSpacePosition}
     * @default SceneTransforms.wgs84ToWindowCoordinates
     *
     * @example
     * selectionIndicatorViewModel.computeScreenSpacePosition = function(position, result) {
     *     return Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position, result);
     * };
     */
    this.computeScreenSpacePosition = function(position, result) {
        return SceneTransforms.wgs84ToWindowCoordinates(cesium.scene, position, result);
    };

    var el = document.createElement('div');
    el.className = 'selection-indicator';
    el.setAttribute('data-bind', '\
style: { "top" : _screenPositionY, "left" : _screenPositionX, transform: _transform },\
css: { "selection-indicator-visible" : isVisible }');
    this._container.appendChild(el);
    this._selectionIndicatorElement = el;

    var img = document.createElement('img');
    img.setAttribute('src', 'images/NM-LocationTarget.svg');
    img.setAttribute('alt', '');
    img.setAttribute('width', 50);
    img.setAttribute('height', 50);
    el.appendChild(img);

    knockout.applyBindings(this, this._selectionIndicatorElement);
};

CesiumSelectionIndicator.prototype.destroy = function() {
    this._selectionIndicatorElement.parentNode.removeChild(this._selectionIndicatorElement);
};

/**
 * Updates the view of the selection indicator to match the position and content properties of the view model.
 * This function should be called as part of the render loop.
 */
CesiumSelectionIndicator.prototype.update = function() {
    if (this.showSelection && defined(this.position)) {
        var screenPosition = this.computeScreenSpacePosition(this.position, screenSpacePos);
        if (!defined(screenPosition)) {
            this._screenPositionX = offScreen;
            this._screenPositionY = offScreen;
        } else {
            var container = this._container;
            var containerWidth = container.parentNode.clientWidth;
            var containerHeight = container.parentNode.clientHeight;
            var indicatorSize = this._selectionIndicatorElement.clientWidth;
            var halfSize = indicatorSize * 0.5;

            screenPosition.x = Math.min(Math.max(screenPosition.x, -indicatorSize), containerWidth + indicatorSize) - halfSize;
            screenPosition.y = Math.min(Math.max(screenPosition.y, -indicatorSize), containerHeight + indicatorSize) - halfSize;

            this._screenPositionX = Math.floor(screenPosition.x + 0.25) + 'px';
            this._screenPositionY = Math.floor(screenPosition.y + 0.25) + 'px';
        }
    }
};

/**
 * Animate the indicator to draw attention to the selection.
 */
CesiumSelectionIndicator.prototype.animateAppear = function() {
    this._tweens.addProperty({
        object : this,
        property : '_scale',
        startValue : 2,
        stopValue : 1,
        duration : 0.8,
        easingFunction : EasingFunction.EXPONENTIAL_OUT
    });
    this._tweens.addProperty({
        object : this,
        property : '_rotate',
        startValue : -180,
        stopValue : 0,
        duration : 0.8,
        easingFunction : EasingFunction.EXPONENTIAL_OUT
    });
};

/**
 * Animate the indicator to release the selection.
 */
CesiumSelectionIndicator.prototype.animateDepart = function() {
    this._tweens.addProperty({
        object : this,
        property : '_scale',
        startValue : this._scale,
        stopValue : 1.5,
        duration : 0.8,
        easingFunction : EasingFunction.EXPONENTIAL_OUT
    });
};

defineProperties(CesiumSelectionIndicator.prototype, {
    /**
     * Gets the HTML element containing the selection indicator.
     * @memberof CesiumSelectionIndicator.prototype
     *
     * @type {Element}
     */
    container : {
        get : function() {
            return this._container;
        }
    },

    /**
     * Gets the HTML element that holds the selection indicator.
     * @memberof CesiumSelectionIndicator.prototype
     *
     * @type {Element}
     */
    selectionIndicatorElement : {
        get : function() {
            return this._selectionIndicatorElement;
        }
    },

    /**
     * Gets the scene being used.
     * @memberof CesiumSelectionIndicator.prototype
     *
     * @type {Scene}
     */
    scene : {
        get : function() {
            return this._scene;
        }
    }
});

/**
 * A function that converts the world position of an object to a screen space position.
 * @callback CesiumSelectionIndicator~ComputeScreenSpacePosition
 * @param {Cartesian3} position The position in WGS84 (world) coordinates.
 * @param {Cartesian2} result An object to return the input position transformed to window coordinates.
 * @returns {Cartesian2} The modified result parameter.
 */

module.exports = CesiumSelectionIndicator;
