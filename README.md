# Liza G Media

The source for lizagmedia.com, a site that shows off Liza Garcia's life on the
road: a globe that flies to each place she has been as you scroll, with her
photos from each trip. It is plain HTML, CSS, and JavaScript with no build step,
served by GitHub Pages.

> **Status: in progress.**

## How It Works

The page runs top to bottom: a hero photo that fades into the globe, the places,
an about section, and a get-in-touch footer. The top bar stays on screen and
underlines the section crossing the middle of the screen.

Each place is one `<article class="stop">` in `index.html`. Its `data-lon`,
`data-lat`, and `data-zoom` say where the globe flies, and the block holds the
place's name and photos, each photo carrying the day it was taken in
`data-taken`. Those days are the only dates in the repo: `places.js` orders the
stops by their earliest photo and writes each stop's months from its photos, so
a stop whose photos span months lists each one. It also pins every stop on the
globe and builds the sidebar and the `04 / 10` counters.

The stop crossing the middle of the screen is the current one, and the globe
flies to it; before the first stop and after the last, the globe shows the whole
Earth. On a wide screen the stops' photos run down the right half as one panel
that fades into the globe; on a phone they are a band along the bottom. An arrow
on that edge slides them away until the next stop to show the whole globe, which
pans with a drag (two fingers on a phone, so one finger still scrolls the page)
and zooms with its + and − buttons. Clicking a photo, or a stop's dot on the
globe, opens the photos full screen with the place's name and the day each was
taken.

The globe is MapLibre GL JS in globe projection, drawing map data from
OpenFreeMap's public instance, which is free and needs no key. MapLibre is
vendored in `vendor/maplibre-gl/` at a pinned version, so the page loads no
third-party script.

## Repository Structure

```
lizagmedia.com/
├── index.html             the page; the .stop blocks are the places
├── places.js              globe, stop order and months, sidebar, pins, photo panels
├── photo-viewer.js        the full-screen photos
├── site-header.js         the section the top bar marks
├── element-at-middle.js   which element crosses the middle of a scroller
├── styles.css
├── images/
│   ├── hero.jpg  about.jpg  get-in-touch.jpg
│   └── stops/<stop>/      a stop's photos
├── vendor/maplibre-gl/    pinned MapLibre GL JS build
└── CNAME                  lizagmedia.com, for GitHub Pages
```

## Requirements

- A browser with WebGL2 to see the globe; the rest of the page works without it.
- Python 3, to serve the folder locally.
- ImageMagick 7, to export photos.

## Usage

### Preview Locally

```bash
python3 -m http.server
```

Then open http://localhost:8000. Opened straight from disk, the page shows no
globe: browsers do not load module scripts or the map's worker from `file://`.

### Add a Place

1. Export its photos into `images/stops/<stop>/`, as below.
2. Copy one `<article class="stop">` block anywhere in the list in
   `index.html`; the page orders stops by date. Set its `id`, `data-lon` and
   `data-lat` (decimal degrees; south and west are negative), and `data-zoom`
   (about 8 to 9 for a park, 4 to 5 for a country), then the name and, for each
   photo, the link and `src`, `alt`, `width`, `height`, and `data-taken`.

The order, the months, the sidebar entry, the counter, and the pin follow from
the block.

### Export a Photo

```bash
magick identify -format '%[EXIF:DateTimeOriginal]\n' IN.JPG
magick IN.JPG -auto-orient -resize 2000x2000\> -strip -quality 78 images/stops/<stop>/<name>.jpg
magick identify -format '%w %h\n' images/stops/<stop>/<name>.jpg
```

The first command prints the day the photo was taken, for `data-taken`
(`2025:10:12 17:53:12` becomes `2025-10-12`); run it before exporting, since
`-strip` drops all metadata, including GPS and camera serial numbers. Stop
photos are 2000 px on the long edge, `hero.jpg` and `get-in-touch.jpg` 2400 px,
and `about.jpg` 1200 px. The last command prints the `width` and `height` the
`<img>` needs.

### Update MapLibre

Download `https://registry.npmjs.org/maplibre-gl/-/maplibre-gl-<version>.tgz`,
check its SHA-512 against the `integrity` field at
`https://registry.npmjs.org/maplibre-gl/<version>`, and copy
`dist/maplibre-gl.mjs`, `dist/maplibre-gl-shared.mjs`,
`dist/maplibre-gl-worker.mjs`, `dist/maplibre-gl.css`, and `LICENSE.txt` into
`vendor/maplibre-gl/`.

### Publish

GitHub Pages serves `main` at lizagmedia.com. `CNAME` holds the domain, and
`.nojekyll` makes Pages serve the files as they are instead of running Jekyll.

## Author

**Anthony Yalong**
- Email: yalong.anthony123@gmail.com
- GitHub: [@yalongwastaken](https://github.com/yalongwastaken)
