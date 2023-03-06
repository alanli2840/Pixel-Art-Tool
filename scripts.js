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

let mouseDown = false;
document.body.onmousedown = () => mouseDown = true;
document.body.onmouseup = () => mouseDown = false;

let leftRotater = document.querySelector(".rotate-left");
let rightRotater = document.querySelector(".rotate-right");
let verticalFlipper = document.querySelector(".flip-ver");
let horizontalFlipper = document.querySelector(".flip-hor");
let undoButton = document.querySelector(".undo");
let redoButton = document.querySelector(".redo");

const getBoxElemenet = boxNum => box = document.querySelector(`.box${boxNum}`);

colorPicker.addEventListener('input', function() {
    currentColor = `${this.value}`;
});

const selectColor = boxNum => {
    currentColor = gridBoxes.get(boxNum);
    colorPicker.value = currentColor;
};

const color = (box, boxNum, color) => {
    box.style.backgroundColor = color;
    gridBoxes.set(boxNum, color);
};

const erase = (box, boxNum) => {
    box.style.backgroundColor = defaultColor;
    gridBoxes.set(boxNum, defaultColor);
};

//use bitwise operators to change shade of color using it's hex value
const changeShade = (box, boxNum, shade) => {
    let currentVal = parseInt(gridBoxes.get(boxNum).substring(1), 16);

    let r = (currentVal >> 16) + shade;
    if(r >= 255) r = 255; //make sure that the hex value does not go higher than FF
    if(r <= 0) r = 0; //make sure that the hex value does not go lower than 00

    let g = (currentVal >> 8 & 0x0000ff) + shade;
    if(g >= 255) g = 255;
    if(g <= 0) g = 0;

    let b = (currentVal & 0x0000ff) + shade;
    if(b >= 255) b = 255;
    if(b <= 0) b = 0;

    let newColor = `#${((r << 16) | (g << 8) | b).toString(16)}`;
    console.log(newColor);
    color(box, boxNum, newColor);
};

const lightenColor = (box, boxNum) => {
    changeShade(box, boxNum, 8);
};

const darkenColor = (box, boxNum) => {
    changeShade(box, boxNum, -8);
};

//calculate the location of horizontally opposite box
const calcOppHor = boxNum => {
    //the opposite box is the same if the box is dead center in the column
    if(((boxNum * 2) - 1) == gridSize) return boxNum;

    const column = (boxNum - 1) % gridSize;
    let opp;
    if(column <= gridSize/2) {
        opp = gridSize - column - 1 + (boxNum - column);
    }
    else {
        opp =  (boxNum - column) + (gridSize - column - 1);
    }
    return opp;
};

const calcOppVer = boxNum => {
    const row = Math.floor((boxNum - 1)/gridSize);
    //the opposite box is the same if the box is dead center in the row
    if(((row * 2) - 1) == gridSize) return boxNum;

    const column = (boxNum - 1) % gridSize;
    const oppRow = gridSize - row - 1;
    let opp = (oppRow * gridSize) + column + 1;
    return opp;
};

const mirrorDrawing = (box, boxNum) => {
  color(box, boxNum, currentColor);
  const opp = calcOppHor(boxNum);
  color(document.querySelector(`.box${opp}`), opp, currentColor);
};

const colorFill = boxNum => {
  let clusterColor = gridBoxes.get(boxNum);
  if(clusterColor == currentColor) return;
  fillHelper(boxNum, clusterColor);
};

//recursively fill the board to improve efficiency
const fillHelper = (boxNum, clusterColor) => {
    //end the recursive call if it is not the same as the color of original box that was clicked
    if(gridBoxes.get(boxNum) != clusterColor) return;
    if(gridBoxes.get(boxNum) == clusterColor) color(document.querySelector(`.box${boxNum}`), boxNum, currentColor);
    
    gridBoxes.set(boxNum, currentColor);
    //recursively call the fillHelper for all boxes directly adjacent that are in bounds of the grid
    if(!(boxNum % gridSize == 1)) fillHelper(boxNum - 1, clusterColor);
    if(!(boxNum % gridSize == 0)) fillHelper(boxNum + 1, clusterColor);
    if(!(boxNum - gridSize < 0)) fillHelper(boxNum - gridSize, clusterColor);
    if(!(+boxNum + +gridSize > gridSize * gridSize)) fillHelper(+boxNum + +gridSize, clusterColor);
};

