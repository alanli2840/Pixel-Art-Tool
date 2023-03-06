let sizeSlider = document.querySelector(".size-slider>input");
let sliderText = document.querySelector(".slider-text>div");
let colorPicker = document.querySelector(".color-picker");

let defaultColor = "#343A40";
let doubleVLight = "#F8F9FA";
let doubleVDark = "#343A40";
let currentColor = "#000000";
let grid = document.querySelector(".grid");
let gridBoxes = new Map();
let gridSize = sizeSlider.value;

let drawingTools = document.querySelectorAll(".drawing-tools .tool-button");
let colorSelector = document.querySelector(".color-selector");
let pen = document.querySelector(".pen");
let eraser = document.querySelector(".eraser");
let lighten = document.querySelector(".lighten");
let darken = document.querySelector(".darken");
let mirrorDraw = document.querySelector(".mirror-draw");
let fill = document.querySelector(".fill");
let clear = document.querySelector(".clear-button");

let drawing = false;

colorPicker.addEventListener('input', function() {
    currentColor = `${this.value}`;
});

const selectColor = boxNum => {
    currentColor = gridBoxes.get(boxNum);
    colorPicker.value = currentColor;
}

const color = (box, boxNum) => {
    box.style.backgroundColor = currentColor;
    gridBoxes.set(boxNum, currentColor);
}

const erase = (box, boxNum) => {
    box.style.backgroundColor = defaultColor;
    gridBoxes.set(boxNum, defaultColor);
}

const changeShade = (box, boxNum, shade) => {
    let currentVal = parseInt(gridBoxes.get(boxNum).substring(1), 16);

    let r = (currentVal >> 16) + shade;
    if(r >= 255) r = 255;
    if(r <= 0) r = 0;

    let g = (currentVal >> 8 & 0x0000ff) + shade;
    if(g >= 255) g = 255;
    if(g <= 0) g = 0;

    let b = (currentVal & 0x0000ff) + shade;
    if(b >= 255) b = 255;
    if(b <= 0) b = 0;

    let newColor = `#${((r << 16) | (g << 8) | b).toString(16)}`;
    console.log(newColor);
    box.style.backgroundColor = newColor;
    gridBoxes.set(boxNum, newColor);
}

const lightenColor = (box, boxNum) => {
    changeShade(box, boxNum, 8);
}

const darkenColor = (box, boxNum) => {
    changeShade(box, boxNum, -8);
}

const mirrorDrawing = (box, boxNum) => {
  color(box, boxNum);
  if(((boxNum * 2) - 1) == gridSize) return;

  let remainder = (boxNum - 1) % gridSize;
  let opposite;
  if(remainder <= gridSize/2) {
    opposite = gridSize - remainder - 1 + (boxNum - remainder);
  }
  else {
    opposite =  (boxNum - remainder) + (gridSize - remainder - 1);
  }

  color(document.querySelector(`.box${opposite}`), opposite);
}

const colorFill = (boxNum) => {
  let clusterColor = gridBoxes.get(boxNum);
  if(clusterColor == currentColor) return;
  fillHelper(boxNum, clusterColor)
}

const fillHelper = (boxNum, clusterColor) => {
    if(gridBoxes.get(boxNum) != clusterColor) return;
    if(gridBoxes.get(boxNum) == clusterColor) color(document.querySelector(`.box${boxNum}`), boxNum);
    
    gridBoxes.set(boxNum, currentColor);
    if(!(boxNum % gridSize == 1)) fillHelper(boxNum - 1, clusterColor);
    if(!(boxNum % gridSize == 0)) fillHelper(boxNum + 1, clusterColor);
    if(!(boxNum - gridSize < 0)) fillHelper(boxNum - gridSize, clusterColor);
    if(!(+boxNum + +gridSize > gridSize * gridSize)) fillHelper(+boxNum + +gridSize, clusterColor);
}

