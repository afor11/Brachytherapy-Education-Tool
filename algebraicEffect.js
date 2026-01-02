export class AlgebraicEffect {
    constructor(...params){
        this.params = params;
    }
}

export function effectHandler({tryCode, handleCode}){
    let nextValue = {value: undefined, done: false};
    let tryCodeGenerator;
    if (tryCode?.constructor.name === "GeneratorFunction"){
        tryCodeGenerator = tryCode();
    }else{
        tryCodeGenerator = tryCode;
    }
    while (!nextValue.done){
        nextValue = tryCodeGenerator.next(
            (nextValue.value?.constructor.name === "AlgebraicEffect") ? 
                handleCode(...nextValue.value.params)
            :
                undefined
        );
    }
    if (typeof nextValue.value !== "undefined"){
        return nextValue.value;
    }
}

export function* chainEffectHandler({tryCode, handleCode}){
    let nextValue = {value: undefined, done: false};
    let tryCodeGenerator;
    if (tryCode?.constructor.name === "GeneratorFunction"){
        tryCodeGenerator = tryCode();
    }else{
        tryCodeGenerator = tryCode;
    }
    while (!nextValue.done){
        let nextArgs = undefined;
        if (nextValue.value?.constructor.name === "AlgebraicEffect"){
            if (handleCode?.constructor.name === "GeneratorFunction"){
                let handleGenerator = handleCode(...nextValue.value.params);
                let nextHandleValue = {value: undefined, done: false};
                while(!nextHandleValue.done){
                    nextHandleValue = handleGenerator.next(
                        (nextHandleValue.value?.constructor.name === "AlgebraicEffect") ? 
                            yield nextHandleValue.value
                        :
                            undefined
                    );
                }
                if (typeof nextHandleValue.value === "undefined"){
                    nextArgs = yield nextValue.value;
                }else{
                    nextArgs = nextHandleValue.value;
                }
            }else{
                nextArgs = handleCode(...nextValue.value.params)
            }
        }
        nextValue = tryCodeGenerator.next(nextArgs);
    }
    if (typeof nextValue.value !== "undefined"){
        return nextValue.value;
    }
}

/*
example algebraic effect:

function* getName(user) {
    let name = user.name;
    if (name === null) {
        name = yield new AlgebraicEffect('ask_name',false);
    }
    return name;
}
 
function* makeFriends(user1, user2) {
    user2.friendNames.push(yield* getName(user1));
    user1.friendNames.push(yield* getName(user2));
}

let arya = { name: null, friendNames: [] };
let gendry = { name: 'Gendry', friendNames: [] };
effectHandler({
    tryCode: chainEffectHandler({
        tryCode: function* () {
            yield* makeFriends(arya, gendry);
        },
        handleCode: function*(effect, log) {
            console.log(effect);
            if (log){
                console.log("a");
            }
            if (effect === 'ask_name') {
                return yield new AlgebraicEffect('get_name');
            }
        }
    }),
    handleCode: function(effect) {
        console.log(effect);
        if (effect === 'get_name') {
            return "Arya Stack";
        }
    }
})
console.log(gendry.friendNames);
*/