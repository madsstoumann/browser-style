import { commonConfig, handleGuiEvent, init } from '../common.js';
import { getViewBox } from '/assets/js/svgUtils.js';
import GuiControl from '/ui/gui-control/index.js';

const GUI = document.querySelector('gui-control');
const storageKey = 'radiohead';
const svg = document.getElementById('svg');

GUI.addRange('Lines', 23, '', { min: 5, max: 30, name: 'lines' });
GUI.addTextArea('Words', 'FEAR CONTROL TRUTH LIES HATE TRUST CORRUPT POWER MONEY FAITH JUSTICE CHAOS DREAM LIBERTY WAR PEACE DECEIVE HOPE TERROR LOVE FUTURE VOICE CHANGE REVOLT SILENCE FREEDOM GREED RISE FALL BELIEVE UNITE BREAK BUILD FAKE REAL ANGER JOY DARK LIGHT NOISE QUIET STRENGTH WEAKNESS CONTROL ESCAPE LOST FOUND OPEN CLOSE WIN LOSE FIGHT SUBMIT RULE ANARCHY FREE BOUND PEACEFUL VIOLENT LEADER FOLLOWER EMPTY FULL VICTORY DEFEAT FAITHFUL FAITHLESS KNOWN UNKNOWN SAFE DANGER SILENT LOUD ORDER DISORDER ALIVE DEAD VISION BLIND WISE FOOL RISE DECAY HEAL WOUND DOUBT CERTAINTY VISIBLE HIDDEN STRONG FRAGILE OPEN CLOSE PRESENT ABSENT CONNECTED DETACHED', '', { name: 'words' });
GUI.addRange('Scale', 0.95, '', { min: 0, max: 1, step: 0.025, name: 'scale' });
commonConfig(GUI, '#1C1D1E');
GUI.addEventListener('gui-input', (event) => handleGuiEvent(event, svg, GUI, storageKey, radiohead));
init(GUI, storageKey, []);

/*=== MAIN FUNCTION ===*/

function radiohead(svg, controls) {
  const { width, height } = getViewBox(svg);
  const colors = ['#D0001D', '#0D5436', '#093588', '#FDA223', '#F8551A', '#101624', '#EAEFF0'];
	const filter = true;
  const lines = controls.lines.valueAsNumber;
  const scale = controls.scale.valueAsNumber;
  const words = controls.words.value.split(/\s+/);

  function getRandomColorPair() {
    const bgIndex = Math.floor(Math.random() * colors.length);
    let cIndex;
    do {
      cIndex = Math.floor(Math.random() * colors.length);
    } while (cIndex === bgIndex);
    return { bg: colors[bgIndex], c: colors[cIndex] };
  }

  const maxFontSize = height / lines;

  const output = Array.from({ length: lines }).map((_line, rowIndex) => {
    let xPosition = 0;
    let lineContent = '';
    let totalLineWidth = 0;

    const lineWords = [];

    while (xPosition < width) {
      const { bg, c } = getRandomColorPair();
      let randomWord = words[Math.floor(Math.random() * words.length)];

      // Create a temporary text element to measure the width
      const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tempText.setAttribute('font-family', 'Pangolin');
      tempText.setAttribute('font-size', maxFontSize);
      tempText.textContent = randomWord;
      svg.appendChild(tempText);
      let wordWidth = tempText.getBBox().width;
      svg.removeChild(tempText);

      // Set rect width slightly larger than the word width
      const rectWidth = wordWidth * 1.15;

      // Check if the word/rect can fit in the remaining space
      if (xPosition + rectWidth > width) {
        break;
      }

      totalLineWidth += rectWidth;
      lineWords.push({ randomWord, rectWidth, bg, c });
      xPosition += rectWidth;
    }

    // Center the line by calculating the starting x position
    let centeredXPosition = (width - totalLineWidth) / 2;

    // Generate the SVG elements for the line
    lineWords.forEach(({ randomWord, rectWidth, bg, c }) => {
      lineContent += `
        <rect x="${centeredXPosition}" y="${rowIndex * maxFontSize}" width="${rectWidth}" height="${maxFontSize}" fill="${bg}" />
        <text x="${centeredXPosition + 1.5}" y="${rowIndex * maxFontSize + maxFontSize * 0.85}" font-family="Pangolin" font-size="${maxFontSize}" fill="${c}">${randomWord}</text>
      `;
      centeredXPosition += rectWidth;
    });

    return `<g>${lineContent}</g>`;
  }).join('');

  const centerX = (width - width * scale) / 2 - (filter ? 2 : 0);
  const centerY = (height - height * scale) / 2 - (filter ? 2 : 0);
  const svgContent = `
    <defs>
      <style type="text/css">
        @import url('https://fonts.googleapis.com/css2?family=Pangolin&display=swap');
      </style>
      <filter id="squiggly">
        <feTurbulence id="turbulence1" baseFrequency="0.02" numOctaves="3" result="noise" seed="0" />
        <feDisplacementMap id="displacement" in="SourceGraphic" in2="noise" scale="6" />
      </filter>
    </defs>
    <g transform="translate(${centerX} ${centerY}) scale(${scale})" filter="${filter ? 'url(#squiggly)' : 'none'}">${output}</g>`;

  svg.innerHTML = svgContent;
}
