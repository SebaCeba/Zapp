"""Módulo de scheduling con APScheduler.

Proporciona un wrapper sencillo que usa APScheduler si está instalado,
y un fallback que ejecuta la tarea inmediatamente si no está disponible.
"""

from datetime import datetime
from typing import Callable, Any

try:
    from apscheduler.schedulers.background import BackgroundScheduler
except Exception:
    BackgroundScheduler = None


class _Scheduler:
    def __init__(self):
        self._sched = BackgroundScheduler() if BackgroundScheduler else None
        self._started = False

    def start(self) -> None:
        if self._sched and not self._started:
            self._sched.start()
            self._started = True

    def schedule_task(self, run_at: datetime, func: Callable[..., Any], *args, **kwargs) -> None:
        if self._sched:
            self._sched.add_job(func, "date", run_date=run_at, args=args, kwargs=kwargs)
            print(f"Programado {func.__name__} para {run_at.isoformat()}")
        else:
            print("APScheduler no disponible: ejecutando tarea inmediatamente (fallback).")
            func(*args, **kwargs)

    def shutdown(self, wait: bool = False) -> None:
        if self._sched and self._started:
            self._sched.shutdown(wait=wait)


_DEFAULT_SCHEDULER = _Scheduler()


def start() -> None:
    _DEFAULT_SCHEDULER.start()


def schedule_task(run_at: datetime, func: Callable[..., Any], *args, **kwargs) -> None:
    _DEFAULT_SCHEDULER.schedule_task(run_at, func, *args, **kwargs)


def shutdown(wait: bool = False) -> None:
    _DEFAULT_SCHEDULER.shutdown(wait=wait)
