'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Panorama = function () {
  // default selectors for AFRAME elements
  var CUBEMAP = 'a-entity[cubemap]';
  var CUBEMAP_ATTR_KEYS = ['folder', 'name_map', 'edge_length'];
  var CAMERA = '[data-aframe-default-camera]';
  var VR_BUTTON = '.a-enter-vr';
  var VR_UNSUPPORTED_ATTR = 'data-a-enter-vr-no-webvr';

  // default settings
  var default_settings = {
    scene_class: 'panorama-viewer', // default scene element
    active_class: 'active', // added after loading panorama
    auto_start: true, // start the pano without further interaction
    auto_rotate: false, // turn auto rotate on by default
    auto_rotate_speed: 3, // amount of px to move per second
    auto_rotate_direction: 'left', // control rotation diretion, either 'left' or 'right'
    full_rotation_time: null, // overwrites auto_rotate_speed and instead allows you to set time in [s] for a full rotation
    init: null, // custom callback executed right after init
    pause_on_hover: false, // auto pause rotation on hover

    cubemap_folder: '/img/panorama/cube/', // folder where aframe will try to locate images
    cubemap_name_map: 'negx=l posx=r negy=d posy=u negz=b posz=f', // file name map which will be used to fetch images (inside "cubemap_folder")
    cubemap_edge_length: 5000 // size of cube
  };

  return function () {
    function Panorama(selector) {
      var settings = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _classCallCheck(this, Panorama);

      this.settings = Object.assign({}, default_settings, settings);
      this.selector = selector;
      this.container = document.querySelector(selector);

      this.container_settings_overwrite();

      if (this.settings.auto_start) {
        this.init();
      }
    }

    _createClass(Panorama, [{
      key: 'set_active',
      value: function set_active(active) {
        this.container.classList.toggle(this.settings.active_class, active);
      }
    }, {
      key: 'init',
      value: function init() {
        this.init_scene();
        this.set_active(true);
      }
    }, {
      key: 'container_settings_overwrite',
      value: function container_settings_overwrite() {
        var _this = this;

        var attr_map = {};
        Object.keys(this.container.attributes).forEach(function (attr) {
          name = _this.container.attributes[attr].name.replace(/-/g, '_');
          if (_this.settings.hasOwnProperty(name)) {
            attr_map[name] = _this.container.attributes[attr].value;
          } else if (_this.settings.hasOwnProperty('cubemap_' + name)) {
            attr_map['cubemap_' + name] = _this.container.attributes[attr].value;
          }
        });

        Object.keys(attr_map).forEach(function (attr) {
          var val = attr_map[attr];

          if (val === 'true') val = true;else if (val === 'false') val = false;else if (val === 'null') val = null;else if (val === '') {
            val = true;
          } else if (!isNaN(parseFloat(val)) && isFinite(val)) {
            val = parseFloat(val);
          }

          _this.settings[attr] = val;
        });
      }
    }, {
      key: 'cubemap_attr',
      value: function cubemap_attr() {
        var _this2 = this;

        var out = [];

        CUBEMAP_ATTR_KEYS.forEach(function (attr) {
          var cc_attr = attr.replace(/_[^_]/, function (m) {
            return m.replace(/[_]+/, "").toUpperCase();
          });

          out.push(cc_attr + ': ' + _this2.settings['cubemap_' + attr] + ';');
        });

        return out.join(' ');
      }

      // build the scene for the panorama and inject it into the dom

    }, {
      key: 'init_scene',
      value: function init_scene() {
        var _this3 = this;

        var scene = document.createElement('a-scene');
        var entity = document.createElement('a-entity');
        var scene_class = this.settings.scene_class + '-scene';

        scene.classList.add(scene_class);
        entity.classList.add(this.settings.scene_class + '-cube');

        entity.setAttribute('cubemap', this.cubemap_attr());

        scene.appendChild(entity);
        this.container.appendChild(scene);

        // scene is defined here because we either need to listen to an event or
        // check if a property is set to be able to initialize the settings
        this.scene = this.container.querySelector('.' + scene_class);

        if (this.scene.hasLoaded) {
          this.init_settings();
        } else {
          this.listen(this.scene, 'loaded', function () {
            _this3.init_settings();
          });
        }
      }

      // initialize selectors and settings needed when scene is initialized

    }, {
      key: 'init_settings',
      value: function init_settings() {
        var _this4 = this;

        this.camera = this.container.querySelector(CAMERA);
        this.vr_button = this.container.querySelector(VR_BUTTON);
        this.cubemap = this.container.querySelector(CUBEMAP);

        if (this.vr_button.hasAttribute(VR_UNSUPPORTED_ATTR)) {
          this.vr_button.parentNode.removeChild(this.vr_button);
        }

        if (this.settings.auto_rotate) {
          this.start_auto_rotate();
        }

        if (this.settings.pause_on_hover) {
          this.listen(this.scene, 'mouseenter', function () {
            return _this4.toggle_auto_rotate();
          });
          this.listen(this.scene, 'mouseleave', function () {
            return _this4.toggle_auto_rotate();
          });
        }

        if (typeof this.settings.init === 'function') {
          this.settings.init.call(this, this.container, this.camera);
        }
      }
    }, {
      key: 'start_auto_rotate',
      value: function start_auto_rotate() {
        if (!this.__auto_rotate_enabled) {
          this.prev_frame_ts = performance.now();
          this.__auto_rotate_enabled = true;

          this.auto_rotate(this.prev_frame_ts);

          return true;
        }

        return null;
      }
    }, {
      key: 'stop_auto_rotate',
      value: function stop_auto_rotate() {
        if (this.__auto_rotate_enabled) {
          this.__auto_rotate_enabled = false;

          return false;
        }

        return null;
      }

      // return true if started
      // return false if stopped
      // return null if nothing happened

    }, {
      key: 'toggle_auto_rotate',
      value: function toggle_auto_rotate() {
        if (this.__auto_rotate_enabled) {
          return this.stop_auto_rotate();
        } else {
          return this.start_auto_rotate();
        }
      }
    }, {
      key: 'auto_rotate',
      value: function auto_rotate(ts) {
        var _this5 = this;

        var _camera$components$ro = this.camera.components.rotation.data;
        var x = _camera$components$ro.x;
        var y = _camera$components$ro.y;
        var z = _camera$components$ro.z;


        this.camera.setAttribute('rotation', {
          x: x,
          y: Math.abs(y) > 360 ? 0 : y + this.px_per_frame(ts),
          z: z
        });

        if (this.__auto_rotate_enabled) {
          requestAnimationFrame(function (ts) {
            return _this5.auto_rotate(ts);
          });
        }
      }
    }, {
      key: 'px_per_frame',
      value: function px_per_frame(ts) {
        var FPS = 1000 / (ts - this.prev_frame_ts);
        var out = 0;
        this.prev_frame_ts = ts;

        if (this.settings.full_rotation_time) {
          out = 360 / (FPS * this.settings.full_rotation_time);
        } else {
          out = 1 / FPS * this.settings.auto_rotate_speed;
        }

        return this.settings.auto_rotate_direction == 'left' ? out : out *= -1;
      }
    }, {
      key: 'listen',
      value: function listen(element) {
        for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          params[_key - 1] = arguments[_key];
        }

        element.addEventListener.apply(element, params);
      }
    }], [{
      key: 'settings',
      value: function settings(_settings) {
        Object.assign(default_settings, _settings);
      }
    }, {
      key: 'new',
      value: function _new() {
        for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          params[_key2] = arguments[_key2];
        }

        return new (Function.prototype.bind.apply(Panorama, [null].concat(params)))();
      }
    }]);

    return Panorama;
  }();
}();
