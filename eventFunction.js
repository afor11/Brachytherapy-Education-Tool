import { nothing } from './utils.js';

// every time a user input is registered, the corresponing inputHandler is called
// in the module object. inputHandlers wrap module functions such as onMouseDown
// or onKeydown. If the function it wraps is a generator function, it creates the
// Generator object by calling the generator function with .call(this), so that it
// may access the module class using the "this" keyword in it's body. It the steps
// through the generator object using .next() until it finishes the function, or
// hits a yeild statement that yeilds something other than nothing. At that point,
// if the yeilded result is a function, it executes that function using
// .call({module: this, self: nextFn.value.self}), allowing the yeilded function to
// use this.module to refer to its parent module, and this.self to refer to itself.
// If, however, the event handler wraps a normal function, it just executes as normal.

// the intended use for this system is that when a user does an input, the element
// interacted with may pass back an object of this class, and run a function on the
// module and itself. This allows elements to modify the module, change attributes
// like onMouseDown to modify how the next mouse down events will be handled, and
// modify it's own properties.

// all that being said, this is a class that defines the structure of such an object
// to be passed back by the interacted element

export class EventFunction {
    constructor ({self = undefined, func = nothing}) {
        this.self = self;
        this.func = func;
    }
}