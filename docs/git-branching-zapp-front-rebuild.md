# Estrategia de Ramas: Rediseño Frontend Zapp

**Fecha:** 05 de abril de 2026  
**Objetivo:** Preparar ramas para rediseñar el frontend sin afectar la versión estable en producción

---

## 📊 Diagnóstico Actual

**Estado del Repositorio:**
- **Rama actual:** `release/zapp-stable-v1`
- **Rama principal:** `master` (= origin/master)
- **Último commit común:** `d1828f7` (servicios básicos, ahorros, Gmail)
- **Cambios staged:** 8 archivos de documentación nuevos (sin commit)

**Otras ramas existentes:**
- `feat/rsuite-phase-0` (frontend anterior)

**⚠️ Acción requerida:** Primero debes decidir qué hacer con los 8 archivos staged en `release/zapp-stable-v1`

---

## 🎯 Objetivo de la Estrategia

1. **Congelar** el estado actual estable (respaldo inmutable)
2. **Aislar** el trabajo de rediseño frontend en rama dedicada
3. **Preservar** master como fuente de verdad operativa
4. **Permitir** rollback rápido si el rediseño falla

---

## 🌿 Ramas Sugeridas

### Opción A: Convención Professional Simple

| Rama | Propósito | Cuándo Usar |
|------|-----------|-------------|
| `master` | Rama principal estable | Operar versión actual, hotfixes críticos |
| `backup/stable-2026-04-05` | Snapshot congelado del estado actual | Nunca modificar, solo referencia |
| `feat/frontend-redesign` | Trabajo activo de rediseño | Desarrollo diario del nuevo frontend |

### Opción B: Convención Descriptiva

| Rama | Propósito | Cuándo Usar |
|------|-----------|-------------|
| `master` | Rama principal estable | Operar versión actual, hotfixes críticos |
| `backup/stable-before-redesign` | Snapshot congelado pre-rediseño | Nunca modificar, solo referencia |
| `refactor/frontend-rebuild` | Reconstrucción completa del frontend | Desarrollo diario del nuevo frontend |

---

## 📋 Comandos Exactos (Paso a Paso)

### Paso 1: Resolver Archivos Staged

**Opción 1A - Commitear los archivos en release/zapp-stable-v1:**
```bash
git commit -m "docs: add MVP planning and architecture specs"
git push origin release/zapp-stable-v1
```

**Opción 1B - Unstage los archivos y moverlos a master:**
```bash
git restore --staged .
git stash push -m "MVP docs to move to master"
```

### Paso 2: Cambiar a Master y Actualizar

```bash
# Cambiar a master
git checkout master

# Actualizar desde origin
git pull origin master

# Si hiciste stash en Paso 1B, aplicar los cambios:
git stash pop
git add docs/architecture-decisions-finanzapp-mvp.md docs/feasibility-multi-budget-audit.md docs/implementation-plan-mvp-finanzapp.md docs/spec-budget-hierarchy-mvp.md docs/spec-final-mvp-data-model.md docs/spec-mvp-budget-access-model.md docs/spec-mvp-monthly-planning-model.md docs/spec-mvp-navigation-ux.md
git commit -m "docs: add MVP planning and architecture specs"
git push origin master
```

### Paso 3: Crear Rama de Respaldo (Snapshot Congelado)

```bash
# Desde master, crear backup inmutable
git checkout -b backup/stable-2026-04-05

# Pushear a remoto para respaldo
git push -u origin backup/stable-2026-04-05

# Volver a master
git checkout master
```

**⚠️ Protección del Backup:**
```bash
# Opcional: marcar con tag para mayor seguridad
git tag -a v1.0-stable-snapshot -m "Estado estable antes de rediseño frontend"
git push origin v1.0-stable-snapshot
```

### Paso 4: Crear Rama de Trabajo para Rediseño

```bash
# Desde master, crear rama de trabajo
git checkout -b feat/frontend-redesign

# Pushear a remoto
git push -u origin feat/frontend-redesign
```

### Paso 5: Verificar Estado Final

```bash
# Ver todas las ramas
git branch -a

# Confirmar rama actual
git branch --show-current

# Ver estado limpio
git status
```

