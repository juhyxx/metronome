export class Accent {
    static value = {
        SUBDIV: 'subdiv',
        NONE: 'none',
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high'
    };

    static queue = [
        this.value.NONE,
        this.value.LOW,
        this.value.MEDIUM,
        this.value.HIGH
    ];

    static next(accent) {
        const index = (this.queue.indexOf(accent) + 1) % this.queue.length;

        return this.queue[index];
    }
}
