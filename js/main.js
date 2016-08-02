// define global settings
Panorama.settings({
  active_class: 'panorama--active',
  auto_rotate: true,
  pause_on_hover: false,
  full_rotation_time: 180,
  edge_length: 10000,
  init: (scene, camera) => {
    // NOTE: testing room camera was facing against the wall by default when using y: 0
    camera.setAttribute('rotation', {x: 0, y: -180, z: 0});
  }
});

window.addEventListener('load', () => {
  window.pano = Panorama.new('.panorama' /*, opts = { ... }*/);
});
