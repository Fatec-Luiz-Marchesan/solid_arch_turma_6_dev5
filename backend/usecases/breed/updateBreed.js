const { validateBreed, normalizeName } = require('../../helpers/validate-breed');

async function updateBreed({ id, data, user, BreedRepository }) {
  if (!user || !user._id) {
    return { success: false, status: 401, errors: ['Usuário não autenticado!'] };
  }

  if (!id) {
    return { success: false, status: 422, errors: ['ID inválido!'] };
  }

  const breed = await BreedRepository.findById(id);
  if (!breed || breed.deletedAt) {
    return { success: false, status: 404, errors: ['Raça não encontrada!'] };
  }

  const validation = validateBreed(data, { partial: true });
  if (!validation.isValid) {
    return { success: false, status: 422, errors: validation.errors };
  }

  const d = data || {};
  const updatePayload = {};

  const targetSpecies = d.species !== undefined ? d.species : breed.species;

  if (d.name !== undefined) {
    const name = normalizeName(d.name);
    const nameChanged = name.toLowerCase() !== String(breed.name).toLowerCase();
    const speciesChanged = d.species !== undefined && d.species !== breed.species;

    if (nameChanged || speciesChanged) {
      const existing = await BreedRepository.findByName(name, targetSpecies);
      if (existing && String(existing._id) !== String(id)) {
        return {
          success: false,
          status: 409,
          errors: ['Já existe uma raça com este nome para esta espécie!'],
        };
      }
    }
    updatePayload.name = name;
  }

  if (d.species !== undefined) updatePayload.species = d.species;
  if (d.size !== undefined) updatePayload.size = d.size;
  if (d.description !== undefined) updatePayload.description = d.description.trim();
  if (d.temperament !== undefined) {
    updatePayload.temperament = d.temperament.map((t) => t.trim());
  }
  if (d.lifeExpectancy !== undefined) {
    updatePayload.lifeExpectancy = d.lifeExpectancy;
  }
  if (d.origin !== undefined) updatePayload.origin = d.origin.trim();
  if (d.hypoallergenic !== undefined) {
    updatePayload.hypoallergenic = d.hypoallergenic;
  }
  if (d.coatType !== undefined) {
    updatePayload.coatType = d.coatType;
  }

  const updated = await BreedRepository.update(id, updatePayload);
  return { success: true, status: 200, breed: updated };
}

module.exports = { updateBreed };