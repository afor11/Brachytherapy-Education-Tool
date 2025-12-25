export class Dropdown {
    constructor(button, options){
        this.button = button;
        this.button.onClick = () => {
            this.showing = !this.showing;
        }
        this.options = options;
        this.showing = false;
    }
    draw(){
        if (this.showing){
            this.button.draw();
            this.options.forEach((opt) => {
                opt.draw();
            });
        }else{
            this.button.draw();
        }
    }
    checkDropdownClicked(){
        this.button.checkClicked();
        if (this.showing){
            this.options.forEach((button,ind) => {
                if (button.options){
                    if (button.checkDropdownClicked()){ // if the element selected is another dropdown, this closes any other dropdowns that are open
                        this.options.forEach((neighborDropdown,ind2) => {
                            if (neighborDropdown.showing && (ind != ind2)){
                                neighborDropdown.collapseDropdown();
                            }
                        });
                    }
                }else{
                    if (button.checkClicked()){ //this checks if any of the children buttons are clicked
                        this.showing = false;
                    }
                }
            });
        }else{
            this.collapseDropdown();
        }
        return this.showing;
    }
    collapseDropdown(){
        this.showing = false;
        this.options.forEach((option) => {
            if (option.showing){
                option.collapseDropdown();
            }
        });
    }
}