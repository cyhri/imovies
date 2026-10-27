import { Booking } from '../models/booking.model.js';
import { Show } from '../models/show.model.js';
import { Notification } from '../models/notification.model.js';

export async function createBooking(req, res, next) {
  try {
    const { showId } = req.body;
    const seatNumbers = (req.body.seatNumbers || []).map((s) => s.trim().toUpperCase());

    // 1. Verify existence and schedule status of the show
    const show = await Show.findById(showId).populate('movie', 'title');
    if (!show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found',
      });
    }

    if (show.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: `Cannot book seats for a show with status "${show.status}"`,
      });
    }

    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book seats for a show that has already started or completed',
      });
    }

    // 2. Validate seat existence and current availability in show inventory
    const seatMap = new Map((show.seats || []).map((s) => [s.seatNumber, s]));

    for (const num of seatNumbers) {
      const seat = seatMap.get(num);
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat "${num}" does not exist in the screen layout for this show`,
        });
      }
      if (seat.status !== 'available') {
        return res.status(409).json({
          success: false,
          message: `Seat "${num}" is already ${seat.status} and cannot be booked`,
        });
      }
    }

    // 3. Authoritative server-side price calculation
    const totalAmount = seatNumbers.reduce((sum, num) => sum + seatMap.get(num).price, 0);

    // 4. Atomic conditional update to prevent double-booking collisions
    // Guaranteed atomic in MongoDB standalone via document-level locks
    const updatedShow = await Show.findOneAndUpdate(
      {
        _id: showId,
        status: 'scheduled',
        seats: {
          $all: seatNumbers.map((num) => ({
            $elemMatch: { seatNumber: num, status: 'available' },
          })),
        },
      },
      {
        $set: {
          'seats.$[elem].status': 'booked',
          'seats.$[elem].reservedBy': req.user._id,
          'seats.$[elem].reservedAt': new Date(),
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
        message: 'One or more selected seats were just reserved by another user. Please choose different seats.',
      });
    }

    // 5. Create the Booking document
    const bookingReference = `IMV-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const bookedSeats = seatNumbers.map((num) => {
      const seat = seatMap.get(num);
      return {
        seatNumber: seat.seatNumber,
        tier: seat.tier,
        price: seat.price,
      };
    });

    let booking;
    try {
      booking = await Booking.create({
        bookingReference,
        user: req.user._id,
        show: showId,
        seats: bookedSeats,
        totalAmount,
        bookingStatus: 'confirmed',
        paymentStatus: 'unpaid', // Simulated unpaid per specification
      });

      // User confirmation notification
      await Notification.create({
        user: req.user._id,
        type: 'booking_confirmation',
        title: 'Booking Confirmed',
        message: `Booking ${bookingReference} for "${show.movie?.title || 'Movie'}" confirmed (${bookedSeats.length} seats). Payment status: Unpaid (Simulation Mode).`,
        metadata: { bookingId: booking._id, bookingReference },
      });
    } catch (createErr) {
      // Rollback seat reservation on booking creation failure
      await Show.updateOne(
        { _id: showId },
        {
          $set: {
            'seats.$[elem].status': 'available',
            'seats.$[elem].reservedBy': null,
            'seats.$[elem].reservedAt': null,
          },
        },
        { arrayFilters: [{ 'elem.seatNumber': { $in: seatNumbers } }] }
      );
      throw createErr;
    }

    return res.status(201).json({
      success: true,
      message: 'Tickets booked successfully',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'show',
        select: 'startTime endTime status movie theatre screen',
        populate: [
          { path: 'movie', select: 'title posterUrl duration rating language' },
          { path: 'theatre', select: 'name city address' },
          { path: 'screen', select: 'screenNumber name screenType' },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'show',
        populate: [
          { path: 'movie', select: 'title posterUrl duration rating genres language' },
          { path: 'theatre', select: 'name city address phone' },
          { path: 'screen', select: 'screenNumber name screenType seatingCapacity' },
        ],
      })
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Ownership check: users can only view their own bookings, admins can view any
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this booking',
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('show');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to cancel this booking',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled',
      });
    }

    // Cancellation business rule: cannot cancel after show start time
    if (booking.show && new Date(booking.show.startTime) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel tickets for a show that has already started or concluded',
      });
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    // Release seats back to 'available' in Show
    const seatNumbers = booking.seats.map((s) => s.seatNumber);
    const showId = booking.show._id || booking.show;

    await Show.updateOne(
      { _id: showId },
      {
        $set: {
          'seats.$[elem].status': 'available',
          'seats.$[elem].reservedBy': null,
          'seats.$[elem].reservedAt': null,
        },
      },
      {
        arrayFilters: [{ 'elem.seatNumber': { $in: seatNumbers } }],
      }
    );

    // Create notification
    await Notification.create({
      user: booking.user,
      type: 'cancellation',
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingReference} has been cancelled and seats released.`,
      metadata: { bookingId: booking._id, bookingReference: booking.bookingReference },
    });

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully and seats released',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
}