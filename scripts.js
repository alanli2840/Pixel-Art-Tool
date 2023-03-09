const sizeSlider = document.querySelector(".size-slider>input");
const sliderText = document.querySelector(".slider-text>div");
const colorPicker = document.querySelector(".color-picker");

const leftRotater = document.querySelector(".rotate-left");
const rightRotater = document.querySelector(".rotate-right");
const verticalFlipper = document.querySelector(".flip-ver");
const horizontalFlipper = document.querySelector(".flip-hor");
const undoButton = document.querySelector(".undo");
const redoButton = document.querySelector(".redo");

const drawingTools = document.querySelectorAll(".drawing-tools .tool-button");
const colorSelector = document.querySelector(".color-selector");
const pen = document.querySelector(".pen");
const eraser = document.querySelector(".eraser");
const lighten = document.querySelector(".lighten");
const darken = document.querySelector(".darken");
const mirrorDraw = document.querySelector(".mirror-draw");
const fill = document.querySelector(".fill");
const clear = document.querySelector(".clear-button");

const defaultColor = "#343A40";
let currentColor = "#000000";
const grid = document.querySelector(".grid");
let gridBoxes = new Map();
let gridColors = new Map();
let gridSize = sizeSlider.value;

let mouseDown = false;
document.querySelector(".grid-section").onmousedown = () => mouseDown = true;
document.querySelector(".grid-section").onmouseup = () => mouseDown = false;

let currentTool = null;
let rotationDeg = 0;

const getBoxElement = boxNum => box = document.querySelector(`.box${boxNum}`);
const getBoxColor = boxNum => gridBoxes.get(boxNum);

//class to store individual pieces of data for undo/redo
class changeData {
    //a change can either be a transformation or color change
    //if transform, there are no colors set
    //if color, contains previous color for undo and new color for redo
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
        return this.transformation;
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
    //gridStatus is a doubly-linked list node that contains a map of all changes
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

    addStatus(data, boxNum = "transform") {
        //if gridStatus already has boxNum, that means it's from changeShade
        //so, to preserve the first prevColor, only change the newColor for the changeData
        if(this.gridStatus.has(boxNum))
            this.gridStatus.set(boxNum, new changeData(this.gridStatus.get(boxNum).prevColor, data.newColor));
        else
            this.gridStatus.set(boxNum, data);
    }
}

//history manager to cycle through undo/redo that is a doubly linked list
class gridHistory {
    constructor() {
        //maxLength that can be changed
        this.maxLength = 100;
        this.index = 0;
        //head and tail are blank gridStatus values to allow stoppers for when reaching the ends for undo/redo
        this.head = new gridStatus();
        this.tail = new gridStatus();
        this.current = this.head;
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
        //starts cutting off elements from the beginning of list if maxLength is reached
        if(this.index == this.maxLength) {
            this.head = this.head.nextGridStatus;
            this.head.prevGridStatus = null;
            this.index--;
        }
        //if current is tail from redo, go back to a non-empty gridStatus (tail.prevGridStatus)
        if(this.current == this.tail) this.current = this.tail.prevGridStatus;
        this.current.nextGridStatus = gridStatus;
        gridStatus.prevGridStatus = this.current;
        this.current = gridStatus;
        this.current.nextGridStatus = this.tail;
        this.tail.prevGridStatus = this.current;
        this.index++;
    }

    undo() {
        //no undos when history has no changes yet or the end is reached
        if(this.head.nextGridStatus == this.tail || this.current == this.head) {
            return null;
        }
        else if(this.current == this.tail) {
            this.current = this.current.prevGridStatus;
        }
        //returnVal has to be the current one as it contains both the prev and new changes
        let returnVal = this.current;
        this.current = this.current.prevGridStatus;
        if(this.current == this.head)
            this.index = 0;
        else
            this.index--;
        return returnVal;
    }

    redo() {
        //no undos when history has no changes yet or the end is reached
        if(this.head.nextGridStatus == this.tail || this.current == this.tail) {
            return null;
        }
        this.current = this.current.nextGridStatus;
        if(this.current != this.tail) this.index++;
        return this.current;
    }
}

let history = new gridHistory();

colorPicker.addEventListener('input', function() {
    currentColor = `${this.value}`;
});

//update the map of gridColors to see what colors are currently used
const updateColors = (color, change) => {
    if(gridColors.has(color))
        gridColors.set(color, +gridColors.get(color) + +change);
    else
        gridColors.set(color, change);
}

const selectColor = boxNum => {
    currentColor = getBoxColor(boxNum);
    colorPicker.value = currentColor;
};

