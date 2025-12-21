# Planificador de Suscripciones

Proyecto para gestionar y planificar renovaciones de suscripciones.

Estructura inicial:

- src/planificador/: código fuente
  - main.py: entrada CLI mínima
  - scheduler.py: lógica de programación
  - subscription.py: modelo de suscripción
  - billing.py: simulación/cliente de facturación
  - config.py: configuración
- tests/: pruebas unitarias básicas
- scripts/: utilidades para ejecutar
- requirements.txt: dependencias
- .gitignore

Pasos rápidos:

Windows PowerShell
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m src.planificador.main
```

Siguientes pasos sugeridos:
- Implementar modelos con `pydantic` o `dataclasses`.
- Añadir persistencia (SQLite / SQLAlchemy).
- Integrar `APScheduler` o `celery` según necesidades.
