import sqlite3
import csv
import re
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "minimarket.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")
CSV_PATH = os.path.join(os.path.dirname(__file__), "seed_products.csv")

def parse_price(val):
    if not val:
        return 0.0
    clean = re.sub(r'[^\d.]', '', val.replace(',', '.'))
    try:
        return float(clean)
    except ValueError:
        return 0.0

def parse_float(val):
    if not val:
        return 0.0
    try:
        return float(val.strip().replace(',', '.'))
    except ValueError:
        return 0.0

def main():
    print(f"Creando base de datos SQLite en: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        cursor.executescript(f.read())

    # Iniciar usuario administrador por defecto
    cursor.execute("""
        INSERT OR IGNORE INTO usuarios (id, nombre, usuario, pin, rol)
        VALUES (1, 'ADMINISTRADOR', 'admin', '1234', 'admin')
    """)

    # Iniciar configuraciones por defecto
    default_config = [
        ('nombre_negocio', 'MINIMARKET POS', 'Nombre que aparece en tickets y pantalla'),
        ('moneda_simbolo', '$', 'Símbolo de divisa principal'),
        ('impresora_tipo', 'ESC/POS', 'Driver de impresión'),
        ('impresora_ancho', '80mm', 'Ancho de papel de ticket'),
        ('abrir_cajon_al_cobrar', '1', 'Disparar pulso al cajón al imprimir ticket'),
        ('bascula_habilitada', '1', 'Activar lectura por puerto serial RS232'),
        ('bascula_puerto', 'COM1', 'Puerto serial asignado a la báscula'),
        ('bascula_baudrate', '9600', 'Velocidad en baudios de la báscula')
    ]
    for k, v, d in default_config:
        cursor.execute("INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES (?, ?, ?)", (k, v, d))

    # Cargar Departamentos y Productos
    departamentos_map = {}
    
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            codigo = row['Código'].strip()
            producto = row['Producto'].strip()
            p_costo = parse_price(row['P. Costo'])
            p_venta = parse_price(row['P. Venta'])
            p_mayoreo = parse_price(row['P. Mayoreo'])
            existencia = parse_float(row['Existencia'])
            inv_minimo = parse_float(row['Inv. Mínimo'])
            inv_maximo = parse_float(row['Inv. Máximo'])
            depto_nombre = row['Departamento'].strip() or 'GENERAL'

            # Get or create department
            if depto_nombre not in departamentos_map:
                cursor.execute("INSERT OR IGNORE INTO departamentos (nombre) VALUES (?)", (depto_nombre,))
                cursor.execute("SELECT id FROM departamentos WHERE nombre = ?", (depto_nombre,))
                departamentos_map[depto_nombre] = cursor.fetchone()[0]

            depto_id = departamentos_map[depto_nombre]

            # Si la existencia tiene decimales o es charcutería/carnicería, marcar como granel
            tipo_venta = 'granel' if (depto_nombre in ['CHARCUTERIA', 'CARNICERIA', 'HORTALIZAS'] or existencia % 1 != 0) else 'unidad'
            unidad_medida = 'KG' if tipo_venta == 'granel' else 'PZA'

            # Calcular porcentaje de ganancia
            ganancia_pct = 0.0
            if p_costo > 0 and p_venta > p_costo:
                ganancia_pct = round(((p_venta - p_costo) / p_costo) * 100, 2)

            cursor.execute("""
                INSERT OR REPLACE INTO productos (
                    codigo, producto, tipo_venta, precio_costo, ganancia_porcentaje,
                    precio_venta, precio_mayoreo, existencia, inv_minimo, inv_maximo,
                    departamento_id, unidad_medida, usa_inventario, activo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            """, (
                codigo, producto, tipo_venta, p_costo, ganancia_pct,
                p_venta, p_mayoreo, existencia, inv_minimo, inv_maximo,
                depto_id, unidad_medida
            ))
            count += 1

    conn.commit()
    cursor.execute("SELECT COUNT(*) FROM productos")
    total_prods = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM departamentos")
    total_deptos = cursor.fetchone()[0]

    print(f"Importación completada con éxito:")
    print(f" -> {total_prods} productos importados")
    print(f" -> {total_deptos} departamentos creados")
    conn.close()

if __name__ == "__main__":
    main()
