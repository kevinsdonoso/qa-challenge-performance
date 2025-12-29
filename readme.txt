================================================================================
                    README - QA CHALLENGE PERFORMANCE
                    Pruebas de Carga con K6
================================================================================

DESCRIPCIÓN:
Prueba de carga del servicio de login de la API FakeStoreAPI utilizando K6.
El script realiza peticiones POST al endpoint de autenticación con datos
parametrizados desde un archivo CSV.

OBJETIVO:
- Alcanzar mínimo 20 TPS (Transacciones Por Segundo)
- Tiempo de respuesta máximo permitido: 1.5 segundos
- Tasa de error aceptable: menor al 3%

================================================================================
1. PREREQUISITOS
================================================================================

Para ejecutar este proyecto se requiere:

- Sistema Operativo: Windows 10 / Windows 11
- K6: versión 1.4.2 o superior (probado con v1.4.2)

INSTALACIÓN DE K6 EN WINDOWS:

Opción 1 - Chocolatey:
    choco install k6

Opción 2 - Winget:
    winget install k6 --source winget

Opción 3 - Descarga directa (MSI):
    https://dl.k6.io/msi/k6-latest-amd64.msi

VERIFICAR INSTALACIÓN:

    k6 version
    (Debe mostrar: k6 v1.4.2 o superior)

================================================================================
2. ESTRUCTURA DEL PROYECTO
================================================================================

    qa-challenge-performance/
    ├── load-test.js          <- Script principal de K6
    ├── data/
    │   └── users.csv         <- Datos parametrizados (CSV)
    ├── reports/              <- Reportes generados (evidencia)
    │   ├── summary.json
    │   └── textSummary.txt
    ├── readme.txt
    └── conclusiones.txt

================================================================================
3. DATOS DE ENTRADA (CSV)
================================================================================

Ubicación: data/users.csv

Formato requerido:
    user,passwd

Contenido:
    user,passwd
    donero,ewedon
    kevinryan,kev02937@
    johnd,m38rmF$
    derek,jklg*_56
    mor_2314,83r5^_

================================================================================
4. INSTRUCCIONES PARA EJECUTAR LA PRUEBA
================================================================================

PASO 1: Ir al directorio del proyecto

    cd qa-challenge-performance

PASO 2: Crear carpeta de reportes (si no existe)

    mkdir reports

PASO 3: Ejecutar la prueba de carga (20 TPS)

    k6 run .\load-test.js

NOTAS:
- El script genera automáticamente los reportes en la carpeta "reports/"
  mediante la función handleSummary().
- El throughput observado puede variar levemente (ej. 19.88 RPS) por timing y
  condiciones de red; el escenario está configurado a 20 iters/s.

PASO 4: Ver reportes generados

    - reports/summary.json      -> Resumen completo en formato JSON (evidencia)
    - reports/textSummary.txt   -> Resumen en texto plano

================================================================================
5. REPORTES / EVIDENCIA
================================================================================

Al ejecutar:

    k6 run .\load-test.js

K6 genera automáticamente evidencias en la carpeta:

    reports/

Archivos generados:
- reports/textSummary.txt  -> Resumen en texto (métricas principales, checks, thresholds)
- reports/summary.json     -> Resultados completos en JSON (detalle por métricas)

Como abrirlos en Windows (opcional):
    notepad .\reports\textSummary.txt
    notepad .\reports\summary.json

================================================================================
6. CONFIGURACIÓN DEL ESCENARIO
================================================================================

El script está configurado con los siguientes parámetros:

    | Parámetro          | Valor                           |
    |--------------------|----------------------------------|
    | Executor           | constant-arrival-rate            |
    | Rate (TPS)         | 20 iteraciones/segundo           |
    | Duración           | 1 minuto                         |
    | VUs Pre-asignados  | 25                               |
    | VUs Máximos        | 50                               |

================================================================================
7. THRESHOLDS (UMBRALES DE ACEPTACIÓN)
================================================================================

    | Métrica            | Umbral                          |
    |--------------------|----------------------------------|
    | http_req_duration  | p(95) < 1500ms (1.5 segundos)   |
    | http_req_failed    | rate < 0.03 (menor al 3%)       |
    | logical_error_rate | rate < 0.03 (menor al 3%)       |

NOTA:
- http_req_failed mide fallos HTTP (errores de transporte/HTTP).
- logical_error_rate mide fallos lógicos funcionales (status/token).
- Adicionalmente se realiza un check informativo de tiempo por request (<= 1.5s).

================================================================================
8. API UTILIZADA
================================================================================

API: FakeStoreAPI
Endpoint probado (según CURL proporcionado): POST https://fakestoreapi.com/auth/login

CURL proporcionado:
curl --location --max-time 60 'https://fakestoreapi.com/auth/login' ^
--header 'Content-Type: application/json' ^
--data '{
  "username": "user",
  "password": "passwd"
}'

Ejemplo de Request (JSON):
    {
        "username": "johnd",
        "password": "m38rmF$"
    }

Ejemplo de Response:
    {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }

================================================================================
9. TECNOLOGÍAS Y VERSIONES
================================================================================

    | Tecnología | Versión          |
    |------------|------------------|
    | K6         | 1.4.2 o superior |
    | Windows    | 10/11            |

================================================================================
10. VALIDACIONES IMPLEMENTADAS
================================================================================

El script valida:

1) Status Code: Respuesta exitosa (2xx)
2) Response Body: Debe contener un token
3) Tiempo de Respuesta: Menor o igual a 1.5 segundos (check informativo por request)
4) Umbrales (thresholds):
   - p(95) de http_req_duration < 1500ms
   - http_req_failed < 3%
   - logical_error_rate < 3%

NOTA:
- La API puede responder 201 (Created) para login, por lo que se valida status 2xx.

================================================================================
11. MÉTRICAS GENERADAS
================================================================================

Métricas principales:
- http_reqs: Total de requests realizados
- http_req_duration: Tiempo de respuesta (avg, min, max, p95)
- http_req_failed: Tasa de requests fallidos (HTTP)
- logical_error_rate: Tasa de fallos de validaciones (lógico)
- response_time: Tiempo de respuesta personalizado (Trend)

================================================================================
AUTOR: Kevin Donoso
================================================================================