from locust import HttpUser, task, between, events
import json
import os
import random
from datetime import datetime
import pandas as pd
import matplotlib.pyplot as plt

class UsuarioWavault(HttpUser):
    wait_time = between(1, 3)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user_id = random.randint(1000, 9999)  # ID único para cada usuario
    
    def on_start(self):
        """Inicio de sesión (si es necesario)"""
        print(f"➡️ Simulando nuevo usuario (ID: {self.user_id})")
    
    @task(80)
    def navegar_catalogo(self):
        """Simula navegación del catálogo (80% del tráfico)"""
        with self.client.get("/api/beats", catch_response=True) as response:
            if response.status_code == 200:
                print(f"✅ Usuario {self.user_id}: Catálogo cargado exitosamente")
            else:
                print(f"❌ Usuario {self.user_id}: Error cargando catálogo ({response.status_code})")
                response.failure(f"Error HTTP {response.status_code}")
        
    @task(20)
    def buscar_beats(self):
        """Simula búsquedas (20% del tráfico)"""
        términos = ["rap", "trap", "beats", "test"]
        término = random.choice(términos)
        with self.client.get(f"/api/beats/search?q={término}", catch_response=True) as response:
            if response.status_code == 200:
                print(f"✅ Usuario {self.user_id}: Búsqueda '{término}' completada")
            else:
                print(f"❌ Usuario {self.user_id}: Error en búsqueda ({response.status_code})")
                response.failure(f"Error HTTP {response.status_code}")

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n🚀 Iniciando prueba de carga de WAVAULT")
    print(f"📊 Objetivo: {environment.runner.target_user_count} usuarios")
    print(f"⏱️  Duración: {environment.runner.time_limit} segundos\n")

def generate_report(env):
    """Genera informe detallado en español"""
    now = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
    report_dir = os.path.join(os.getcwd(), "INFORMES_CARGA", "HISTORIAL")
    os.makedirs(report_dir, exist_ok=True)
    
    stats = env.stats
    
    # Preparar DataFrame para análisis
    df = pd.DataFrame([
        (r.name, r.num_requests, r.avg_response_time, r.median_response_time,
         r.percentile(0.95), r.num_failures) 
        for r in stats.entries.values()
    ], columns=['Endpoint', 'Peticiones', 'Media (ms)', 'Mediana (ms)', 'p95 (ms)', 'Fallos'])
    
    # Gráfica de tiempos
    plt.figure(figsize=(10, 6))
    df.plot(x='Endpoint', y=['Media (ms)', 'Mediana (ms)', 'p95 (ms)'], kind='bar')
    plt.title('Tiempos de Respuesta por Endpoint')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plot_path = os.path.join(report_dir, f"{now}_tiempos.png")
    plt.savefig(plot_path)
    
    # Generar informe en español
    tasa_error = (stats.total.num_failures/stats.total.num_requests)*100 if stats.total.num_requests > 0 else 0
    p95_total = stats.total.get_current_response_time_percentile(0.95)
    
    md_content = f"""# Informe de Prueba de Carga - {now}

## Configuración
- Usuarios simultáneos: {env.runner.target_user_count}
- Tasa de generación: {env.runner.spawn_rate} usuarios/segundo
- Duración: {env.runner.time_limit} segundos

## Resultados

### Resumen General
- Total Peticiones: {stats.total.num_requests:,}
- Peticiones Fallidas: {stats.total.num_failures:,}
- Tasa de Error: {tasa_error:.2f}%

### Tiempos de Respuesta
- Promedio: {stats.total.avg_response_time:.0f}ms
- Mediana: {stats.total.median_response_time:.0f}ms
- Percentil 95: {p95_total:.0f}ms

### Detalle por Endpoint
```
{df.to_markdown(index=False)}
```

### Gráfica de Tiempos
![Tiempos de Respuesta](./{now}_tiempos.png)

## Evaluación Final
**{
    "✅ PRUEBA EXITOSA" if tasa_error < 1 and p95_total < 5000
    else "❌ PRUEBA NO EXITOSA"
}**

Criterios evaluados:
- Tasa de error < 1%: {"✅" if tasa_error < 1 else "❌"}
- Tiempo p95 < 5000ms: {"✅" if p95_total < 5000 else "❌"}

{
    "El servidor se mantuvo estable y dentro de los parámetros esperados." 
    if tasa_error < 1 and p95_total < 5000
    else "El servidor no cumplió con los criterios de rendimiento establecidos."
}
"""
    
    report_path = os.path.join(report_dir, f"{now}.md")
    with open(report_path, "w", encoding="utf8") as f:
        f.write(md_content)
    
    print("\n📊 Resultados Finales:")
    print(f"- Peticiones totales: {stats.total.num_requests:,}")
    print(f"- Tasa de error: {tasa_error:.2f}%")
    print(f"- Tiempo promedio: {stats.total.avg_response_time:.0f}ms")
    print(f"- Tiempo p95: {p95_total:.0f}ms")
    print(f"\n📝 Informe generado en: {report_path}")

events.test_stop.add_listener(generate_report)