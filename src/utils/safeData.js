export const safeData = (result, ...keys) => {
  if (!result || result.status !== "fulfilled") return [];
  let val = result.value?.data;
  for (const key of keys) {
    if (val && typeof val === "object" && key in val) {
      val = val[key];
    }
  }
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object") {
    if (Array.isArray(val.data)) return val.data;
  }
  return [];
};
