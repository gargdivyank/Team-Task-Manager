export function apiMessage(error) {
  const data = error?.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => e.msg || e.message || e.path).join('. ');
  }
  return data?.message || error?.message || 'Something went wrong';
}
