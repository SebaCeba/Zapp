"""Modelo simple de suscripción."""

from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass
class Subscription:
    id: str
    user_id: str
    plan: str
    start_date: date
    next_billing_date: date
    active: bool = True
    metadata: Optional[dict] = None

    def renew(self, new_date: date):
        self.next_billing_date = new_date
