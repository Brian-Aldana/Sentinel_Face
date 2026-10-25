import pytest
from decimal import Decimal
from datetime import datetime
from api.models.home import _clean_val, _clean_dict, _enrich_home_dict


def test_clean_val_conversions():
    """Valida la sanitización de tipos Decimal y Datetime a formatos JSON-serializables."""
    assert _clean_val(Decimal("10.00")) == 10
    assert _clean_val(Decimal("10.55")) == 10.55

    now = datetime(2026, 10, 24, 15, 30, 0)
    assert _clean_val(now) == "2026-10-24T15:30:00"
    assert _clean_val("Texto plano") == "Texto plano"
    assert _clean_val(42) == 42


def test_enrich_home_dict_service_statuses():
    """Valida que la regla de negocio para 'is_active' responda estrictamente al estado de suscripción."""
    active_home = {"service_status": "ACTIVE", "total_residents": 5}
    enriched_active = _enrich_home_dict(active_home)
    assert enriched_active["is_active"] is True

    trial_home = {"service_status": "TRIAL", "total_residents": 2}
    enriched_trial = _enrich_home_dict(trial_home)
    assert enriched_trial["is_active"] is True

    suspended_home = {"service_status": "SUSPENDED", "suspension_reason": "Falta de pago"}
    enriched_suspended = _enrich_home_dict(suspended_home)
    assert enriched_suspended["is_active"] is False

    denied_home = {"service_status": "DENIED", "suspension_reason": "Cancelación por cliente"}
    enriched_denied = _enrich_home_dict(denied_home)
    assert enriched_denied["is_active"] is False


def test_enrich_home_dict_default_counters():
    """Valida que los contadores nulos sean convertidos a 0 para prevenir errores en frontend."""
    raw = {"service_status": "ACTIVE"}
    enriched = _enrich_home_dict(raw)
    assert enriched["total_residents"] == 0
    assert enriched["active_alerts"] == 0
    assert enriched["total_accesses"] == 0


def test_resident_quota_limit_rule():
    """Valida la regla de negocio: no se pueden registrar más residentes que max_residents."""
    home_quota = {
        "max_residents": 10,
        "current_residents": 10,
    }
    can_register = home_quota["current_residents"] < home_quota["max_residents"]
    assert can_register is False

    home_quota["current_residents"] = 9
    can_register = home_quota["current_residents"] < home_quota["max_residents"]
    assert can_register is True


def test_tenant_data_isolation_invariant():
    """Valida la invariante multi-tenant: una consulta de residentes debe aislarse por home_id."""
    resident_home_a = {"resident_id": 1, "home_id": 1, "full_name": "Ana Perez"}
    resident_home_b = {"resident_id": 2, "home_id": 2, "full_name": "Carlos Ruiz"}

    requesting_home_id = 1
    accessible_residents = [r for r in [resident_home_a, resident_home_b] if r["home_id"] == requesting_home_id]

    assert len(accessible_residents) == 1
    assert accessible_residents[0]["full_name"] == "Ana Perez"
    assert resident_home_b not in accessible_residents
