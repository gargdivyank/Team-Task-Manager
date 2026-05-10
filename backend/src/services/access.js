/** Normalizes a ref that may be an ObjectId, a string id, or a populated subdoc. */
function refToId(ref) {
  if (ref == null) return '';
  if (typeof ref === 'object' && ref._id != null) {
    return ref._id.toString();
  }
  return ref.toString();
}

/**
 * Determines if a user can access a project's data.
 * Admin: all projects; Member: creator or listed member.
 */
export function canAccessProject(user, project) {
  if (!user || !project) return false;
  if (user.role === 'admin') return true;
  const uid = user._id.toString();
  if (refToId(project.createdBy) === uid) return true;
  const members = project.members || [];
  return members.some((m) => refToId(m) === uid);
}

/** Member ids including creator as implicit member (works with populate() or plain ObjectIds). */
export function projectMemberIds(project) {
  const ids = new Set();
  const creatorId = refToId(project.createdBy);
  if (creatorId) ids.add(creatorId);
  for (const m of project.members || []) {
    const mid = refToId(m);
    if (mid) ids.add(mid);
  }
  return [...ids];
}
