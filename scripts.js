let sizeSlider = document.querySelector(".size-slider>input");
let sliderText = document.querySelector(".slider-text>div");

let grid = document.querySelector(".grid");
let gridBoxes = new Map();
let gridSize = sizeSlider.value;

let drawingTools = document.querySelectorAll(".drawing-tools .tool-button");

const loadGrid = () => {
    sliderText.textContent = `${gridSize} x ${gridSize}`;
    for(let i = 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, 'none');
    }
}

const addBoxes = (gridSizeOld) => {
    for(let i = gridSizeOld * gridSizeOld + 1; i <= gridSize * gridSize; i++) {
        const box = document.createElement("div");
        grid.appendChild(box).className = `grid-box box${i}`;
        gridBoxes.set(i, 'none');
    }
}

const removeBoxes = (gridSizeOld) => {
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