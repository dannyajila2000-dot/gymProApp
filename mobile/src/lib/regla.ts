export interface Marca {
  valor: number;
  esMayor: boolean;
}

export function generarMarcas(minimo: number, maximo: number, paso: number, pasoMayor: number): Marca[] {
  const marcas: Marca[] = [];
  const pasos = Math.round((maximo - minimo) / paso);
  for (let i = 0; i <= pasos; i++) {
    const valor = Math.round((minimo + i * paso) * 100) / 100;
    marcas.push({ valor, esMayor: Math.round(valor) % pasoMayor === 0 });
  }
  return marcas;
}
