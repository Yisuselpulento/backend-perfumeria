export const validateProductData = (
  {
    name,
    description,
    brand,
    category,
    status,
    timeOfDay,
    seasons,
    variants,
    ingredients,
    tags
  },
  { partial = false } = {}
) => {
  // ------------------- CAMPOS OBLIGATORIOS -------------------
  if (!partial) {
    if (!name || !description || !brand || !category || !status || !timeOfDay || !seasons?.length) {
      return { isValid: false, message: "Todos los campos obligatorios deben estar completos" };
    }
  }

  // ------------------- VALIDAR VARIANTES -------------------
  if (!partial) {
    if (!Array.isArray(variants) || variants.length === 0) {
      return { isValid: false, message: "Debe agregar al menos una variante" };
    }
  }
  if (variants) {
    if (!Array.isArray(variants) || variants.length === 0) {
      return { isValid: false, message: "Si envía variantes, debe haber al menos una" };
    }
    for (let v of variants) {
      if (typeof v.volume !== "number" || typeof v.price !== "number" || typeof v.stock !== "number") {
        return { isValid: false, message: "Las variantes deben tener volumen, precio y stock como números" };
      }
    }
  }

  // ------------------- VALIDAR INGREDIENTES -------------------
  if (!partial) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return { isValid: false, message: "Debe agregar al menos un ingrediente" };
    }
  }
  if (ingredients) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return { isValid: false, message: "Si envía ingredientes, debe haber al menos uno" };
    }
  }

  // ------------------- VALIDAR TAGS -------------------
  if (!partial) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return { isValid: false, message: "Debe agregar al menos un tag" };
    }
  }
  if (tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return { isValid: false, message: "Si envía tags, debe haber al menos uno" };
    }
    for (let tag of tags) {
      if (!tag.name || typeof tag.name !== "string" || typeof tag.intensity !== "number" || tag.intensity < 1 || tag.intensity > 10) {
        return { isValid: false, message: "Cada tag debe tener un nombre válido y una intensidad entre 1 y 10" };
      }
    }
  }

  // ------------------- VALIDAR TIME OF DAY -------------------
  const validTimes = ["día", "noche", "día_y_noche"];
  if (!partial && !validTimes.includes(timeOfDay)) {
    return { isValid: false, message: "'timeOfDay' debe ser 'día', 'noche' o 'día_y_noche'" };
  }
  if (timeOfDay && !validTimes.includes(timeOfDay)) {
    return { isValid: false, message: "'timeOfDay' debe ser 'día', 'noche' o 'día_y_noche'" };
  }

  // ------------------- VALIDAR SEASONS -------------------
  const validSeasons = ["verano", "otoño", "invierno", "primavera"];
  if (!partial && (!Array.isArray(seasons) || !seasons.every(s => validSeasons.includes(s)))) {
    return { isValid: false, message: "'seasons' debe ser un arreglo con estaciones válidas: 'verano', 'otoño', 'invierno', 'primavera'" };
  }
  if (seasons && (!Array.isArray(seasons) || !seasons.every(s => validSeasons.includes(s)))) {
    return { isValid: false, message: "'seasons' debe ser un arreglo con estaciones válidas: 'verano', 'otoño', 'invierno', 'primavera'" };
  }

  return { isValid: true };
};