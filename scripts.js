let sizeSlider = document.querySelector(".size-slider>input");
let sliderText = document.querySelector(".slider-text>h2");

sliderText.textContent = `${sizeSlider.value} x ${sizeSlider.value}`;

sizeSlider.addEventListener('input', function() {
    console.log(this.value);
    sliderText.textContent = `${this.value} x ${this.value}`;
});