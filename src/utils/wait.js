
export async function wait(interval) {
    const until = Date.now() + interval;

    while (Date.now() <= until) { }
}