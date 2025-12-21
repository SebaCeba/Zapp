"""Cliente de facturación simulado."""


def charge(subscription_id: str, amount: float) -> bool:
    """Simula un cargo. Devuelve True si 'exitoso'."""
    print(f"Cargando {amount:.2f} al subscription {subscription_id}")
    return True
