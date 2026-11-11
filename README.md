# venirohit.github.io

Personal resume site for Rohit Veni, served by GitHub Pages at https://venirohit.github.io.

Plain HTML and CSS, no build step.

- `index.html`: the one-page resume
- `assets/css/style.css`: shared styles for every page
- `assets/js/main.js`: animations and interactions (hero network, count-up stats, scroll effects, skill filters). All motion is skipped for visitors who prefer reduced motion.

To add a headshot, save it as `assets/img/rohit.jpg` and add `<img class="photo" src="assets/img/rohit.jpg" alt="Rohit Veni">` inside the `.netviz` block in `index.html`.

To add a page later (for example `projects.html`), copy the header and footer from `index.html`, link `assets/css/style.css`, and add the page to the `<nav>`.
