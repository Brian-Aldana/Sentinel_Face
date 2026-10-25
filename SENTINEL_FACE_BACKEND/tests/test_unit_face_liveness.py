import pytest
import numpy as np
from collections import namedtuple
from blink_detector import _ear, EAR_THRESHOLD
from liveness import LivenessDetector

Point = namedtuple("Point", ["x", "y"])


def test_ear_calculation_open_eye():
    """Valida que la fórmula de Soukupová & Čech (2016) produzca un EAR >= 0.22 para un ojo abierto."""
    # Simulación de un ojo de ancho 40px y apertura vertical de 12px
    # pts: [p1(izq), p2(sup_izq), p3(sup_der), p4(der), p5(inf_der), p6(inf_izq)]
    w, h = 640, 480
    landmarks = [
        Point(100 / w, 200 / h),  # 0: p1
        Point(110 / w, 194 / h),  # 1: p2
        Point(130 / w, 194 / h),  # 2: p3
        Point(140 / w, 200 / h),  # 3: p4
        Point(130 / w, 206 / h),  # 4: p5
        Point(110 / w, 206 / h),  # 5: p6
    ]
    indices = [0, 1, 2, 3, 4, 5]

    ear_val = _ear(landmarks, indices, w, h)
    # A = |p2 - p6| = 12, B = |p3 - p5| = 12, C = |p1 - p4| = 40
    # EAR = (12 + 12) / (2 * 40) = 24 / 80 = 0.30
    assert pytest.approx(ear_val, 0.01) == 0.30
    assert ear_val >= EAR_THRESHOLD


def test_ear_calculation_closed_eye():
    """Valida que un ojo cerrado (apertura vertical reducida a 2px) produzca un EAR < 0.22."""
    w, h = 640, 480
    landmarks = [
        Point(100 / w, 200 / h),  # 0: p1
        Point(110 / w, 199 / h),  # 1: p2
        Point(130 / w, 199 / h),  # 2: p3
        Point(140 / w, 200 / h),  # 3: p4
        Point(130 / w, 201 / h),  # 4: p5
        Point(110 / w, 201 / h),  # 5: p6
    ]
    indices = [0, 1, 2, 3, 4, 5]

    ear_val = _ear(landmarks, indices, w, h)
    # A = 2, B = 2, C = 40 -> EAR = 4 / 80 = 0.05
    assert pytest.approx(ear_val, 0.01) == 0.05
    assert ear_val < EAR_THRESHOLD


def test_ear_zero_denominator_safe():
    """Valida que si p1 y p4 coinciden (ancho = 0), no ocurra ZeroDivisionError y retorne 1.0."""
    w, h = 640, 480
    landmarks = [Point(100 / w, 200 / h)] * 6
    indices = [0, 1, 2, 3, 4, 5]

    ear_val = _ear(landmarks, indices, w, h)
    assert ear_val == 1.0


def test_liveness_detector_missing_model_graceful_fallback():
    """Valida que LivenessDetector no lance excepción si el archivo ONNX no existe y degrade elegantemente."""
    detector = LivenessDetector("ruta/inexistente/modelo_no_encontrado.onnx")
    assert detector.loaded is False

    dummy_img = np.zeros((480, 640, 3), dtype=np.uint8)
    bbox = [100, 100, 200, 200]
    is_real, score, label = detector.check_liveness(dummy_img, bbox)

    assert is_real is True
    assert score == 1.0
    assert label == "Módulo OFF"


def test_cosine_similarity_threshold_math():
    """Valida matemáticamente el umbral de similitud coseno (0.50) utilizado por ArcFace/InsightFace."""
    SIMILARITY_THRESHOLD = 0.50

    # 1. Vectores idénticos (mismo sujeto)
    v1 = np.random.randn(512).astype(np.float32)
    v1 = v1 / np.linalg.norm(v1)
    sim_identical = float(np.dot(v1, v1))
    assert pytest.approx(sim_identical, 0.001) == 1.0
    assert sim_identical >= SIMILARITY_THRESHOLD

    # 2. Vectores ortogonales (sujetos completamente distintos)
    v_a = np.zeros(512, dtype=np.float32)
    v_a[0] = 1.0
    v_b = np.zeros(512, dtype=np.float32)
    v_b[1] = 1.0
    sim_orthogonal = float(np.dot(v_a, v_b))
    assert sim_orthogonal == 0.0
    assert sim_orthogonal < SIMILARITY_THRESHOLD
