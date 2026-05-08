const SLIDES = [
    {
        image: 'images/hw-01.jpg',
        eyebrow: 'Edge Compute',
        title: 'Product Name One',
        subtitle: 'Short tagline describing what makes this hardware unique. Replace with real copy.',
        specs: [
            { label: 'Throughput', value: '12.4 Gbps' },
            { label: 'Latency',    value: '<2 ms' },
            { label: 'Power',      value: '24 W' },
        ],
    },
    {
        image: 'images/hw-02.jpg',
        eyebrow: 'Industrial Sensor',
        title: 'Product Name Two',
        subtitle: 'A second placeholder description. Swap in real product positioning here.',
        specs: [
            { label: 'Range',     value: '1.2 km' },
            { label: 'Accuracy',  value: '0.01%' },
            { label: 'IP Rating', value: 'IP68' },
        ],
    },
    {
        image: 'images/hw-03.jpg',
        eyebrow: 'Control Module',
        title: 'Product Name Three',
        subtitle: 'Third placeholder line. Add as many slides as you need by editing this array.',
        specs: [
            { label: 'Ports',    value: '32 × SFP+' },
            { label: 'Uptime',   value: '99.999%' },
            { label: 'Compute',  value: '8-core ARM' },
        ],
    },
];

const SLIDE_DURATION = 7000;

const stage = document.getElementById('stage');
const slideIdEl = document.getElementById('hud-slide-id');
const clockEl = document.getElementById('hud-clock');

function buildSlide(data, index) {
    const slide = document.createElement('div');
    slide.className = 'slide';

    const img = document.createElement('div');
    img.className = 'slide-image';

    const tester = new Image();
    tester.onload = () => {
        img.style.backgroundImage = `url('${data.image}')`;
    };
    tester.onerror = () => {
        const placeholder = document.createElement('div');
        placeholder.className = 'slide-placeholder';
        const label = document.createElement('div');
        label.className = 'slide-placeholder-label';
        label.textContent = `Drop ${data.image}`;
        placeholder.appendChild(label);
        img.replaceWith(placeholder);
    };
    tester.src = data.image;

    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const eyebrow = document.createElement('div');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = `// ${data.eyebrow}`;

    const title = document.createElement('h1');
    title.className = 'title';
    title.textContent = data.title;

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = data.subtitle;

    const specs = document.createElement('div');
    specs.className = 'specs';
    data.specs.forEach((s) => {
        const item = document.createElement('div');
        item.className = 'spec-item';
        item.innerHTML = `<span class="spec-label">${s.label}</span><span class="spec-value">${s.value}</span>`;
        specs.appendChild(item);
    });

    overlay.append(eyebrow, title, subtitle, specs);
    slide.append(img, overlay);
    slide.dataset.index = index;
    return slide;
}

const slideEls = SLIDES.map(buildSlide);
slideEls.forEach((el) => stage.appendChild(el));

let current = 0;

function showSlide(idx) {
    slideEls.forEach((el, i) => {
        if (i === idx) {
            el.classList.remove('exiting');
            el.classList.add('active');
            const img = el.querySelector('.slide-image');
            if (img) {
                img.style.animation = 'none';
                void img.offsetWidth;
                img.style.animation = '';
            }
        } else if (el.classList.contains('active')) {
            el.classList.remove('active');
            el.classList.add('exiting');
        } else {
            el.classList.remove('exiting');
        }
    });
    slideIdEl.textContent = `UNIT ${String(idx + 1).padStart(2, '0')} / ${String(SLIDES.length).padStart(2, '0')}`;
}

showSlide(0);
setInterval(() => {
    current = (current + 1) % SLIDES.length;
    showSlide(current);
}, SLIDE_DURATION);

function updateClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}:${ss} UTC`;
}
updateClock();
setInterval(updateClock, 1000);

const TICKER_KEYS = [
    ['CPU.LOAD',     () => `${(20 + Math.random() * 30).toFixed(1)}%`],
    ['MEM.USED',     () => `${(40 + Math.random() * 20).toFixed(1)}%`],
    ['NET.RX',       () => `${(800 + Math.random() * 400).toFixed(0)} Mb/s`],
    ['NET.TX',       () => `${(600 + Math.random() * 400).toFixed(0)} Mb/s`],
    ['TEMP.CORE',    () => `${(38 + Math.random() * 8).toFixed(1)}°C`],
    ['UPTIME',       () => `${(120 + Math.floor(Math.random() * 200))}d`],
    ['NODES.ONLINE', () => `${1280 + Math.floor(Math.random() * 12)}`],
    ['ERR.RATE',     () => `${(Math.random() * 0.05).toFixed(3)}%`],
    ['PWR.DRAW',     () => `${(18 + Math.random() * 6).toFixed(1)} W`],
    ['SIG.STR',      () => `${(-40 - Math.random() * 30).toFixed(0)} dBm`],
];

const tickerTrack = document.getElementById('ticker-track');

function renderTicker() {
    const parts = [];
    for (let i = 0; i < 2; i++) {
        TICKER_KEYS.forEach(([k, fn]) => {
            parts.push(`<span class="tick"><span class="tick-key">${k}</span> <span class="tick-val">${fn()}</span></span>`);
        });
    }
    tickerTrack.innerHTML = parts.join('');
}
renderTicker();
setInterval(renderTicker, 4000);
