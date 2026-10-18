// JSON wrapper around localStorage that never throws (storage can be disabled, e.g. in private mode).
export const storage = {
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // storage is unavailable, settings live for this session only
        }
    }
};