const color = (box, boxNum, newColor, isHistory = false) => {
    const prevColor = getBoxColor(boxNum);
    if(prevColor == newColor) return;
    
    updateColors(prevColor, -1);
    updateColors(newColor, 1);

    if(!isHistory) history.current.addStatus(new changeData(prevColor, newColor), boxNum);

    box.style.backgroundColor = newColor;
    gridBoxes.set(boxNum, newColor);
};

const erase = (box, boxNum) => color(box, boxNum, defaultColor);

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

const lightenColor = (box, boxNum) => changeShade(box, boxNum, 8);

const darkenColor = (box, boxNum) => changeShade(box, boxNum, -8);

//calculate the location of horizontally opposite box
const calcOppHor = boxNum => {
    //the opposite box is the same if the box is dead center in the column
    if(((boxNum * 2) - 1) == gridSize) return boxNum;

    const column = (boxNum - 1) % gridSize;
    let opp;
    if(column <= gridSize/2)
        opp = gridSize - column - 1 + (boxNum - column);
    else
        opp =  (boxNum - column) + (gridSize - column - 1);

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
  if(clusterColor == currentColor) {
    //since updateBox creates a new current, move pointer back to prevent useless gridSatus
    history.current = history.current.prevGridStatus;
    return;
  }
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
    if(currentTool != null && currentTool != colorSelector && isClick) {
        history.updateHistory(new gridStatus());
    }
    const box = getBoxElement(boxNum);
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

    //gets rid of side borders if the box is on the edge of the grid
    if(boxNum % gridSize == 1) box.classList.toggle("left-edge");
    if(boxNum % gridSize == 0) box.classList.toggle("right-edge");
    if(boxNum - gridSize <= 0) box.classList.toggle("top-edge");
    if(+boxNum + +gridSize > gridSize * gridSize) box.classList.toggle("bottom-edge");
};

const clearBoard = () => {
    //only clear if all grid boxes are defaultColor
    if(gridColors.get(defaultColor) == gridSize * gridSize) return;
    history.updateHistory(new gridStatus());
    isCleared = true;
    for(const boxNum of gridBoxes.keys()) {
        erase(getBoxElement(boxNum ), boxNum);
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
        
        color(currBox, curr, oppColor, true);
        color(oppBox, opp, currColor, true)
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
    else {
        for(const [boxNum, changeData] of historyShift.gridStatus.entries()) {
            let updatedColor;
            if(doType == "undo")
                updatedColor = changeData.prevColor;
            else if(doType == "redo")
                updatedColor = changeData.newColor;
            
            color(getBoxElement(boxNum), boxNum, updatedColor, true);
        }
    }
}

const undo = () => {
    historyShift = history.undo();
    if(historyShift) undoRedo(historyShift, "undo");
};

const redo = () => {
    historyShift = history.redo();
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
    gridColors.set(defaultColor, gridSize * gridSize);
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
    gridColors = new Map();
    gridColors.set(defaultColor, gridSize * gridSize);
};

//removes boxes when the size is changed, removing from existing boxes to save need of remaking board
const removeBoxes = gridSizeOld => {
    clearBoard();
    for(let i = gridSize * gridSize + 1; i <= gridSizeOld * gridSizeOld; i++) {
        const box = document.querySelector(`.box${i}`);
        box.remove();
        gridBoxes.delete(i);
    }
    gridColors = new Map();
    gridColors.set(defaultColor, gridSize * gridSize);
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
    
    history = new gridHistory();
};

sizeSlider.addEventListener('input', function() {
    if(this.value != gridSize) {
        updateGrid(gridSize, this.value);
    }
});

document.addEventListener('DOMContentLoaded', loadGrid());

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

drawingTools.forEach(tool => tool.addEventListener('click', selectTool.bind(this, tool)));

leftRotater.addEventListener('click', rotateLeft.bind(this, false));
rightRotater.addEventListener('click', rotateRight.bind(this, false));
verticalFlipper.addEventListener('click', flip.bind(this, 'ver'));
horizontalFlipper.addEventListener('click', flip.bind(this, 'hor'));
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

ctrlDown = false;

document.addEventListener("keydown", keyEvent => {
    if(keyEvent.key == "Control") ctrlDown = true;
    if(keyEvent.repeat == true) return;
    if(ctrlDown) {
        switch(keyEvent.key) {
            case "z": {
                undo();
                break;
            }
            case "y": {
                redo();
                break;
            }
            default: {
                break;
            }
        }
    }
    else {
        switch(keyEvent.key) {
            case "r": {
                rotateLeft();
                break;
            }
            case "t": {
                rotateRight();
                break;
            }
            case "f": {
                flipVer();
                break;
            }
            case "g": {
                flipHor();
                break;
            }
            case "c": {
                clearBoard();
                break;
            }
            default: {
                break;
            }
        }
    }
});

document.addEventListener("keyup", keyEvent => {
    if(keyEvent.key == "Control") ctrlDown = false;
});