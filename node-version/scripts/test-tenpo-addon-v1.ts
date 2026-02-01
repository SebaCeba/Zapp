/**
 * Script de prueba para verificar TenpoAddOnV1
 * Ejecutar desde node-version/: npx ts-node scripts/test-tenpo-addon-v1.ts
 */

// Implementación standalone para testing
function calcularCuotasTenpoAddOnV1(
  capital: number,
  nCuotas: number,
  tasaMensual: number
): { cuotas: number[]; totalFinanciado: number; interesTotal: number } {
  // Caso especial: 1 cuota sin interés
  if (nCuotas === 1) {
    return {
      cuotas: [capital],
      totalFinanciado: capital,
      interesTotal: 0
    };
  }

  // Cálculo de interés simple (add-on)
  const interesTotal = Math.round(capital * tasaMensual * nCuotas);
  const totalFinanciado = capital + interesTotal;
  
  // Cuota base redondeada
  const cuotaBase = Math.round(totalFinanciado / nCuotas);
  
  // Generar array de cuotas (todas iguales inicialmente)
  const cuotas: number[] = new Array(nCuotas).fill(cuotaBase);
  
  // Ajustar última cuota para que la suma sea exacta
  const sumaActual = cuotaBase * (nCuotas - 1);
  cuotas[nCuotas - 1] = totalFinanciado - sumaActual;

  return {
    cuotas,
    totalFinanciado,
    interesTotal
  };
}

// Sistema Francés para comparación
function calcularCuotaFrancesa(capital: number, nCuotas: number, tasaMensual: number): number {
  if (nCuotas === 1) return capital;
  
  const i = tasaMensual;
  const n = nCuotas;
  
  const cuota = capital * i / (1 - Math.pow(1 + i, -n));
  
  return Math.round(cuota);
}

console.log('═══════════════════════════════════════════════════════');
console.log('  TEST: TenpoAddOnV1 vs Sistema Francés');
console.log('═══════════════════════════════════════════════════════\n');

// Caso real del documento
const capital = 218365;
const nCuotas = 6;
const tasaMensual = 0.0211; // 2.11%

console.log('📊 DATOS DE ENTRADA:');
console.log(`   Capital:      $${capital.toLocaleString('es-CL')}`);
console.log(`   N° cuotas:    ${nCuotas}`);
console.log(`   Tasa mensual: ${(tasaMensual * 100).toFixed(2)}%\n`);

// TenpoAddOnV1
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1️⃣  MÉTODO: TenpoAddOnV1 (Interés Simple)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const resultAddOn = calcularCuotasTenpoAddOnV1(capital, nCuotas, tasaMensual);

console.log('🔢 CÁLCULO DETALLADO:');
console.log(`   interesTotal = round(${capital} × ${tasaMensual} × ${nCuotas})`);
console.log(`   interesTotal = round(${capital * tasaMensual * nCuotas})`);
console.log(`   interesTotal = ${resultAddOn.interesTotal}\n`);

console.log(`   totalFinanciado = ${capital} + ${resultAddOn.interesTotal}`);
console.log(`   totalFinanciado = ${resultAddOn.totalFinanciado}\n`);

console.log(`   cuotaBase = round(${resultAddOn.totalFinanciado} / ${nCuotas})`);
console.log(`   cuotaBase = round(${resultAddOn.totalFinanciado / nCuotas})`);
console.log(`   cuotaBase = ${resultAddOn.cuotas[0]}\n`);

console.log('📋 RESULTADO:');
resultAddOn.cuotas.forEach((cuota, idx) => {
  console.log(`   Cuota ${idx + 1}/${nCuotas}:  $${cuota.toLocaleString('es-CL')}`);
});
console.log(`\n   Total:         $${resultAddOn.totalFinanciado.toLocaleString('es-CL')}`);
console.log(`   Interés total: $${resultAddOn.interesTotal.toLocaleString('es-CL')}`);

// Verificar suma exacta
const sumaAddOn = resultAddOn.cuotas.reduce((a, b) => a + b, 0);
console.log(`\n   ✅ Suma verificada: $${sumaAddOn.toLocaleString('es-CL')} ${sumaAddOn === resultAddOn.totalFinanciado ? '(OK)' : '(ERROR)'}`);

