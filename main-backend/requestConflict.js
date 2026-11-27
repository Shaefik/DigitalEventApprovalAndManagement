
const mongoose = require('mongoose');

const RequestLock = mongoose.model(
  'RequestLock',
  new mongoose.Schema({
    _id: String,
    version: { type: Number, default: 0 }
  })
);

function fail(message, status = 400) {
  const error = new Error(message);
  error.statusCode = status;
  throw error;
}

function validDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) return false;

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function validTime(value) {
  return typeof value === 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function saveWithoutConflict(Request, Room, request) {
  const data = request.data || {};
  const isBooking = request.type === 'booking';

  if (!['od', 'booking'].includes(request.type)) {
    fail('Invalid request type.');
  }

  if (!validDate(data.date)) {
    fail('Please select a valid date.');
  }

  let lockKey;

  const filter = {
    _id: { $ne: request._id },
    type: request.type,
    status: { $in: ['Pending', 'Approved'] },
    'data.date': data.date
  };

  if (isBooking) {
    if (
      typeof data.room !== 'string' ||
      !data.room.trim()
    ) {
      fail('Please select a valid hall.');
    }

    if (
      !validTime(data.start) ||
      !validTime(data.end) ||
      data.start >= data.end
    ) {
      fail('End time must be after start time.');
    }

    const room = await Room.findOne({
      name: data.room.trim(),
      active: true
    }).collation({
      locale: 'en',
      strength: 2
    }).lean();

    if (!room) {
      fail('Selected hall is unavailable.');
    }

    data.room = room.name;
    request.data = data;
    request.markModified('data');

    lockKey = `booking:${room.name.toLowerCase()}:${data.date}`;

    filter['data.room'] = room.name;
    filter['data.start'] = { $lt: data.end };
    filter['data.end'] = { $gt: data.start };

  } else {
    lockKey = `od:${request.applicantId}:${data.date}`;
    filter.applicantId = request.applicantId;
  }

  // Ensure the shared lock document exists.
  try {
    await RequestLock.updateOne(
      { _id: lockKey },
      { $setOnInsert: { version: 0 } },
      { upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {

      // Serialize requests for the same hall/date
      // or the same student/date.
      await RequestLock.updateOne(
        { _id: lockKey },
        { $inc: { version: 1 } },
        { session }
      );

      if (!request.isNew) {
        const current = await Request.findById(
          request._id
        ).session(session).lean();

        if (
          !current ||
          !['Draft', 'Rejected'].includes(current.status)
        ) {
          fail('This request has already been submitted.', 409);
        }
      }

      const conflict = await Request.findOne(filter)
        .collation({ locale: 'en', strength: 2 })
        .session(session)
        .lean();

      if (conflict) {
        if (isBooking) {
          fail(
            `Hall already booked from ${conflict.data.start} ` +
            `to ${conflict.data.end} on ${data.date}. ` +
            `Please choose another time or hall.`,
            409
          );
        }

        fail(
          `You already have an active OD request on ${data.date}.`,
          409
        );
      }

      // Use a fresh document for each transaction attempt.
      if (request.isNew) {
        await Request.create(
          [request.toObject()],
          { session }
        );
      } else {
        await Request.updateOne(
          { _id: request._id },
          {
            $set: {
              status: request.status,
              data: request.data,
              approvals: request.toObject().approvals,
              history: request.toObject().history
            }
          },
          { session, runValidators: true }
        );
      }
    });

    return request;

  } finally {
    await session.endSession();
  }
}

module.exports = {
  saveWithoutConflict,
  RequestLock
};
