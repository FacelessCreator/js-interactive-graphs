
function createVector2D(x=0, y=0) {
    return {
        x: x,
        y: y
    };
}

function getVectorLength(vect) {
    return Math.sqrt(vect.x*vect.x+vect.y*vect.y);
}

function setVectorLength(vect, newLength) {
    var oldLength = getVectorLength(vect);
    return {
        x: vect.x * newLength / oldLength,
        y: vect.y * newLength / oldLength
    };
}
