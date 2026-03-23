import asyncHandler from 'express-async-handler';
import Report from '../models/Report.js';
import PG from '../models/PG.js';
import { createNotification } from '../utils/notificationHelper.js';

// @desc   Report a PG
// @route  POST /api/reports/:pgId
export const reportPG = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason || reason.trim().length < 10) {
    res.status(400);
    throw new Error('Reason must be at least 10 characters');
  }

  const pg = await PG.findById(req.params.pgId);
  if (!pg || pg.isDeleted) {
    res.status(404);
    throw new Error('PG not found');
  }

  const report = await Report.create({
    pg: pg._id,
    reportedBy: req.user._id,
    reason: reason.trim(),
  });

  await createNotification(
    `PG reported: "${pg.title}" — ${reason.substring(0, 60)}`,
    'REPORT_PG',
    req.user._id,
    pg._id
  );

  res.status(201).json({ success: true, message: 'Report submitted', data: report });
});
