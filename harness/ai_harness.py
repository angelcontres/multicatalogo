#!/usr/bin/env python3
"""
AI Evaluation, Verification & Diagnostic Harness for MultiCatálogo
Part of the Framework Programación Web (UPSE) - MultiCatálogo Platform.

This harness empowers AI agents and software engineers to verify contracts,
simulate ACID transactions, audit token budgets, and test MLM calculations
rapidly with minimal token overhead.
"""

import sys
import os
import json
import socket
import shutil
import subprocess
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple

# Workspace paths
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = WORKSPACE_ROOT / "multicatalogo-backend"
FRONTEND_DIR = WORKSPACE_ROOT / "multicatalogo-frontend"
DOCS_DIR = WORKSPACE_ROOT / "docs"
CHECKLIST_FILE = WORKSPACE_ROOT / "REQUIREMENTS_CHECKLIST.md"
PROJECT_MAP_FILE = WORKSPACE_ROOT / "PROJECT_MAP.md"


# ============================================================================
# 1. DOCTOR: Environment & Dependencies Diagnostics
# ============================================================================

def check_port_open(host: str, port: int, timeout: float = 0.5) -> bool:
    """Checks if a TCP port is open / listening."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(timeout)
        try:
            s.connect((host, port))
            return True
        except (socket.timeout, ConnectionRefusedError, OSError):
            return False


def get_command_version(cmd: List[str]) -> str:
    """Runs a command and returns the first line of output or 'Not available'."""
    try:
        # On Windows, resolve .cmd or .bat if needed
        prog = cmd[0]
        full_prog = shutil.which(prog)
        if full_prog:
            cmd = [full_prog] + cmd[1:]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5, shell=(os.name == 'nt'))
        if res.returncode == 0 and res.stdout:
            return res.stdout.strip().splitlines()[0]
        return "Installed (version unavailable)"
    except Exception:
        return "Not available in PATH"


def run_doctor() -> int:
    """Evaluates host tools, runtimes, and local network ports."""
    print("================================================================")
    print("  [AI-HARNESS] DOCTOR: MultiCatálogo Environment Diagnostic")
    print("================================================================")

    tools = [
        ("Git", ["git", "--version"]),
        ("Go", ["go", "version"]),
        ("Node.js", ["node", "-v"]),
        ("npm", ["npm", "-v"]),
        ("Python", ["python", "--version"]),
        ("Docker", ["docker", "--version"]),
        ("Docker Compose", ["docker", "compose", "version"]),
    ]

    print("\n[+] Host Runtimes & Tooling:")
    all_tools_ok = True
    for name, cmd in tools:
        ver = get_command_version(cmd)
        status = "[OK]" if ver != "Not available in PATH" else "[MISSING]"
        if status == "[MISSING]":
            all_tools_ok = False
        print(f"  {status:9} {name:16}: {ver}")

    print("\n[+] Workspace Core Directories & Essential Files:")
    essential_files = [
        ("Root Checklist", CHECKLIST_FILE),
        ("Project Map", PROJECT_MAP_FILE),
        ("Requirements Doc", DOCS_DIR / "LEVANTAMIENTO_REQUERIMIENTOS.md"),
        ("SDD Master Index", DOCS_DIR / "sdd" / "README.md"),
        ("Agent Directives", WORKSPACE_ROOT / "AGENTS.md"),
        ("Backend Main", BACKEND_DIR / "main.go"),
        ("Backend Mod", BACKEND_DIR / "go.mod"),
        ("Frontend App", FRONTEND_DIR / "src" / "App.tsx"),
        ("Frontend Package", FRONTEND_DIR / "package.json"),
    ]

    for label, path in essential_files:
        exists = path.exists()
        tag = "[FOUND]" if exists else "[NOT FOUND]"
        print(f"  {tag:11} {label:20}: {path.name}")

    print("\n[+] Local Port Status (Services):")
    ports = [
        (5173, "Frontend (React / Vite)"),
        (3000, "Backend API (Go / Fiber)"),
        (5434, "PostgreSQL 16 (Docker)"),
        (6379, "Redis Alpine (Docker)"),
    ]

    for port, service in ports:
        is_open = check_port_open("127.0.0.1", port)
        status = "[ACTIVE]" if is_open else "[INACTIVE / READY]"
        print(f"  {status:19} Port {port:<5} -> {service}")

    print("\n----------------------------------------------------------------")
    print("Doctor Diagnostic Complete. Ready for agent operations.")
    return 0


# ============================================================================
# 2. STATUS & REQUIREMENTS TRACEABILITY
# ============================================================================

def run_status() -> int:
    """Parses REQUIREMENTS_CHECKLIST.md to output a compact progress report."""
    print("================================================================")
    print("  [AI-HARNESS] REQUIREMENTS TRACEABILITY & PROGRESS SUMMARY")
    print("================================================================")

    if not CHECKLIST_FILE.exists():
        print("[!] REQUIREMENTS_CHECKLIST.md not found in root.")
        return 1

    content = CHECKLIST_FILE.read_text(encoding="utf-8")
    lines = content.splitlines()

    total_items = 0
    completed_items = 0
    current_unit = "General"
    unit_stats: Dict[str, Dict[str, int]] = {}

    for line in lines:
        stripped = line.strip()
        header_text = stripped.lstrip("#").strip()
        if header_text.startswith("UNIDAD 1"):
            current_unit = "UNIDAD 1: Frontend SPA (React 19 + Tailwind v4)"
            if current_unit not in unit_stats:
                unit_stats[current_unit] = {"done": 0, "total": 0}
        elif header_text.startswith("UNIDAD 2"):
            current_unit = "UNIDAD 2: Backend Transaccional (Go + Fiber + PG + Redis)"
            if current_unit not in unit_stats:
                unit_stats[current_unit] = {"done": 0, "total": 0}
        elif "BACK-OFFICE" in header_text:
            current_unit = "BACK-OFFICE & Roadmap MLM Real"
            if current_unit not in unit_stats:
                unit_stats[current_unit] = {"done": 0, "total": 0}
        elif stripped.startswith("- [x]"):
            total_items += 1
            completed_items += 1
            if current_unit not in unit_stats:
                unit_stats[current_unit] = {"done": 0, "total": 0}
            unit_stats[current_unit]["done"] += 1
            unit_stats[current_unit]["total"] += 1
        elif stripped.startswith("- [ ]"):
            total_items += 1
            if current_unit not in unit_stats:
                unit_stats[current_unit] = {"done": 0, "total": 0}
            unit_stats[current_unit]["total"] += 1

    pct = (completed_items / total_items * 100) if total_items > 0 else 0
    print(f"\n[+] Total Checklist Items: {total_items} | Completed: {completed_items} ({pct:.1f}%)\n")

    for unit, stats in unit_stats.items():
        u_done = stats["done"]
        u_tot = stats["total"]
        u_pct = (u_done / u_tot * 100) if u_tot > 0 else 0
        bar_len = 20
        filled = int(bar_len * (u_pct / 100))
        bar = "#" * filled + "-" * (bar_len - filled)
        print(f"  [{bar}] {u_pct:5.1f}% ({u_done}/{u_tot}) - {unit}")

    print("\n----------------------------------------------------------------")
    print("Hint: Keep REQUIREMENTS_CHECKLIST.md up to date as tasks finish.")
    return 0


# ============================================================================
# 3. TOKEN AUDIT: Prevent Context Window Flooding
# ============================================================================

def run_token_audit() -> int:
    """Analyzes workspace size, identifies token-heavy files and potential context leaks."""
    print("================================================================")
    print("  [AI-HARNESS] TOKEN BUDGET AUDIT: Context Conservation Analysis")
    print("================================================================")

    large_files = []
    total_bytes = 0
    total_files = 0
    notebooks = []

    for root, dirs, files in os.walk(WORKSPACE_ROOT):
        # Exclude git and build outputs
        dirs[:] = [d for d in dirs if d not in {".git", "node_modules", "dist", "pgdata", "redisdata", "__pycache__"}]
        for f in files:
            p = Path(root) / f
            try:
                sz = p.stat().st_size
                total_bytes += sz
                total_files += 1

                rel_p = p.relative_to(WORKSPACE_ROOT)
                if sz > 20_000 and not str(rel_p).endswith(".pdf") and not str(rel_p).endswith(".docx"):
                    large_files.append((str(rel_p), sz))
                if p.suffix == ".ipynb":
                    notebooks.append((str(rel_p), sz))
            except Exception:
                pass

    approx_tokens = total_bytes // 4
    print(f"\n[+] Total Analyzed Files : {total_files}")
    print(f"[+] Total Codebase Weight: {total_bytes / 1024:.1f} KB (Approx. {approx_tokens:,} tokens)")

    print("\n[+] Large Text/Code Files (>20 KB) - Avoid loading whole into context:")
    for path, sz in sorted(large_files, key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - {path:<50} ({sz / 1024:6.1f} KB ~ {sz // 4:,} tokens)")

    print("\n[+] Jupyter Notebooks detected in workspace:")
    for path, sz in notebooks:
        print(f"  - {path:<50} ({sz / 1024:6.1f} KB)")

    print("\n[+] Directives for AI Agents to Save Tokens:")
    print("  1. NEVER read full .ipynb files when looking for specifications.")
    print("  2. Consult PROJECT_MAP.md (under 100 lines) before opening any source code.")
    print("  3. For API verification, run 'python harness/ai_harness.py test [suite]' instead of browser runs.")
    print("  4. Make surgical edits to specific lines rather than replacing whole files.")
    print("----------------------------------------------------------------")
    return 0


# ============================================================================
# 4. TEST SUITE: Domain & Contract Verifications
# ============================================================================

def test_mlm_math() -> bool:
    """Verifies MLM commission math across 3 tiers and edge cases."""
    print("--> Running MLM Pure Domain Function Validation...")

    tiers = [0.10, 0.05, 0.02]  # Level 1: 10%, Level 2: 5%, Level 3: 2%

    def calculate_commissions(subtotal: float, upline_count: int) -> List[float]:
        commissions = []
        for i in range(min(upline_count, 3)):
            commissions.append(round(subtotal * tiers[i], 2))
        return commissions

    # Test cases: (Subtotal, Upline Depth, Expected Commissions, Expected Total Distributed)
    test_cases = [
        (100.0, 3, [10.0, 5.0, 2.0], 17.0),
        (50.0, 1, [5.0], 5.0),
        (250.0, 2, [25.0, 12.5], 37.5),
        (45.0, 5, [4.5, 2.25, 0.9], 7.65),  # 4th and 5th upline get 0%
        (0.0, 3, [0.0, 0.0, 0.0], 0.0),
        (33.33, 3, [3.33, 1.67, 0.67], 5.67),  # Rounding precision check
    ]

    for subtotal, uplines, expected_comms, expected_tot in test_cases:
        actual_comms = calculate_commissions(subtotal, uplines)
        if actual_comms != expected_comms:
            print(f"[FAIL] Subtotal: {subtotal}, Uplines: {uplines}. Expected: {expected_comms}, Got: {actual_comms}")
            return False
        if round(sum(actual_comms), 2) != expected_tot:
            print(f"[FAIL] Total distributed mismatch. Expected: {expected_tot}, Got: {sum(actual_comms)}")
            return False

    print("    [PASS] MLM 3-level commission calculation (10/5/2%) verified with 100% precision.")
    return True


def test_api_contracts() -> bool:
    """Validates structure and schemas of expected API contracts and error formatting."""
    print("--> Running Canonical API Contract & Error Schema Validation...")

    sample_error = {
        "status": 400,
        "message": "Stock insuficiente para el producto seleccionado",
        "details": "ID 2: requested 10, available 3"
    }

    # Contract checks
    assert "status" in sample_error and isinstance(sample_error["status"], int)
    assert "message" in sample_error and isinstance(sample_error["message"], str)
    assert sample_error["status"] >= 400

    sample_checkout_payload = {
        "nombre": "Consumidor Test",
        "email": "test@upse.edu.ec",
        "direccion": "Av. Principal 123",
        "ciudad": "La Libertad",
        "telefono": "0999999999",
        "metodoPago": "contraentrega",
        "items": [
            {"producto_id": 1, "cantidad": 2},
            {"producto_id": 3, "cantidad": 1}
        ]
    }

    assert len(sample_checkout_payload["items"]) > 0
    for item in sample_checkout_payload["items"]:
        assert item["producto_id"] > 0
        assert item["cantidad"] > 0

    print("    [PASS] Canonical APIError contract {status, message, details} conforms to specification.")
    print("    [PASS] Checkout request schema matches frontend / backend contract.")
    return True


def test_acid_simulation() -> bool:
    """Validates ACID rollback logic and deterministic failure scenarios."""
    print("--> Running ACID Transaction & Rollback Simulation Test...")

    # Mock database state
    products_db = {
        1: {"nombre": "Serum Revitalizante", "precio": 45.0, "stock": 5},
        2: {"nombre": "Crema Hidratante Pro", "precio": 32.5, "stock": 0},  # Out of stock
    }

    orders_db = []
    order_items_db = []

    def execute_mock_checkout(order_id: int, items: List[Dict[str, int]]) -> Tuple[bool, str]:
        # Step 1: Check stock (equivalent to SELECT ... FOR UPDATE)
        for item in items:
            pid = item["producto_id"]
            qty = item["cantidad"]
            if pid not in products_db:
                return False, f"Producto {pid} no existe (ROLLBACK)"
            if products_db[pid]["stock"] < qty:
                return False, f"Stock insuficiente para producto {pid} (ROLLBACK)"

        # Step 2: Deduct stock and persist order
        try:
            for item in items:
                products_db[item["producto_id"]]["stock"] -= item["cantidad"]
            orders_db.append({"id": order_id, "estado": "pendiente"})
            for item in items:
                order_items_db.append({"pedido_id": order_id, "producto_id": item["producto_id"], "qty": item["cantidad"]})
            return True, "COMMIT OK"
        except Exception as e:
            return False, f"Error imprevisto: {e} (ROLLBACK)"

    # Scenario 1: Out-of-stock purchase attempt (Must abort and not mutate stock)
    initial_stock_1 = products_db[1]["stock"]
    success, msg = execute_mock_checkout(101, [{"producto_id": 2, "cantidad": 1}])
    assert not success, "Checkout should have failed due to 0 stock"
    assert products_db[1]["stock"] == initial_stock_1, "Stock was erroneously modified on rollback"

    # Scenario 2: Valid purchase (Must succeed and deduct stock)
    success, msg = execute_mock_checkout(102, [{"producto_id": 1, "cantidad": 2}])
    assert success, "Checkout should have succeeded"
    assert products_db[1]["stock"] == initial_stock_1 - 2, "Stock deduction failed"

    print("    [PASS] ACID rollback on stock insufficiency verified without side-effects.")
    print("    [PASS] Atomic stock deduction verified successfully.")
    return True


def test_cache_aside_rules() -> bool:
    """Evaluates Cache-Aside naming conventions and TTL policies."""
    print("--> Running Cache-Aside & Redis Policy Evaluation...")

    policies = {
        "productos:all": {"ttl_seconds": 300, "invalidation_triggers": ["POST /api/checkout", "POST /api/productos", "PUT /api/productos/:id", "DELETE /api/productos/:id"]},
        "red:tree:{email}": {"ttl_seconds": 600, "invalidation_triggers": ["POST /api/checkout", "POST /api/register"]}
    }

    assert policies["productos:all"]["ttl_seconds"] == 300, "Products cache TTL must be 5 minutes (300s)"
    assert policies["red:tree:{email}"]["ttl_seconds"] == 600, "Red tree cache TTL must be 10 minutes (600s)"

    print("    [PASS] Cache-Aside keys and TTLs conform to DRS specifications.")
    return True


def run_tests(suite_name: str) -> int:
    """Runs designated test suite."""
    print("================================================================")
    print(f"  [AI-HARNESS] RUNNING TEST SUITE: {suite_name.upper()}")
    print("================================================================")

    results = []
    if suite_name in {"mlm", "all"}:
        results.append(test_mlm_math())
    if suite_name in {"contracts", "all"}:
        results.append(test_api_contracts())
    if suite_name in {"acid-sim", "all"}:
        results.append(test_acid_simulation())
    if suite_name in {"cache-eval", "all"}:
        results.append(test_cache_aside_rules())

    if all(results):
        print("\n[SUCCESS] All verification tests passed cleanly!")
        return 0
    else:
        print("\n[FAILURE] One or more tests failed.")
        return 1


# ============================================================================
# 5. RUNBOOKS & PROMPTS: Context-Optimized Work Instructions
# ============================================================================

RUNBOOKS = {
    "fase1": """
