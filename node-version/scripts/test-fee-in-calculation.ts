/**
 * Test: Verificar cálculo TenpoAddOnV1 con fee integrado
 * 
 * Este script verifica que el fee se integre correctamente en la base financiada
 * y que el interés se calcule sobre (capital + fee).
 */

import { TenpoCalculatorService } from '../src/services/tenpo-calculator.service';

const calculator = new TenpoCalculatorService();

console.log('='.repeat(80));
console.log('TEST: TenpoAddOnV1 con Fee Integrado en Base Financiada');
console.log('='.repeat(80));

// Caso 1: Ejemplo del documento (capital $218,365, 3 cuotas, 2.11%, fee 2%)
console.log('\n📋 Caso 1: Compra $218,365 - 3 cuotas - Tasa 2.11% - Fee 2%');
console.log('-'.repeat(80));

const capital1 = 218365;
const nCuotas1 = 3;
const tasaMensual1 = 0.0211;
const feePct1 = 0.02;

const result1 = calculator.generarCalendarioCuotas(
  capital1,
  nCuotas1,
  new Date('2025-02-01'),
  true,
  tasaMensual1,
  feePct1
);

console.log('Entrada:');
console.log(`  Capital: $${capital1.toLocaleString()}`);
console.log(`  Cuotas: ${nCuotas1}`);
console.log(`  Tasa mensual: ${(tasaMensual1 * 100).toFixed(2)}%`);
console.log(`  Fee %: ${(feePct1 * 100).toFixed(2)}%`);

console.log('\nResultado:');
console.log(`  feeAmountClp: $${result1.feeAmountClp?.toLocaleString() ?? 0}`);
const financedBase1 = capital1 + (result1.feeAmountClp ?? 0);
console.log(`  financedBaseClp: $${financedBase1.toLocaleString()} (capital + fee)`);
console.log(`  interesTotal: $${result1.interesTotal.toLocaleString()}`);
console.log(`  totalFinanciado: $${result1.totalFinanciado.toLocaleString()}`);
console.log(`  cuotas: [${result1.cuotas.map(c => `$${c.toLocaleString()}`).join(', ')}]`);

// Valores esperados según documento (corregidos por redondeo exacto)
const expectedFee1 = 4367;
const expectedBase1 = 222732;
const expectedInterest1 = 14099; // round(222732 × 0.0211 × 3)
const expectedTotal1 = 236831;   // 222732 + 14099
const expectedQuota1 = 78944;    // round(236831 / 3)

console.log('\nAserciones:');
const assertions1 = [
  { name: 'feeAmountClp', got: result1.feeAmountClp, expected: expectedFee1 },
  { name: 'financedBaseClp', got: financedBase1, expected: expectedBase1 },
  { name: 'interesTotal', got: result1.interesTotal, expected: expectedInterest1 },
  { name: 'totalFinanciado', got: result1.totalFinanciado, expected: expectedTotal1 },
  { name: 'cuota[0]', got: result1.cuotas[0], expected: expectedQuota1 }
];

let allPassed = true;
assertions1.forEach(a => {
  const pass = a.got === a.expected;
  console.log(`  ${pass ? '✅' : '❌'} ${a.name}: ${a.got?.toLocaleString()} ${pass ? '===' : '!=='} ${a.expected.toLocaleString()}`);
  if (!pass) allPassed = false;
});

// Caso 2: Sin fee (backward compatibility)
console.log('\n\n📋 Caso 2: Compra $100,000 - 3 cuotas - Tasa 2.11% - SIN Fee');
console.log('-'.repeat(80));

const capital2 = 100000;
const nCuotas2 = 3;
const tasaMensual2 = 0.0211;
const feePct2 = null; // Sin fee

const result2 = calculator.generarCalendarioCuotas(
  capital2,
  nCuotas2,
  new Date('2025-02-01'),
  true,
  tasaMensual2,
  feePct2
);

console.log('Entrada:');
console.log(`  Capital: $${capital2.toLocaleString()}`);
console.log(`  Cuotas: ${nCuotas2}`);
console.log(`  Tasa mensual: ${(tasaMensual2 * 100).toFixed(2)}%`);
console.log(`  Fee %: null (sin fee)`);

console.log('\nResultado:');
console.log(`  feeAmountClp: $${result2.feeAmountClp?.toLocaleString() ?? 0}`);
const financedBase2 = capital2 + (result2.feeAmountClp ?? 0);
console.log(`  financedBaseClp: $${financedBase2.toLocaleString()} (debe ser = capital)`);
console.log(`  interesTotal: $${result2.interesTotal.toLocaleString()}`);
console.log(`  totalFinanciado: $${result2.totalFinanciado.toLocaleString()}`);
console.log(`  cuotas: [${result2.cuotas.map(c => `$${c.toLocaleString()}`).join(', ')}]`);

// Valores esperados
const expectedFee2 = 0;
const expectedBase2 = 100000;
const expectedInterest2 = Math.round(100000 * 0.0211 * 3); // 6,330
const expectedTotal2 = 100000 + expectedInterest2;

