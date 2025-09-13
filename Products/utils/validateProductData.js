export const validateProductData = (
  { name, description, brand, category, status, timeOfDay, seasons, variants, ingredients, tags },
  { partial = false } = {}
) => {
  // ------------------- VALIDACIÓN DE CAMPOS OBLIGATORIOS -------------------
  if (!partial) {
    if (!name || !description || !brand || !category || !status || !timeOfDay || !seasons?.length) {
      return { isValid: false, message: "Todos los campos obligatorios deben estar completos" };
    }
  }

  // ------------------- VALIDAR VARIANTES -------------------
  if ((!partial && (!Array.isArray(variants) || variants.length === 0)) ||
      (partial && variants && (!Array.isArray(variants) || variants.length === 0))) {
    return { isValid: false, message: "Debe agregar al menos una variante" };
  }
  if (Array.isArray(variants)) {
    for (let v of variants) {
      if (typeof v.volume !== "number" || typeof v.price !== "number" || typeof v.stock !== "number") {
        return { isValid: false, message: "Las variantes deben tener volumen, precio y stock como números" };
      }
    }
  }

  // ------------------- VALIDAR INGREDIENTES -------------------
  if ((!partial && (!Array.isArray(ingredients) || ingredients.length === 0)) ||
      (partial && ingredients && (!Array.isArray(ingredients) || ingredients.length === 0))) {
    return { isValid: false, message: "Debe agregar al menos un ingrediente" };
  }

  // ------------------- VALIDAR TAGS -------------------
  if ((!partial && (!Array.isArray(tags) || tags.length === 0)) ||
      (partial && tags && (!Array.isArray(tags) || tags.length === 0))) {
    return { isValid: false, message: "Debe agregar al menos un tag" };
  }
  if (Array.isArray(tags)) {
    for (let tag of tags) {
      if (!tag.name || typeof tag.name !== "string" || typeof tag.intensity !== "number" || tag.intensity < 1 || tag.intensity > 10) {
        return { isValid: false, message: "Cada tag debe tener un nombre válido y una intensidad entre 1 y 10" };
      }
    }
  }

  // ------------------- VALIDAR TIME OF DAY -------------------
  if ((!partial && !["día", "noche", "día_y_noche"].includes(timeOfDay)) ||
      (partial && timeOfDay && !["día", "noche", "día_y_noche"].includes(timeOfDay))) {
    return { isValid: false, message: "'timeOfDay' debe ser 'día', 'noche' o 'día_y_noche'" };
  }

  // ------------------- VALIDAR SEASONS -------------------
  const validSeasons = ["verano", "otoño", "invierno", "primavera"];
  if ((!partial && (!Array.isArray(seasons) || !seasons.every(s => validSeasons.includes(s)))) ||
      (partial && seasons && (!Array.isArray(seasons) || !seasons.every(s => validSeasons.includes(s))))) {
    return { isValid: false, message: "'seasons' debe ser un arreglo con estaciones válidas: 'verano', 'otoño', 'invierno', 'primavera'" };
  }

  return { isValid: true };
};