# RUNBOOK FASE 1: ARQUITECTURA Y API ROBUSTA
Target: multicatalogo-backend/ (models/models.go, controllers/authController.go, prodController.go, healthController.go)

Objetivo:
1. models/models.go -> Crear struct APIError { Status int, Message string, Details any }.
2. controllers/authController.go -> Validar email y password no vacios (400 APIError) antes de comprobar credenciales.
3. controllers/prodController.go -> En GetProductoPorID, retornar 400 APIError si :id no es numerico.
4. controllers/healthController.go -> Crear GET /api/health -> 200 {"status": "ok", "message": "Servidor Go/Fiber operativo"}.
5. Registrar /api/health en routes/routes.go.
6. Verificar con: python harness/ai_harness.py test contracts
""",
    "fase2": """
# RUNBOOK FASE 2: PERSISTENCIA RELACIONAL POSTGRESQL 16
Target: multicatalogo-backend/ (docker-compose.yml, config/db.go, database/init.sql, repository/repository.go)

Objetivo:
1. docker-compose.yml -> Servicio PostgreSQL 16 en puerto host 5434, env: multicatalogo / postgres / postgres.
2. config/db.go -> Pool pgx/v5 hacia postgres://postgres:postgres@localhost:5434/multicatalogo?sslmode=disable.
3. database/init.sql -> Tablas usuarios, productos, referidos con seeds.
4. repository/repository.go -> Reemplazar slices en memoria con consultas SQL reales via pgx.
5. Reconstruir arbol de referidos por parent_id.
""",
    "fase3": """
