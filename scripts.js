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
let isCleared = true;

let mouseDown = false;
document.body.onmousedown = () => mouseDown = true;
document.body.onmouseup = () => mouseDown = false;

let leftRotater = document.querySelector(".rotate-left");
let rightRotater = document.querySelector(".rotate-right");
let verticalFlipper = document.querySelector(".flip-ver");
let horizontalFlipper = document.querySelector(".flip-hor");
let undoButton = document.querySelector(".undo");
let redoButton = document.querySelector(".redo");

let rotationDeg = 0;

const getBoxElement = boxNum => box = document.querySelector(`.box${boxNum}`);
const getBoxColor = boxNum => gridBoxes.get(boxNum);

class changeData {
    constructor(prevColor, newColor, transformation = null) {
        this.transformation = transformation;
        this.prevColor = prevColor
        this.newColor = newColor;
    }

    set setTransform(transformation) {
        this.transformation = transformation;
    }

    set setPrev(color) {
        this.prevColor = color;
    }

    set setNew(color) {
        this.newColor = color;
    }

    get getTransform() {
        if(this.transformation == null) return;
        return this.prevColor;
    }

    get getPrev() {
        if(this.prevColor == null) return;
        return this.prevColor;
    }

    get getNew() {
        if(this.newColor == null) return;
        return this.newColor;
    }
}

class gridStatus {
    constructor() {
        this.gridStatus = new Map();
        this.prevGridStatus = null;
        this.nextGridStatus = null;
    }

    get getGridStatus() {
        return this.gridStatus;
    }

    get getPrev() {
        return this.prevGridStatus;
    }

    get getNext() {
        return this.nextGridStatus;
    }

    set setPrev(gridStatus) {
        this.prevGridStatus = gridStatus;
    }

    set setNext(gridStatus) {
        this.nextGridStatus = gridStatus;
    }

    addStatus(changeData, boxNum = "transform") {
        this.gridStatus.set(boxNum, changeData);
    }
}

class gridHistory {
    constructor() {
        this.maxLength = 20;
        this.index = 0;
        this.current = new gridStatus();
        this.head = this.current;
        this.tail = new gridStatus();
        this.head.nextGridStatus = this.tail;
        this.tail.prevGridStatus = this.head;
    }

    get getCurrent() {
        return this.current;
    }
    
    set setCurrent(gridStatus) {
        this.current = gridStatus;
    }

    updateHistory(gridStatus) {
        if(this.index == this.maxLength) {
            this.head = this.head.nextGridStatus;
            this.head.prevGridStatus = null;
            this.index--;
        }
        this.current.nextGridStatus = gridStatus;
        gridStatus.prevGridStatus = this.current;
        this.current = gridStatus;
        this.current.nextGridStatus = this.tail;
        this.tail.prevGridStatus = this.current;
        this.index++;
    }

    undo() {
        if(this.current == this.head) return null;
        let returnVal = this.current;
        this.current = this.current.prevGridStatus;
        this.index--;
        return returnVal;
    }

    redo() {
        if(this.current == this.head)
            this.current = this.head.nextGridStatus;
        else if(this.current == this.tail) 
            return null;
        let returnVal = this.current;
        this.current = this.current.nextGridStatus;
        this.index++;
        return returnVal;
    }
}

let history = new gridHistory();

colorPicker.addEventListener('input', function() {
    currentColor = `${this.value}`;
});