//the function that is called that has calls to all drawing tools
const updateBox = (boxNum, isClick) => {
    if(!mouseDown && !isClick) return;
    const box = getBoxElemenet(boxNum);
    switch(currentTool) {
        case colorSelector: {
            //click only tool (no hover capabilities)
            if(isClick) selectColor(boxNum);
            break;
        }
        case pen: {
            color(box, boxNum, currentColor);
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
            //click only tool (no hover capabilities)
            if(isClick) colorFill(boxNum);
            break;
        }
        default: {
            break;
        }
    }
};

//add variable hover highlight to give visual feedback to user
const hoverEffect = boxNum => {
    if(currentTool == null) return;
    const box = getBoxElemenet(boxNum);
    box.classList.toggle("hover");
    if(parseInt(gridBoxes.get(boxNum).substring(1), 16) < parseInt(909090, 16)) {
        box.style.setProperty('--box-highlight', doubleVLight);
    }
    else {
        box.style.setProperty('--box-highlight', doubleVDark);
    }
};

const clearBoard = () => {
    for(const boxNum of gridBoxes.keys()) {
        erase(document.querySelector(`.box${boxNum}`), boxNum);
    }
};

clear.addEventListener('click', clearBoard);

const rotateLeft = () => {

};

const rotateRight = () => {

};

//flips an entire column or row using the opposite box calculation function
const flipColRow = (rcNum, rc) => {
    for(let i = 1; i <= gridSize/2; i++) {
        let curr;
        let opp;
        if(rc === "row") {
            curr = (rcNum * gridSize) + i;
            opp = calcOppHor(curr);
        }
        else if(rc === "col"){
            curr = ((i - 1) * gridSize) + rcNum;
            opp = calcOppVer(curr);
        }
        const currBox = getBoxElemenet(curr);
        const currColor = gridBoxes.get(curr);
        const oppBox = getBoxElemenet(opp);
        const oppColor = gridBoxes.get(opp);
        
        color(currBox, curr, oppColor);
        color(oppBox, opp, currColor)
    }
};

//flips every column
const flipVer = () => {
    for(let i = 1; i <= gridSize; i++) {
        flipColRow(i, "col");
    }
};

//flips every row
const flipHor = () => {
    for(let i = 0; i < gridSize; i++) {
        flipColRow(i, "row");
    }
};

const undo = () => {

};

const redo = () => {

};

//base loading of grid
const loadGrid = () => {
    sliderText.textContent = `${gridSize} x ${gridSize}`;
    for(let i = 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        box.addEventListener("mouseover", updateBox.bind(this, i, false));
        box.addEventListener("mousedown", updateBox.bind(this, i, true));
        box.addEventListener("mouseenter", hoverEffect.bind(this, i));
        box.addEventListener("mouseleave", hoverEffect.bind(this, i));
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, defaultColor);
    }
};

//adds boxes when the size is changed, but only the extra added boxes to save need of remaking board
const addBoxes = gridSizeOld => {
    clearBoard();
    for(let i = gridSizeOld * gridSizeOld + 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        box.addEventListener("mouseover", updateBox.bind(this, i, false));
        box.addEventListener("mousedown", updateBox.bind(this, i, true));
        box.addEventListener("mouseenter", hoverEffect.bind(this, i));
        box.addEventListener("mouseleave", hoverEffect.bind(this, i));
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, defaultColor);
    }
};

//removes boxes when the size is changed, removing from existing boxes to save need of remaking board
const removeBoxes = gridSizeOld => {
    clearBoard();
    for(let i = gridSize * gridSize + 1; i <= gridSizeOld * gridSizeOld; i++) {
        const box = document.querySelector(`.box${i}`);
        box.remove();
        gridBoxes.delete(i);
    }
};

const updateGrid = (gridSizeOld, gridSizeNew) => {
    gridSize = gridSizeNew;
    sliderText.textContent = `${gridSize} x ${gridSize}`;

    grid.style.setProperty('--grid-columns', gridSize);
    grid.style.setProperty('--grid-rows', gridSize);

    if(gridSizeOld < gridSize)
        addBoxes(gridSizeOld);
    else
        removeBoxes(gridSizeOld);
};

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
};

drawingTools.forEach(tool => {
    tool.addEventListener('click', selectTool.bind(this, tool));
});

leftRotater.addEventListener('click', rotateLeft);
rightRotater.addEventListener('click', rotateRight);
verticalFlipper.addEventListener('click', flipVer);
horizontalFlipper.addEventListener('click', flipHor);
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);