**Salida Esperada:**
```
On branch feat/frontend-redesign
Your branch is up to date with 'origin/feat/frontend-redesign'.

nothing to commit, working tree clean
```

---

## 🔄 Flujo de Trabajo Operativo

### Para Seguir Operando la Versión Estable

```bash
# Trabajar en master para hotfixes/operaciones normales
git checkout master
git pull origin master

# Hacer cambios...
git add .
git commit -m "fix: descripción del cambio"
git push origin master
```

### Para Reconstruir el Frontend

```bash
# Trabajar en rama de rediseño
git checkout feat/frontend-redesign
git pull origin feat/frontend-redesign

# Desarrollar, desmontar funcionalidades, rediseñar...
git add .
git commit -m "refactor: descripción del cambio"
git push origin feat/frontend-redesign

# Sincronizar con master periódicamente (opcional)
git merge master
```

---

## ✅ Recomendación Final

**Usa esta estrategia:**

1. **Rama `master`:**  
   - Sigue siendo tu fuente de verdad
   - Úsala para operaciones del día a día
   - Hotfixes urgentes van aquí
   - NO toques el frontend aquí

2. **Rama `backup/stable-2026-04-05`:**  
   - Snapshot inmutable
   - NO la toques nunca
   - Sirve solo como referencia histórica
   - Puedes borrarla en 6 meses si el rediseño va bien

3. **Rama `feat/frontend-redesign`:**  
   - Tu zona de experimentos
   - Desmonta, rediseña, reconstruye libremente
   - Commits frecuentes
   - Cuando esté lista: merge a `master` o nueva release branch

**Cuándo hacer merge del rediseño a master:**
- Cuando el nuevo frontend esté 100% funcional
- Después de QA exhaustivo
- Con plan de rollback claro
- Idealmente, hacer merge con `--no-ff` para mantener historial claro

---

## ⚠️ Riesgos a Evitar

| Riesgo | Cómo Evitarlo |
|--------|---------------|
| Modificar `backup/stable-*` por error | Nunca hacer checkout de esa rama para trabajar |
| Perder cambios de `master` | Hacer `git merge master` periódicamente en `feat/frontend-redesign` |
| Pushear código roto a `master` | Trabajar solo en `feat/frontend-redesign` hasta que esté listo |
| Olvidar sincronizar | Establecer rutina: pull master → merge en redesign cada 2-3 días |
| Conflictos masivos al mergear | Mergear master frecuentemente (no esperar semanas) |

---

## 📝 Convenciones de Commits

Durante el rediseño, usa prefijos claros:

- `refactor(frontend):` - Cambios de estructura sin cambiar funcionalidad
- `feat(ui):` - Nueva funcionalidad de UI
- `remove(feature):` - Eliminación de funcionalidad
- `redesign(component):` - Rediseño de componente existente
- `wip:` - Work in progress (no hacer push a remoto)

---

## 🔍 Comandos de Verificación Rápida

```bash
# ¿En qué rama estoy?
git branch --show-current

# ¿Tengo cambios sin commit?
git status --short

# ¿Qué ramas tengo?
git branch -a

# ¿Cuál es el último commit de cada rama?
git branch -v

# Ver diferencias entre ramas
git diff master..feat/frontend-redesign

# Ver archivos cambiados entre ramas
git diff --name-status master..feat/frontend-redesign
```

---

## ✔️ Confirmación

**NO se han realizado cambios de código en este proceso.**

Este documento solo proporciona:
- Estrategia de ramas
- Comandos exactos a ejecutar manualmente
- Recomendaciones operativas
- Guía de prevención de riesgos

**Próximo paso:** Ejecuta los comandos del apartado "Comandos Exactos (Paso a Paso)" manualmente, uno por uno, verificando la salida de cada comando antes de continuar.

---

## 📚 Referencias Rápidas

**Ver historial gráfico:**
```bash
git log --oneline --graph --all --decorate -20
```

**Comparar con backup:**
```bash
git diff backup/stable-2026-04-05..feat/frontend-redesign
```

**Rollback de emergencia:**
```bash
# Si todo falla, volver al snapshot
git checkout backup/stable-2026-04-05
git checkout -b recovery/rollback-from-redesign
```

---

**Autor:** GitHub Copilot  
**Versión:** 1.0  
**Estado:** Listo para ejecutar