const selectColor = boxNum => {
    currentColor = getBoxColor(boxNum);
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

const checkColorVal = rgbVal => {
    if(rgbVal >= 255) rgbVal = 255; //make sure that the hex value does not go higher than FF
    if(rgbVal <= 0) rgbVal = 0; //make sure that the hex value does not go lower than 00
    rgbVal = (rgbVal).toString(16);
    if(rgbVal.length == 1) rgbVal = 0 + rgbVal; //if the hex value has only one digit, prepend 0 to make valid hex color
    return rgbVal;
}

//use bitwise operators to change shade of color using it's hex value
const changeShade = (box, boxNum, shade) => {
    let currentVal = parseInt(getBoxColor(boxNum).substring(1), 16);

    const r = checkColorVal((currentVal >> 16) + shade);
    const g = checkColorVal((currentVal >> 8 & 0x0000ff) + shade);
    const b = checkColorVal((currentVal & 0x0000ff) + shade);

    const newColor = `#${r}${g}${b}`;
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
  let opp;
  //mirror draw is always drawing mirrored along the horizontal
  if((Math.abs(rotationDeg)/90) % 2 == 0)
    opp = calcOppHor(boxNum);
  else
    opp = calcOppVer(boxNum);
  color(document.querySelector(`.box${opp}`), opp, currentColor);
};

const colorFill = boxNum => {
  let clusterColor = getBoxColor(boxNum);
  if(clusterColor == currentColor) return;
  fillHelper(boxNum, clusterColor);
};

//recursively fill the board to improve efficiency
const fillHelper = (boxNum, clusterColor) => {
    //end the recursive call if it is not the same as the color of original box that was clicked
    if(getBoxColor(boxNum) != clusterColor) return;
    if(getBoxColor(boxNum) == clusterColor) color(getBoxElement(boxNum), boxNum, currentColor);
    
    gridBoxes.set(boxNum, currentColor);
    //recursively call the fillHelper for all boxes directly adjacent that are in bounds of the grid
    if(!(boxNum % gridSize == 1)) fillHelper(boxNum - 1, clusterColor);
    if(!(boxNum % gridSize == 0)) fillHelper(boxNum + 1, clusterColor);
    if(!(boxNum - gridSize <= 0)) fillHelper(boxNum - gridSize, clusterColor);
    if(!(+boxNum + +gridSize > gridSize * gridSize)) fillHelper(+boxNum + +gridSize, clusterColor);
};

//the function that is called that has calls to all drawing tools
const updateBox = (boxNum, isClick) => {
    if(!mouseDown && !isClick) return;
    const box = getBoxElement(boxNum);
    switch(currentTool) {
        case colorSelector: {
            //click only tool (no hover capabilities)
            if(isClick) selectColor(boxNum);
            break;
        }
        case pen: {
            color(box, boxNum, currentColor);
            isCleared = false;
            break;
        }
        case eraser: {
            erase(box, boxNum);
            break;
        }
        case lighten: {
            lightenColor(box, boxNum);
            isCleared = false;
            break;
        }
        case darken: {
            darkenColor(box, boxNum);
            isCleared = false;
            break;
        }
        case mirrorDraw: {
            mirrorDrawing(box, boxNum);
            isCleared = false;
            break;
        }
        case fill: {
            //click only tool (no hover capabilities)
            if(isClick) colorFill(boxNum);
            isCleared = false;
            break;
        }
        default: {
            break;
        }
    }
};


grid.onmouseleave = () => document.body.style.cursor = "default";
//add hover highlight to give visual feedback to user when using drawing tools
const hoverEffect = boxNum => {
    if(currentTool == null) return;
    const box = getBoxElement(boxNum);
    if(!mouseDown)
        document.body.style.cursor = "pointer";
    else
        document.body.style.cursor = "default";
    box.classList.toggle("hover");
    box.style.setProperty('--box-highlight', doubleVLight);

    //gets rid of side borders if the box is on the edge of the grid
    if(boxNum % gridSize == 1) box.classList.toggle("left-edge");
    if(boxNum % gridSize == 0) box.classList.toggle("right-edge");
    if(boxNum - gridSize <= 0) box.classList.toggle("top-edge");
    if(+boxNum + +gridSize > gridSize * gridSize) box.classList.toggle("bottom-edge");
};

const clearBoard = () => {
    if(isCleared) return;
    isCleared = true;
    for(const boxNum of gridBoxes.keys()) {
        erase(document.querySelector(`.box${boxNum}`), boxNum);
    }
};

clear.addEventListener('click', clearBoard);

const rotateLeft = isHistory => {
    if(!isHistory) {
        history.updateHistory(new gridStatus());
        history.current.addStatus(new changeData(null, null, "rotateLeft"));
    }
    if(Math.abs(rotationDeg) == 270)
        rotationDeg = 0;
    else
        rotationDeg -= 90;
    grid.style.transform = `rotate(${rotationDeg}deg)`;
};

const rotateRight = isHistory => {
    if(!isHistory) {
        history.updateHistory(new gridStatus());
        history.current.addStatus(new changeData(null, null, "rotateRight"));
    }
    if(Math.abs(rotationDeg) == 270)
        rotationDeg = 0;
    else
        rotationDeg += 90;
    grid.style.transform = `rotate(${rotationDeg}deg)`;
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
        const currBox = getBoxElement(curr);
        const currColor = getBoxColor(curr);
        const oppBox = getBoxElement(opp);
        const oppColor = getBoxColor(opp);
        
        color(currBox, curr, oppColor);
        color(oppBox, opp, currColor)
    }
};

