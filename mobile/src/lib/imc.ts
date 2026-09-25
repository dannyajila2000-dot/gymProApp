export function calcularImc(pesoKg: number, alturaCm: number) {
  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

export function categoriaImc(imc: number) {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Peso saludable';
  if (imc < 30) return 'Sobre el rango saludable';
  return 'Requiere atención';
}
