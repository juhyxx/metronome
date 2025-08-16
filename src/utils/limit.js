export function limit(value, min, max) {
    value = Math.max(value, min);
    value = Math.min(value, max);
    return value;
}
