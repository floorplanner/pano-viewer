// define global settings
Panorama.settings({
  active_class: 'panorama--active',
  auto_rotate: true,
  pause_on_hover: false,
  full_rotation_time: 180,
  cubemap_edge_length: 200,
  cubemap_folder: '/img/panorama/cube/',
  cubemap_name_map: 'negx=l posx=r negy=d posy=u negz=b posz=f',
  init: (scene, camera) => {
    // NOTE: testing room camera was facing against the wall by default when using y: 0
    camera.setAttribute('rotation', {x: 0, y: -180, z: 0});
  }
});

window.addEventListener('load', () => {
  window.pano = Panorama.new('.panorama' /*, opts = { ... }*/);
});