const updateBox = (boxNum, isClick) => {
    if(isClick) {
        if(drawing) {
            drawing = false;
            if(currentTool != null) document.body.style.cursor = "default";
        }
        else {
            drawing = true;
            if(currentTool != null) document.body.style.cursor = "pointer";
        }
    }
    if(!drawing) return;
    const box = document.querySelector(`.box${boxNum}`);
    switch(currentTool) {
        case colorSelector: {
            if(isClick) {
                selectColor(boxNum);
                document.body.style.cursor = "default";
                drawing = false;
            }
            break;
        }
        case pen: {
            color(box, boxNum);
            break;
        }
        case eraser: {
            erase(box, boxNum);
            break;
        }
        case lighten: {
            lightenColor(box, boxNum);
            break;
        }
        case darken: {
            darkenColor(box, boxNum);
            break;
        }
        case mirrorDraw: {
            mirrorDrawing(box, boxNum);
            break;
        }
        case fill: {
            if(isClick) {
                colorFill(boxNum);
                document.body.style.cursor = "default";
                drawing = false;
            }
            break;
        }
        default: {
            break;
        }
    }
}

const hoverEffect = (boxNum) => {
    if(currentTool == null) return;
    const box = document.querySelector(`.box${boxNum}`);
    box.classList.toggle("hover");
    if(parseInt(gridBoxes.get(boxNum).substring(1), 16) < parseInt(808080, 16)) {
        box.style.setProperty('--box-highlight', doubleVLight);
    }
    else {
        box.style.setProperty('--box-highlight', doubleVDark);
    }
}

const clearBoard = () => {
    for(const boxNum of gridBoxes.keys()) {
        erase(document.querySelector(`.box${boxNum}`), boxNum);
    }
}

clear.addEventListener('click', clearBoard);

const loadGrid = () => {
    sliderText.textContent = `${gridSize} x ${gridSize}`;
    for(let i = 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        box.addEventListener("mouseover", updateBox.bind(this, i, false));
        box.addEventListener("click", updateBox.bind(this, i, true));
        box.addEventListener("mouseenter", hoverEffect.bind(this, i));
        box.addEventListener("mouseleave", hoverEffect.bind(this, i));
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, defaultColor);
    }
}

const addBoxes = gridSizeOld => {
    clearBoard();
    for(let i = gridSizeOld * gridSizeOld + 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        box.addEventListener("mouseover", updateBox.bind(this, i, false));
        box.addEventListener("click", updateBox.bind(this, i, true));
        box.addEventListener("mouseenter", hoverEffect.bind(this, i));
        box.addEventListener("mouseleave", hoverEffect.bind(this, i));
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, defaultColor);
    }
}

const removeBoxes = gridSizeOld => {
    clearBoard();
    for(let i = gridSize * gridSize + 1; i <= gridSizeOld * gridSizeOld; i++) {
        const box = document.querySelector(`.box${i}`);
        box.remove();
        gridBoxes.delete(i);
    }
}

const updateGrid = (gridSizeOld, gridSizeNew) => {
    gridSize = gridSizeNew;
    sliderText.textContent = `${gridSize} x ${gridSize}`;

    grid.style.setProperty('--grid-columns', gridSize);
    grid.style.setProperty('--grid-rows', gridSize);

    if(gridSizeOld < gridSize)
        addBoxes(gridSizeOld);
    else
        removeBoxes(gridSizeOld);
}

sizeSlider.addEventListener('input', function() {
    if(this.value != gridSize) {
        updateGrid(gridSize, this.value);
    }
});

document.addEventListener('DOMContentLoaded', loadGrid());

let currentTool = null;
const selectTool = (tool) => {
    if(currentTool == tool) {
        currentTool = null;
        tool.classList.toggle('active');
        return;
    }
    if(!(currentTool == null)) currentTool.classList.toggle('active');
    currentTool = tool;
    currentTool.classList.toggle('active');
}

drawingTools.forEach(tool => {
    tool.addEventListener('click', selectTool.bind(this, tool));
});