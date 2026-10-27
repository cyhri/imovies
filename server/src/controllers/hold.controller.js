import { Show } from '../models/show.model.js';
import { SeatHold } from '../models/seatHold.model.js';
import { env } from '../config/env.js';
import { emitSeatHeld, emitSeatReleased } from '../socket.js';

export async function createSeatHold(req, res, next) {
  try {
    const showId = req.params.id || req.body.showId;
    const rawSeats = req.body.seatNumbers || [];
    const durationSeconds = Number(req.body.durationSeconds) || env.HOLD_DURATION_SECONDS || 300;

    // Validate seat numbers
    if (!Array.isArray(rawSeats) || rawSeats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one seatNumber is required to place a hold',
      });
    }

    const seatNumbers = [...new Set(rawSeats.map((s) => String(s).trim().toUpperCase()))];

    // Verify show
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    if (show.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot hold seats for a show with status "${show.status}"`,
      });
    }

    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot hold seats for a show that has already started or concluded',
      });
    }

    const seatMap = new Map((show.seats || []).map((s) => [s.seatNumber, s]));
    const now = new Date();

    // Validate seat existence & eligibility
    for (const num of seatNumbers) {
      const seat = seatMap.get(num);
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat "${num}" does not exist in the screen layout for this show`,
        });
      }

      // Check if seat is permanently booked
      if (seat.status === 'booked') {
        return res.status(409).json({
          success: false,
          message: `Seat "${num}" is already booked and cannot be held`,
        });
      }

      // Check if seat is actively reserved by someone else
      if (seat.status === 'reserved') {
        const isExpired = seat.holdExpiresAt && new Date(seat.holdExpiresAt) <= now;
        const isOwnedByCurrentUser =
          seat.reservedBy && seat.reservedBy.toString() === req.user._id.toString();

        if (!isExpired && !isOwnedByCurrentUser) {
          return res.status(409).json({
            success: false,
            message: `Seat "${num}" is currently held by another customer. Please choose different seats.`,
          });
        }
      }
    }

    // Authoritative total price calculation
    const totalAmount = seatNumbers.reduce((sum, num) => sum + seatMap.get(num).price, 0);

    const safeDuration = Math.min(Math.max(durationSeconds, 5), 1800); // 5 sec to 30 min
    const expiresAt = new Date(Date.now() + safeDuration * 1000);
    const holdToken = `HLD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    // Atomic conditional update on single Show document (standalone MongoDB safe)
    const updatedShow = await Show.findOneAndUpdate(
      {
        _id: showId,
        status: 'scheduled',
        seats: {
          $all: seatNumbers.map((num) => ({
            $elemMatch: {
              seatNumber: num,
              $or: [
                { status: 'available' },
                { status: 'reserved', holdExpiresAt: { $lte: now } },
                { status: 'reserved', reservedBy: req.user._id },
              ],
            },
          })),
        },
      },
      {
        $set: {
          'seats.$[elem].status': 'reserved',
          'seats.$[elem].reservedBy': req.user._id,
          'seats.$[elem].reservedAt': now,
          'seats.$[elem].holdExpiresAt': expiresAt,
          'seats.$[elem].holdToken': holdToken,
        },
      },
      {
        arrayFilters: [{ 'elem.seatNumber': { $in: seatNumbers } }],
        new: true,
      }
    );

    if (!updatedShow) {
      return res.status(409).json({
        success: false,
        message: 'One or more selected seats were just held by another customer. Please choose different seats.',
      });
    }

    // Create SeatHold record
    const seatHold = await SeatHold.create({
      holdToken,
      user: req.user._id,
      show: showId,
      seats: seatNumbers.map((num) => ({
        seatNumber: num,
        tier: seatMap.get(num).tier,
        price: seatMap.get(num).price,
      })),
      totalAmount,
      status: 'active',
      expiresAt,
    });

    // Real-time broadcast
    emitSeatHeld(showId.toString(), {
      seatNumbers,
      holdExpiresAt: expiresAt,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Seats held successfully',
      data: {
        holdToken,
        showId,
        seats: seatHold.seats,
        totalAmount,
        expiresAt,
        expiresInSeconds: Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function releaseSeatHold(req, res, next) {
  try {
    const showId = req.params.id;
    const { holdToken } = req.params;

    const hold = await SeatHold.findOne({ holdToken });
    if (!hold) {
      return res.status(404).json({
        success: false,
        message: 'Seat hold not found',
      });
    }

    // Ownership check: only owner or admin can release hold
    const isOwner = hold.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot release another customer's seat hold",
      });
    }

    if (hold.status === 'released') {
      return res.status(200).json({
        success: true,
        message: 'Seat hold was already released',
        data: hold,
      });
    }

    hold.status = 'released';
    await hold.save();

    const seatNumbers = hold.seats.map((s) => s.seatNumber);

    // Atomically reset seats in Show
    await Show.updateOne(
      { _id: showId || hold.show },
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
            'elem.holdToken': holdToken,
          },
        ],
      }
    );

    emitSeatReleased((showId || hold.show).toString(), { seatNumbers });

    return res.status(200).json({
      success: true,
      message: 'Seat hold released successfully',
      data: hold,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSeatHold(req, res, next) {
  try {
    const { holdToken } = req.params;
    const hold = await SeatHold.findOne({ holdToken });

    if (!hold) {
      return res.status(404).json({
        success: false,
        message: 'Seat hold not found',
      });
    }

    const isOwner = hold.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot view another customer's seat hold",
      });
    }

    const remainingSeconds = Math.max(0, Math.round((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));

    return res.status(200).json({
      success: true,
      data: {
        ...hold.toObject(),
        expiresInSeconds: remainingSeconds,
      },
    });
  } catch (err) {
    next(err);
  }
}