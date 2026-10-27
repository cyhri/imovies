import { SeatHold } from '../models/seatHold.model.js';
import { Show } from '../models/show.model.js';
import { emitSeatExpired } from '../socket.js';

let cleanupTimer = null;

export async function cleanupExpiredHoldsNow() {
  try {
    const now = new Date();

    // 1. Find all active SeatHold records that have expired
    const expiredHolds = await SeatHold.find({
      status: 'active',
      expiresAt: { $lte: now },
    });

    if (expiredHolds.length > 0) {
      for (const hold of expiredHolds) {
        hold.status = 'expired';
        await hold.save();

        const seatNumbers = hold.seats.map((s) => s.seatNumber);
        const showId = hold.show.toString();

        // Atomically reset seats in the show
        await Show.updateOne(
          { _id: hold.show },
          {
            $set: {
              'seats.$[elem].status': 'available',
              'seats.$[elem].reservedBy': null,
              'seats.$[elem].reservedAt': null,
              'seats.$[elem].holdExpiresAt': null,
              'seats.$[elem].holdToken': null,
            },
          },
          {
            arrayFilters: [
              {
                'elem.seatNumber': { $in: seatNumbers },
                'elem.status': 'reserved',
                'elem.holdToken': hold.holdToken,
              },
            ],
          }
        );

        emitSeatExpired(showId, { seatNumbers });
      }
    }

    // 2. Also sweep any orphaned reserved seats in Show documents with holdExpiresAt <= now
    const showsWithOrphanedHolds = await Show.find({
      'seats.status': 'reserved',
      'seats.holdExpiresAt': { $lte: now },
    });

    for (const show of showsWithOrphanedHolds) {
      const expiredSeatNumbers = show.seats
        .filter((s) => s.status === 'reserved' && s.holdExpiresAt && new Date(s.holdExpiresAt) <= now)
        .map((s) => s.seatNumber);

      if (expiredSeatNumbers.length > 0) {
        await Show.updateOne(
          { _id: show._id },
          {
            $set: {
              'seats.$[elem].status': 'available',
              'seats.$[elem].reservedBy': null,
              'seats.$[elem].reservedAt': null,
              'seats.$[elem].holdExpiresAt': null,
              'seats.$[elem].holdToken': null,
            },
          },
          {
            arrayFilters: [{ 'elem.seatNumber': { $in: expiredSeatNumbers } }],
          }
        );

        emitSeatExpired(show._id.toString(), { seatNumbers: expiredSeatNumbers });
      }
    }

    return expiredHolds.length;
  } catch (err) {
    console.error('[HoldCleanup] Error running hold cleanup sweep:', err.message);
    return 0;
  }
}

export function startHoldCleanupWorker(intervalMs = 10000) {
  if (cleanupTimer) return cleanupTimer;

  // Run initial cleanup immediately
  cleanupExpiredHoldsNow().catch((err) =>
    console.error('[HoldCleanup] Initial sweep failed:', err.message)
  );

  cleanupTimer = setInterval(() => {
    cleanupExpiredHoldsNow().catch((err) =>
      console.error('[HoldCleanup] Scheduled sweep failed:', err.message)
    );
  }, intervalMs);

  return cleanupTimer;
}

export function stopHoldCleanupWorker() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}