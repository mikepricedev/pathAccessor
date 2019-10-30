"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @note
 * When the done flag is `true`, the value is an Array of KeyValueNode
 * breakpoints where where wildcard keys had no key literals on doc.
 */
class TraversePathResult {
    constructor(done, value, isWildcard) {
        this.done = done;
        this.value = value;
        this.isWildcard = isWildcard;
    }
    // Accessors
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}
exports.default = TraversePathResult;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhdmVyc2VQYXRoUmVzdWx0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1RyYXZlcnNlUGF0aFJlc3VsdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBOzs7O0dBSUc7QUFDSCxNQUFxQixrQkFBa0I7SUFHckMsWUFBcUIsSUFBVSxFQUNwQixLQUF3RCxFQUN4RCxVQUE4QztRQUZwQyxTQUFJLEdBQUosSUFBSSxDQUFNO1FBQ3BCLFVBQUssR0FBTCxLQUFLLENBQW1EO1FBQ3hELGVBQVUsR0FBVixVQUFVLENBQW9DO0lBQ3hELENBQUM7SUFFRixZQUFZO0lBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFFdEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztJQUUvQixDQUFDO0NBRUY7QUFmRCxxQ0FlQyJ9