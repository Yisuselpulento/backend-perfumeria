import { slugify } from "../../utils/slugify.js";

export const parseFilter = value =>
  value
    ?.split(",")
    .map(v => slugify(v.trim()))
    .filter(Boolean);