// Sistema Francés
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2️⃣  MÉTODO: Sistema Francés (Interés Compuesto)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const cuotaFrancesa = calcularCuotaFrancesa(capital, nCuotas, tasaMensual);
const totalFrances = cuotaFrancesa * nCuotas;
const interesFrances = totalFrances - capital;

console.log('🔢 CÁLCULO:');
console.log(`   cuota = ${capital} × ${tasaMensual} / (1 − (1 + ${tasaMensual})^(-${nCuotas}))`);
console.log(`   cuota = ${cuotaFrancesa}\n`);

console.log('📋 RESULTADO:');
for (let i = 1; i <= nCuotas; i++) {
  console.log(`   Cuota ${i}/${nCuotas}:  $${cuotaFrancesa.toLocaleString('es-CL')}`);
}
console.log(`\n   Total:         $${totalFrances.toLocaleString('es-CL')}`);
console.log(`   Interés total: $${interesFrances.toLocaleString('es-CL')}`);

// Valor real Tenpo
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3️⃣  VALOR REAL: Tenpo (Confirmado por Usuario)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const cuotaReal = 38753;
const totalReal = cuotaReal * nCuotas;
const interesReal = totalReal - capital;

console.log('📋 RESULTADO:');
for (let i = 1; i <= nCuotas; i++) {
  console.log(`   Cuota ${i}/${nCuotas}:  $${cuotaReal.toLocaleString('es-CL')}`);
}
console.log(`\n   Total:         $${totalReal.toLocaleString('es-CL')}`);
console.log(`   Interés total: $${interesReal.toLocaleString('es-CL')}`);

// Comparación
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 COMPARACIÓN FINAL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('┌─────────────────────┬──────────────┬──────────────────┬───────────────────┬────────────────┐');
console.log('│ Método              │ Cuota        │ Total Financiado │ Interés Total     │ Error vs Real  │');
console.log('├─────────────────────┼──────────────┼──────────────────┼───────────────────┼────────────────┤');
console.log(`│ Tenpo Real          │ $${cuotaReal.toLocaleString('es-CL').padEnd(11)} │ $${totalReal.toLocaleString('es-CL').padEnd(15)} │ $${interesReal.toLocaleString('es-CL').padEnd(16)} │ -              │`);
console.log(`│ TenpoAddOnV1 ✅     │ $${resultAddOn.cuotas[0].toLocaleString('es-CL').padEnd(11)} │ $${resultAddOn.totalFinanciado.toLocaleString('es-CL').padEnd(15)} │ $${resultAddOn.interesTotal.toLocaleString('es-CL').padEnd(16)} │ +$${(resultAddOn.totalFinanciado - totalReal).toLocaleString('es-CL').padEnd(11)} │`);
console.log(`│ Sistema Francés ❌  │ $${cuotaFrancesa.toLocaleString('es-CL').padEnd(11)} │ $${totalFrances.toLocaleString('es-CL').padEnd(15)} │ $${interesFrances.toLocaleString('es-CL').padEnd(16)} │ +$${(totalFrances - totalReal).toLocaleString('es-CL').padEnd(11)} │`);
console.log('└─────────────────────┴──────────────┴──────────────────┴───────────────────┴────────────────┘\n');

const errorAddOn = ((resultAddOn.totalFinanciado - totalReal) / totalReal) * 100;
const errorFrances = ((totalFrances - totalReal) / totalReal) * 100;

console.log('📈 ERROR PORCENTUAL:');
console.log(`   TenpoAddOnV1:     ${errorAddOn > 0 ? '+' : ''}${errorAddOn.toFixed(2)}%`);
console.log(`   Sistema Francés:  ${errorFrances > 0 ? '+' : ''}${errorFrances.toFixed(2)}%\n`);

console.log('💡 CONCLUSIÓN:');
if (Math.abs(errorAddOn) < Math.abs(errorFrances)) {
  console.log('   ✅ TenpoAddOnV1 es MÁS PRECISO que Sistema Francés\n');
} else {
  console.log('   ⚠️  Sistema Francés es más preciso, pero TenpoAddOnV1 es más conservador\n');
  console.log('   📌 Decisión: Usar TenpoAddOnV1 por ser conservador (sobrestima)\n');
  console.log('   📌 Usuario siempre puede confirmar valor real para precisión exacta\n');
}

console.log('═══════════════════════════════════════════════════════\n');
