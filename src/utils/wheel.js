// Direction of a wheel gesture: 1, -1 or 0. Shift + wheel scrolls horizontally on macOS, hence deltaX.
export function wheelDirection(event) {
    return Math.sign(event.deltaY || event.deltaX);
}
