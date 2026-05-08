# Hardware Screensaver

A looping, full-screen animated screensaver with cross-fading hardware shots,
fading text overlays, animated grid background, scanlines, HUD, and a
telemetry ticker.

## Run it

Open `screensaver/index.html` in a browser, or serve the folder:

```bash
cd screensaver
python3 -m http.server 8080
# then visit http://localhost:8080
```

For kiosk-style display, use the browser's full-screen mode (F11) or run
Chrome/Edge with `--kiosk file:///path/to/screensaver/index.html`.

## Add your hardware images

Drop image files into `screensaver/images/` named `hw-01.jpg`, `hw-02.jpg`,
`hw-03.jpg` (or any names — see below). Transparent PNGs on the dark
background look best; otherwise tightly cropped product shots work well.

Suggested specs:
- 1600×1200 or larger, landscape
- PNG with transparency *or* JPG with a near-black background
- Subject centered (the Ken Burns animation pans/zooms slightly)

If an image is missing, the slide falls back to a styled placeholder so the
loop keeps running.

## Edit the copy and slide list

Open `screensaver/app.js` and edit the `SLIDES` array at the top. Add, remove,
or reorder slides freely:

```js
const SLIDES = [
    {
        image: 'images/hw-01.jpg',
        eyebrow: 'Edge Compute',
        title: 'Product Name One',
        subtitle: 'Short tagline here.',
        specs: [
            { label: 'Throughput', value: '12.4 Gbps' },
            { label: 'Latency',    value: '<2 ms' },
            { label: 'Power',      value: '24 W' },
        ],
    },
    // ...
];
```

`SLIDE_DURATION` (also in `app.js`) controls how long each slide is on screen,
in milliseconds.

## Customize the look

Color and timing variables live at the top of `screensaver/styles.css`:

```css
:root {
    --accent: #00ffd1;       /* primary neon accent */
    --accent-dim: #008f76;   /* HUD lines, brackets */
    --bg: #03060a;           /* outer background */
    --slide-duration: 7000ms;
    --fade-duration: 1200ms;
}
```
