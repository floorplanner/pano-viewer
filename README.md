# Simple panorama viewer

## Plugins / tools used

* [A-FRAME](https://aframe.io/) declarative markup to create 3d.
* [A modified version](https://github.com/SidOfc/aframe-cubemap-component) of [Ben Pyrik's](https://github.com/bryik) [fantastic aframe-cubemap-component](https://github.com/bryik/aframe-cubemap-component).
* [Babel](https://babeljs.io/) the ES2015 to ES5 compiler.

## Installation

Append the following `<script>` tags to the `<head>` of the document.

```html
<!-- Needs to be loaded first, main library used for rendering the panorama -->
<script type="text/javascript" src="js/aframe.min.js"></script>
<!-- Needs to be loaded second, allows us to use 6 cube images to render a panorama  -->
<script type="text/javascript" src="js/aframe-cubemap.min.js"></script>
<!-- Needs to be loaded after the other two have been loaded, depends on both -->
<!-- An ES2015 version also exists which is more readable than the ES5 one -->
<script type="text/javascript" src="js/panorama.min.js"></script>
```

There are configurable options that you can pass to the constructor (defaults shown):

```js
// default scene element class used
scene_class             : 'panorama-viewer',

// added after loading panorama
active_class            : 'active',

// start the pano without further interaction
// if set to false, you'll have to initialize the panorama using the `init()` function.
auto_start              : true,

// turn auto rotate on by default
auto_rotate             : false,

// amount of px to move per second
auto_rotate_speed       : 3,

// control rotation diretion, either 'left' or 'right'
auto_rotate_direction   : 'left',

// overwrites auto_rotate_speed and instead allows you to set time in [s] for a full rotation
full_rotation_time      : null,

// custom callback executed right after init
init                    : null,

// auto pause rotation on hover
pause_on_hover          : false,

// folder where aframe will try to locate images (can also be a web address e.g. https://cdn.domain.tld/image/path/)
cubemap_folder          : '/img/',

// specify placeholders using :placeholder, these will be replaced with (custom defined) attributes defined globally, per instance or on an html node
// example: 'https://cdn.mywebsite.tld/images/panoramas/:panorama_id/'
cubemap_folder_template : null,

// file name map which will be used to fetch images (inside "cubemap_folder")
// in this case, it would look for /img/panorama/cube/l.jpg instead of /img/panorama/cube/negx.jpg
cubemap_name_map        : null,

// a certain scale for the panorama, this says it's 5000x5000x5000
cubemap_edge_length     : 5000
```

With these you can set:

### Global settings

Global settings can be defined using:

```js
Panorama.settings({ /*, setting: value*/ });
```

Which will cause all subsequent instances of the `Panorama` class to honor these settings as defaults instead of the regular defaults.

### Instance specific settings

These can be set in the constructor of each `Panorama` that you are going to define:

```js
// will auto rotate to the left (ccw)
var pano_n1 = Panorama.new('.selector', { auto_rotate_direction: 'left' });

// will auto rotate to the right (cw)
var pano_n2 = Panorama.new('.selector', { auto_rotate_direction: 'right' });
```

Regardless of defaults, these will be overridden by settings defined directly in the constructor.

### Instance specific settings via HTML

This allows you to write your settings as attributes on the target HTML element.
These settings will override the *instance specific settings* which means that you ultimately have control with HTML over JS to override a setting.

*(Basically the same as using inline css to override stylesheet css)*

The convention for this (all the settings are **snake_case**) is to use <a href="https://en.wikipedia.org/wiki/Naming_convention_(programming)#Lisp">**lisp-case**</a>

So the `auto_rotate_direction` you just saw used in JS becomes this in HTML:

```html
<div class="selector" auto-rotate-direction="right"></div>
```

Values such as `null` and `3` can also be passed to any attribute.

There is one exception to this rule, which is about the properties that start with `cubemap_`, `cubemap_folder` for instance can be written as `folder` on a HTML node.

If a `cubemap_folder_template` attribute is set and it contains placeholders (words starting with `:`), these can be set (without colon) on the HTML element itself and will be substituted for their values on load.

If there are no placeholders it will simply act like `cubemap_folder`, in which case it's useless to use `cubemap_folder_template` anyway.

If there **are** placeholders but they aren't set anywhere, `cubemap_folder` will be used instead as a fallback.

`cubemap_folder_template` also overwrites the `folder` attribute, even if `cubemap_folder_template` is set globally using `Panorama.settings(/* opts = {} */)` and the `folder` attribute is set on a HTML element (`<div class="selector" folder="my/folder"></div>`).

## Usage

The [index.html](index.html) file is a good starting place to get a basic setup going, the [main.js](js/main.js) file will also show you how some settings are set or can be set.

However there are some additional things you can do with a panorama:

In any case, you'll have to define a `Panorama` object first:

```js
// var my_pano = new Panorama('.my-selector', /*, opts = {}*/); also works, Panorama.new returns an instance of a Panorama
var my_pano = Panorama.new( /*selector*/ /*, opts = {}*/ );
```

*The `selector` argument can be any string representing a selector, using `document.querySelector` in the background it will simply use the first node and dump the rest.*

### Stop / Start / Toggle auto rotate

**Start auto rotate**

Starts `auto_rotate`, if the call started auto_rotate it will return `true`.
If it was already started, `null` will be returned.

```js
my_pano.start_auto_rotate();
```

**Stop auto rotate**

Stops `auto_rotate`, if the call stopped auto_rotate it will return `true`.
If it was already stopped, `null` will be returned.

```js
my_pano.stop_auto_rotate();
```

**Toggle auto rotate**

Toggles `auto_rotate`

```js
my_pano.toggle_auto_rotate();
```

**Change active state**

After initialization, the `active_class` will be added to the selector. This allows you to do things such as fade it in when it's loaded (as shown in the example).

This function takes one argument, a `boolean`, to set the active state to either `true` or `false`.

When setting to `true`, the `active_class` will be added.
When setting to `false`, the `active_class` will be removed.

```js
var myPano = Panorama.new(/*selector*/ /*, opts = {}*/);
myPano.set_active(true);
```
