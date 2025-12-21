"""CLI mínima para el Planificador de Suscripciones.

Comandos:
 - `run`: ejecutar en modo dry-run o real
 - `schedule-demo`: programar una tarea demo usando APScheduler
"""

from datetime import datetime, timedelta
import typing

import typer

from . import scheduler

app = typer.Typer()


@app.command()
def run(dry: bool = True) -> None:
    """Ejecuta el planificador. Si `dry` es True no hace acciones externas."""
    if dry:
        typer.echo("Planificador: modo dry-run — sin acciones reales.")
    else:
        typer.echo("Planificador: ejecutando tareas programadas...")
        scheduler.start()


@app.command()
def schedule_demo(seconds: int = 10) -> None:
    """Programa una tarea demo para ejecutarse en `seconds` segundos."""

    def demo_task():
        typer.echo(f"Demo task ejecutada en {datetime.now().isoformat()}")

    run_at = datetime.now() + timedelta(seconds=seconds)
    scheduler.start()
    scheduler.schedule_task(run_at, demo_task)
    typer.echo(f"Tarea demo programada para {run_at.isoformat()}")


if __name__ == "__main__":
    app()