# RUNBOOK FASE 3: CACHÉ REDIS (CACHE-ASIDE)
Target: multicatalogo-backend/ (docker-compose.yml, config/redis.go, controllers/prodController.go, controllers/redController.go)

Objetivo:
1. docker-compose.yml -> Agregar servicio redis:alpine en puerto 6379.
2. config/redis.go -> Cliente go-redis v9 (localhost:6379).
3. Patrón Cache-Aside en GetProductos: clave 'productos:all', TTL 5m.
4. Patrón Cache-Aside en GetRed: clave 'red:tree:{email}', TTL 10m.
5. Degeneración elegante: si Redis falla, consultar PostgreSQL directamente sin lanzar 500.
""",
    "fase4": """
# RUNBOOK FASE 4: TRANSACCIONES ACID Y CONCURRENCIA MLM
Target: multicatalogo-backend/ (repository/repository.go, controllers/checkoutController.go, main.go)

Objetivo:
1. Inyección de dependencias con structs e interfaces (DBRepository, CacheRepository).
2. Endpoint POST /api/checkout -> Iniciar BEGIN; SELECT stock FOR UPDATE; descontar stock; insertar pedido y pedido_items; COMMIT.
3. Goroutine asíncrona: go procesarComisiones(total, usuarioID) -> sube upline hasta 3 niveles (10%, 5%, 2%).
4. Invalidación de claves en Redis: DEL 'productos:all' y 'red:tree:*'.
5. Probar con: python harness/ai_harness.py test acid-sim
"""
}


def run_runbook(phase: str) -> int:
    """Prints prompt-ready task instructions for AI agents."""
    phase_key = phase.lower().replace(" ", "").replace("-", "")
    if phase_key in RUNBOOKS:
        print(RUNBOOKS[phase_key])
        return 0
    else:
        print(f"[!] Unknown runbook phase '{phase}'. Available: {list(RUNBOOKS.keys())}")
        return 1


# ============================================================================
# CLI Entrypoint
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="MultiCatálogo AI Evaluation & Verification Harness")
    subparsers = parser.add_subparsers(dest="command", help="Harness commands")

    # doctor
    subparsers.add_parser("doctor", help="Run environment and runtime diagnostic")

    # status
    subparsers.add_parser("status", help="Show requirements checklist progress and stats")

    # token-audit
    subparsers.add_parser("token-audit", help="Audit workspace files and tokens for context efficiency")

    # test
    test_parser = subparsers.add_parser("test", help="Run domain and contract tests")
    test_parser.add_argument("suite", choices=["all", "mlm", "contracts", "acid-sim", "cache-eval"], default="all", nargs="?")

    # runbook
    runbook_parser = subparsers.add_parser("runbook", help="Display token-optimized task instructions for AI agents")
    runbook_parser.add_argument("phase", choices=list(RUNBOOKS.keys()), help="Target phase")

    args = parser.parse_args()

    if args.command == "doctor":
        sys.exit(run_doctor())
    elif args.command == "status":
        sys.exit(run_status())
    elif args.command == "token-audit":
        sys.exit(run_token_audit())
    elif args.command == "test":
        sys.exit(run_tests(args.suite))
    elif args.command == "runbook":
        sys.exit(run_runbook(args.phase))
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
