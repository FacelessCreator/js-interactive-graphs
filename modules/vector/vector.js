
class Vector {
    constructor(x=0, y=0) {
        this.x = x;
        this.y = y;
    }

    getLength() {
        return Math.sqrt(this.x*this.x+this.y*this.y);
    }
    setLength(newLength) {
        var oldLength = this.getLength();
        return new Vector(this.x * newLength / oldLength, this.y * newLength / oldLength);
    }

    getAngle() {
        return Math.atan2(this.y, this.x);
    }

    multiply(k) {
        return new Vector(this.x * k, this.y * k);
    }
    add(vect) {
        return new Vector(this.x + vect.x, this.y + vect.y);
    }
    substruct(vect) {
        return new Vector(this.x - vect.x, this.y - vect.y);
    }

    compare(vect) {
        return this.x == vect.x && this.y == vect.y;
    }

    clone() {
        return new Vector(this.x, this.y);
    }

}

export {Vector};
