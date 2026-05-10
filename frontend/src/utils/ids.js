/** Normalize Mongo-style id fields from API payloads. */
export function nid(entity) {
  if (!entity) return '';
  return entity._id?.toString?.() ?? entity.id?.toString?.() ?? String(entity);
}
