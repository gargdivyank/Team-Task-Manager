import { Activity } from '../models/Activity.js';

export async function logActivity({
  actorId,
  action,
  entityType,
  entityId,
  summary = '',
  projectId,
}) {
  try {
    await Activity.create({
      actorId,
      action,
      entityType,
      entityId,
      summary,
      projectId,
    });
  } catch (e) {
    console.warn('activity log failed', e.message);
  }
}