//flips every column
const flipVer = isHistory => {
    if(!isHistory) {
        history.updateHistory(new gridStatus());
        history.current.addStatus(new changeData(null, null, "flipVer"));
    }
    for(let i = 1; i <= gridSize; i++) {
        flipColRow(i, "col");
    }
};

//flips every row
const flipHor = isHistory => {
    if(!isHistory) {
        history.updateHistory(new gridStatus());
        history.current.addStatus(new changeData(null, null, "flipHor"));
    }
    for(let i = 0; i < gridSize; i++) {
        flipColRow(i, "row");
    }
};

//takes into account the rotation degree so horizontal and vertical flips are maintained properly
const flip = flipType => {
    if(flipType == 'hor') {
        if((Math.abs(rotationDeg)/90) % 2 == 0)
            flipHor(false);
        else
            flipVer(false);
    }
    else if(flipType == 'ver') {
        if((Math.abs(rotationDeg)/90) % 2 == 0)
            flipVer(false);
        else
            flipHor(false);
    }
}

const undoRedo = (historyShift, doType) => {
    if(historyShift.gridStatus.has("transform")) {
        const transformation = historyShift.gridStatus.get("transform").transformation;

        switch(transformation) {
            case "rotateRight": {
                if(doType == "undo") 
                    rotateLeft(true);
                else if(doType =="redo") 
                    rotateRight(true);
                break;
            }
            case "rotateLeft": {
                if(doType == "undo") 
                    rotateRight(true);
                else if(doType =="redo") 
                    rotateLeft(true);
                break;
            }
            case "flipVer": {
                flipVer(true);
                break;
            }
            case "flipHor": {
                flipHor(true);
                break;
            }
            default: {
                break;
            }
        }
    }
}

const undo = () => {
    historyShift = history.undo();
    console.log(historyShift);
    console.log(history);
    if(historyShift) undoRedo(historyShift, "undo");
};

const redo = () => {
    historyShift = history.redo();
    console.log(historyShift);
    console.log(history);
    if(historyShift) undoRedo(historyShift, "redo");
};

const addEvents = (box, boxNum) => {
    box.addEventListener("mouseover", updateBox.bind(this, boxNum, false));
    box.addEventListener("mousedown", updateBox.bind(this, boxNum, true));
    //hovereffect is applied when house goes into a box then is unapplied after it leaves the box
    box.addEventListener("mouseenter", hoverEffect.bind(this, boxNum));
    box.addEventListener("mouseleave", hoverEffect.bind(this, boxNum));
}

//base loading of grid
const loadGrid = () => {
    sliderText.textContent = `${gridSize} x ${gridSize}`;
    for(let i = 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        addEvents(box, i);
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, defaultColor);
    }
};

//adds boxes when the size is changed, but only the extra added boxes to save need of remaking board
const addBoxes = gridSizeOld => {
    clearBoard();
    for(let i = gridSizeOld * gridSizeOld + 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        addEvents(box, i);
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

leftRotater.addEventListener('click', rotateLeft.bind(this, false));
rightRotater.addEventListener('click', rotateRight.bind(this, false));
verticalFlipper.addEventListener('click', flip.bind(this, 'ver'));
horizontalFlipper.addEventListener('click', flip.bind(this, 'hor'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);