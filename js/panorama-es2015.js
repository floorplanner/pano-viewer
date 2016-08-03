let Panorama = (function() {
  // default selectors for AFRAME elements
  const CUBEMAP             = 'a-entity[cubemap]';
  const CAMERA              = '[data-aframe-default-camera]';
  const VR_BUTTON           = '.a-enter-vr';
  const VR_UNSUPPORTED_ATTR = 'data-a-enter-vr-no-webvr';

  // whitelist 'attributes' in cubemap_folder_template attribute
  let whitelist        = [];
  // default settings
  let default_settings = {
    scene_class             : 'panorama-viewer', // default scene element
    active_class            : 'active',          // added after loading panorama
    auto_start              : true,              // start the pano without further interaction
    auto_rotate             : false,             // turn auto rotate on by default
    auto_rotate_speed       : 3,                 // amount of px to move per second
    auto_rotate_direction   : 'left',            // control rotation diretion, either 'left' or 'right'
    full_rotation_time      : null,              // overwrites auto_rotate_speed and instead allows you to set time in [s] for a full rotation
    init                    : null,              // custom callback executed right after init
    pause_on_hover          : false,             // auto pause rotation on hover

    cubemap_folder          : '/img/',           // folder where aframe will try to locate images
    cubemap_folder_template : null,              // overwrites cubemap_folder, allows custom named attr to be replaced within a set of curly braces: {{attr_name}}
    cubemap_name_map        : null,              // file name map which will be used to fetch images (inside "cubemap_folder")
    cubemap_edge_length     : 5000               // size of cube
  };

  return class Panorama {
    constructor(selector, settings = {}) {
      this.selector    = selector;
      this.container   = document.querySelector(selector);

      this.settings({}, default_settings, settings,
                        this.inline_settings(this.container));

      if (this.settings.auto_start) {
        this.init();
      }
    }

    settings(target, ...objects) {
      this.settings = Object.assign(target, ...objects);
    }

    init() {
      this.init_scene();
      this.set_active(true);
    }

    // build the scene for the panorama and inject it into the dom
    init_scene() {
      let scene  = document.createElement('a-scene');
      let entity = document.createElement('a-entity');
      let scene_class = this.settings.scene_class + '-scene';

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
        this.listen(this.scene, 'loaded', () => { this.init_settings(); });
      }
    }

    // initialize selectors and settings needed when scene is initialized
    init_settings() {
      this.camera    = this.container.querySelector(CAMERA);
      this.vr_button = this.container.querySelector(VR_BUTTON);
      this.cubemap   = this.container.querySelector(CUBEMAP);

      if (this.vr_button.hasAttribute(VR_UNSUPPORTED_ATTR)) {
        this.vr_button.parentNode.removeChild(this.vr_button);
      }

      if (this.settings.auto_rotate) {
        this.start_auto_rotate();
      }

      if (this.settings.pause_on_hover) {
        this.listen(this.scene, 'mouseenter', () => this.toggle_auto_rotate());
        this.listen(this.scene, 'mouseleave', () => this.toggle_auto_rotate());
      }

      if (typeof this.settings.init === 'function') {
        this.settings.init.call(this, this.container, this.camera);
      }
    }

    inline_settings(container) {
      let attr_map     = {};
      let allowed_keys = Object.keys(default_settings).concat(whitelist);

      Object.keys(container.attributes).forEach((attr) => {
        name = container.attributes[attr].name.replace(/-/g, '_');
        if (allowed_keys.includes(name)) {
          attr_map[name] = container.attributes[attr].value;
        } else if (allowed_keys.includes(`cubemap_${name}`)) {
          attr_map[`cubemap_${name}`] = container.attributes[attr].value;
        }
      });

      Object.keys(attr_map).forEach((attr) => {
        let val = attr_map[attr];

        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (val === 'null') val = null;
        else if (val === '') {
          val = true;
        } else if (!isNaN(parseFloat(val)) && isFinite(val)) {
          val = parseFloat(val);
        }

        attr_map[attr] = val;
      });

      return attr_map;
    }

    cubemap_attr() {
      let tpl_str = this.settings.cubemap_folder_template;
      let missing = 0;
      let out     = [];

      if (tpl_str) {
        tpl_str = tpl_str.replace(/\:([^\/]+)/g, (_, prop) => {
          if (this.settings.hasOwnProperty(prop)) {
            return this.settings[prop];
          }

          missing += 1;
        });
      }

      ['folder', 'name_map', 'edge_length'].forEach((attr) => {
        let cc_attr = attr.replace(/_[^_]/, (m) => {
          return m.replace(/[_]+/, "").toUpperCase();
        });

        if (tpl_str && missing === 0 && attr === 'folder') {
          out.push(`${cc_attr}: ${tpl_str};`);
        } else {
          out.push(`${cc_attr}: ${this.settings[`cubemap_${attr}`]};`);
        }
      });

      return out.join(' ');
    }

    set_active(active) {
      this.container.classList.toggle(this.settings.active_class, active);
    }

    start_auto_rotate() {
      if (!this.__auto_rotate_enabled) {
        this.prev_frame_ts         = performance.now();
        this.__auto_rotate_enabled = true;

        this.auto_rotate(this.prev_frame_ts);

        return true;
      }

      return null;
    }

    stop_auto_rotate() {
      if (this.__auto_rotate_enabled) {
        this.__auto_rotate_enabled = false;

        return false;
      }

      return null;
    }

    // return true if started
    // return false if stopped
    // return null if nothing happened
    toggle_auto_rotate() {
      if (this.__auto_rotate_enabled) {
        return this.stop_auto_rotate();
      } else {
        return this.start_auto_rotate();
      }
    }

    auto_rotate(ts) {
      let {x, y, z} = this.camera.components.rotation.data;

      this.camera.setAttribute('rotation', {
        x: x,
        y: (Math.abs(y) > 360 ? 0 : y + this.px_per_frame(ts)),
        z: z
      });

      if (this.__auto_rotate_enabled) {
        requestAnimationFrame((ts) => this.auto_rotate(ts));
      }
    }

    px_per_frame(ts) {
      const FPS          = 1000 / (ts - this.prev_frame_ts);
      let out            = 0;
      this.prev_frame_ts = ts;

      if (this.settings.full_rotation_time) {
        out = 360 / (FPS * this.settings.full_rotation_time);
      } else {
        out = 1 / FPS * this.settings.auto_rotate_speed;
      }

      return (this.settings.auto_rotate_direction == 'left' ? out : out *= -1);
    }

    listen(element, ...params) {
      element.addEventListener(...params);
    }

    static settings(settings) {
      Object.assign(default_settings, settings);

      if (default_settings.cubemap_folder_template) {
        default_settings.cubemap_folder_template.split('/').forEach((part) => {
          if (part && part[0] === ':') {
            whitelist.push(part.substr(1));
          }
        });
      }
    }

    static new(...params) {
      return new Panorama(...params);
    }
  };
})();