console.log('\nAserciones:');
const assertions2 = [
  { name: 'feeAmountClp', got: result2.feeAmountClp ?? 0, expected: expectedFee2 },
  { name: 'financedBaseClp', got: financedBase2, expected: expectedBase2 },
  { name: 'interesTotal', got: result2.interesTotal, expected: expectedInterest2 },
  { name: 'totalFinanciado', got: result2.totalFinanciado, expected: expectedTotal2 }
];

assertions2.forEach(a => {
  const pass = a.got === a.expected;
  console.log(`  ${pass ? '✅' : '❌'} ${a.name}: ${a.got?.toLocaleString()} ${pass ? '===' : '!=='} ${a.expected.toLocaleString()}`);
  if (!pass) allPassed = false;
});

// Caso 3: Fee = 0% (explícito)
console.log('\n\n📋 Caso 3: Compra $50,000 - 2 cuotas - Tasa 2.11% - Fee 0%');
console.log('-'.repeat(80));

const capital3 = 50000;
const nCuotas3 = 2;
const tasaMensual3 = 0.0211;
const feePct3 = 0; // Fee 0% explícito

const result3 = calculator.generarCalendarioCuotas(
  capital3,
  nCuotas3,
  new Date('2025-02-01'),
  true,
  tasaMensual3,
  feePct3
);

console.log('Entrada:');
console.log(`  Capital: $${capital3.toLocaleString()}`);
console.log(`  Cuotas: ${nCuotas3}`);
console.log(`  Tasa mensual: ${(tasaMensual3 * 100).toFixed(2)}%`);
console.log(`  Fee %: 0% (explícito)`);

console.log('\nResultado:');
console.log(`  feeAmountClp: $${result3.feeAmountClp?.toLocaleString() ?? 0}`);
const financedBase3 = capital3 + (result3.feeAmountClp ?? 0);
console.log(`  financedBaseClp: $${financedBase3.toLocaleString()} (debe ser = capital)`);
console.log(`  interesTotal: $${result3.interesTotal.toLocaleString()}`);
console.log(`  totalFinanciado: $${result3.totalFinanciado.toLocaleString()}`);

const assertions3 = [
  { name: 'feeAmountClp', got: result3.feeAmountClp ?? 0, expected: 0 },
  { name: 'financedBaseClp === capital', got: financedBase3, expected: capital3 }
];

console.log('\nAserciones:');
assertions3.forEach(a => {
  const pass = a.got === a.expected;
  console.log(`  ${pass ? '✅' : '❌'} ${a.name}: ${a.got?.toLocaleString()} ${pass ? '===' : '!=='} ${a.expected.toLocaleString()}`);
  if (!pass) allPassed = false;
});

// Caso 4: Comparación directa sin fee vs con fee
console.log('\n\n📊 Caso 4: Comparación Sin Fee vs Con Fee (mismo capital)');
console.log('-'.repeat(80));

const capital4 = 200000;
const nCuotas4 = 3;
const tasaMensual4 = 0.0211;

const sinFee = calculator.generarCalendarioCuotas(
  capital4, nCuotas4, new Date('2025-02-01'), true, tasaMensual4, null
);

const conFee = calculator.generarCalendarioCuotas(
  capital4, nCuotas4, new Date('2025-02-01'), true, tasaMensual4, 0.02
);

console.log('Capital: $200,000 | Cuotas: 3 | Tasa: 2.11%\n');

console.log('SIN FEE:');
console.log(`  Base financiada: $${capital4.toLocaleString()}`);
console.log(`  Interés total: $${sinFee.interesTotal.toLocaleString()}`);
console.log(`  Total financiado: $${sinFee.totalFinanciado.toLocaleString()}`);
console.log(`  Cuota mensual: $${sinFee.cuotas[0].toLocaleString()}`);

const feeAmount4 = conFee.feeAmountClp ?? 0;
const financedBase4 = capital4 + feeAmount4;

console.log('\nCON FEE 2%:');
console.log(`  Fee: $${feeAmount4.toLocaleString()}`);
console.log(`  Base financiada: $${financedBase4.toLocaleString()} (+${((feeAmount4 / capital4) * 100).toFixed(2)}%)`);
console.log(`  Interés total: $${conFee.interesTotal.toLocaleString()} (+$${(conFee.interesTotal - sinFee.interesTotal).toLocaleString()})`);
console.log(`  Total financiado: $${conFee.totalFinanciado.toLocaleString()} (+$${(conFee.totalFinanciado - sinFee.totalFinanciado).toLocaleString()})`);
console.log(`  Cuota mensual: $${conFee.cuotas[0].toLocaleString()} (+$${(conFee.cuotas[0] - sinFee.cuotas[0]).toLocaleString()})`);

const incrementoPct = ((conFee.totalFinanciado - sinFee.totalFinanciado) / sinFee.totalFinanciado) * 100;
console.log(`\nIncremento total: +${incrementoPct.toFixed(2)}%`);

// Resultado final
console.log('\n' + '='.repeat(80));
if (allPassed) {
  console.log('✅ TODOS LOS TESTS PASARON');
} else {
  console.log('❌ ALGUNOS TESTS FALLARON - Revisar aserciones arriba');
  process.exit(1);
}
console.log('='.repeat(80));
