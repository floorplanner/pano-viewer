'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Panorama = function () {
  // default selectors for AFRAME elements
  var CUBEMAP = 'a-entity[cubemap]';
  var CAMERA = '[data-aframe-default-camera]';
  var VR_BUTTON = '.a-enter-vr';
  var VR_UNSUPPORTED_ATTR = 'data-a-enter-vr-no-webvr';

  // whitelist 'attributes' in cubemap_folder_template attribute
  var whitelist = [];
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

    cubemap_folder: '/img/', // folder where aframe will try to locate images
    cubemap_folder_template: null, // overwrites cubemap_folder, allows custom named attr to be replaced within a set of curly braces: {{attr_name}}
    cubemap_name_map: null, // file name map which will be used to fetch images (inside "cubemap_folder")
    cubemap_edge_length: 5000 // size of cube
  };

  return function () {
    function Panorama(selector) {
      var settings = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      _classCallCheck(this, Panorama);

      this.selector = selector;
      this.container = document.querySelector(selector);

      this.settings({}, default_settings, settings, this.inline_settings(this.container));

      if (this.settings.auto_start) {
        this.init();
      }
    }

    _createClass(Panorama, [{
      key: 'settings',
      value: function settings(target) {
        for (var _len = arguments.length, objects = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          objects[_key - 1] = arguments[_key];
        }

        this.settings = Object.assign.apply(Object, [target].concat(objects));
      }
    }, {
      key: 'init',
      value: function init() {
        this.init_scene();
        this.set_active(true);
      }

      // build the scene for the panorama and inject it into the dom

    }, {
      key: 'init_scene',
      value: function init_scene() {
        var _this = this;

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
            _this.init_settings();
          });
        }
      }

      // initialize selectors and settings needed when scene is initialized

    }, {
      key: 'init_settings',
      value: function init_settings() {
        var _this2 = this;

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
            return _this2.toggle_auto_rotate();
          });
          this.listen(this.scene, 'mouseleave', function () {
            return _this2.toggle_auto_rotate();
          });
        }

        if (typeof this.settings.init === 'function') {
          this.settings.init.call(this, this.container, this.camera);
        }
      }
    }, {
      key: 'inline_settings',
      value: function inline_settings(container) {
        var attr_map = {};
        var allowed_keys = Object.keys(default_settings).concat(whitelist);

        Object.keys(container.attributes).forEach(function (attr) {
          name = container.attributes[attr].name.replace(/-/g, '_');
          if (allowed_keys.includes(name)) {
            attr_map[name] = container.attributes[attr].value;
          } else if (allowed_keys.includes('cubemap_' + name)) {
            attr_map['cubemap_' + name] = container.attributes[attr].value;
          }
        });

        Object.keys(attr_map).forEach(function (attr) {
          var val = attr_map[attr];

          if (val === 'true') val = true;else if (val === 'false') val = false;else if (val === 'null') val = null;else if (val === '') {
            val = true;
          } else if (!isNaN(parseFloat(val)) && isFinite(val)) {
            val = parseFloat(val);
          }

          attr_map[attr] = val;
        });

        return attr_map;
      }
    }, {
      key: 'cubemap_attr',
      value: function cubemap_attr() {
        var _this3 = this;

        var tpl_str = this.settings.cubemap_folder_template;
        var missing = 0;
        var out = [];

        if (tpl_str) {
          tpl_str = tpl_str.replace(/\:([^\/]+)/g, function (_, prop) {
            if (_this3.settings.hasOwnProperty(prop)) {
              return _this3.settings[prop];
            }

            missing += 1;
          });
        }

        ['folder', 'name_map', 'edge_length'].forEach(function (attr) {
          var cc_attr = attr.replace(/_[^_]/, function (m) {
            return m.replace(/[_]+/, "").toUpperCase();
          });

          if (tpl_str && missing === 0 && attr === 'folder') {
            out.push(cc_attr + ': ' + tpl_str + ';');
          } else {
            out.push(cc_attr + ': ' + _this3.settings['cubemap_' + attr] + ';');
          }
        });

        return out.join(' ');
      }
    }, {
      key: 'set_active',
      value: function set_active(active) {
        this.container.classList.toggle(this.settings.active_class, active);
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
        var _this4 = this;

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
            return _this4.auto_rotate(ts);
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
        for (var _len2 = arguments.length, params = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          params[_key2 - 1] = arguments[_key2];
        }

        element.addEventListener.apply(element, params);
      }
    }], [{
      key: 'settings',
      value: function settings(_settings) {
        Object.assign(default_settings, _settings);

        if (default_settings.cubemap_folder_template) {
          default_settings.cubemap_folder_template.split('/').forEach(function (part) {
            if (part && part[0] === ':') {
              whitelist.push(part.substr(1));
            }
          });
        }
      }
    }, {
      key: 'new',
      value: function _new() {
        for (var _len3 = arguments.length, params = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          params[_key3] = arguments[_key3];
        }

        return new (Function.prototype.bind.apply(Panorama, [null].concat(params)))();
      }
    }]);

    return Panorama;
  }();
}();
