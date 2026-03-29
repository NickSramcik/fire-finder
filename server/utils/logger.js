import ActivityLog from '../models/ActivityLog.js';

/**
 * Write an entry to the activity log.
 * Never throws — logging errors are printed but never crash the caller.
 *
 * @param {'success'|'error'|'reset'} type
 * @param {'fire'|'perimeter'|'hotspot'} source
 * @param {'auto'|'manual'} trigger
 * @param {string} message  Short summary shown collapsed
 * @param {object} [details]  Counts, error info, etc. shown when expanded
 */
export async function logActivity({ type, source, trigger, message, details = null }) {
    try {
        await ActivityLog.create({ type, source, trigger, message, details });
    } catch (err) {
        // Never let a logging failure crash a renewal
        console.error('Failed to write activity log:', err.message);
    }
}
